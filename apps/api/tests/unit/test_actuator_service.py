"""Unit tests for Multi-Turn Actuator Safety Guard."""

import pytest
from fastapi import HTTPException
from app.services.actuator_service import (
    ActuatorAction,
    ActuationRequest,
    MultiTurnActuatorGuard,
)


def test_actuator_idempotency_and_rollback():
    """Verify actuator executes mutation, captures rollback snapshot, and enforces idempotency."""
    guard = MultiTurnActuatorGuard()
    req = ActuationRequest(
        action_type=ActuatorAction.ADJUST_WORK_ALLOCATION,
        tenant_id="tenant-mfg-01",
        target_id="TSK-PACK-01",
        idempotency_key="IDEM-001-A",
        mutation_payload={"human_work_pct": 40.0, "agent_work_pct": 60.0},
        risk_tier="T2",
        session_turn_depth=1,
    )

    # 1. First execution -> APPLIED
    res1 = guard.execute_actuation(req, current_target_state={"human_work_pct": 100.0, "agent_work_pct": 0.0})
    assert res1.status == "APPLIED"
    assert res1.rollback_token is not None

    # 2. Duplicate submission with same idempotency key -> ALREADY_APPLIED
    res2 = guard.execute_actuation(req)
    assert res2.status == "ALREADY_APPLIED"
    assert res2.mutation_id == res1.mutation_id

    # 3. Rollback
    rb_res = guard.rollback(res1.rollback_token)
    assert rb_res["status"] == "ROLLED_BACK"
    assert rb_res["restored_state"]["human_work_pct"] == 100.0

    # 4. Unknown rollback token
    with pytest.raises(HTTPException) as exc:
        guard.rollback("INVALID-TOKEN")
    assert exc.value.status_code == 404


def test_actuator_turn_depth_circuit_breaker():
    """Verify actuator trips circuit breaker when autonomous turn depth exceeds limit."""
    guard = MultiTurnActuatorGuard(max_turn_depth=3)
    req = ActuationRequest(
        action_type=ActuatorAction.MUTATE_WORKGRAPH,
        tenant_id="tenant-mfg-01",
        target_id="NODE-CLINICAL-01",
        idempotency_key="IDEM-DEPTH-01",
        mutation_payload={"automation_factor": 0.5},
        risk_tier="T2",
        session_turn_depth=4,  # Exceeds max 3
    )

    with pytest.raises(HTTPException) as exc:
        guard.execute_actuation(req)
    assert exc.value.status_code == 429
    assert "ACTUATOR_CIRCUIT_BREAKER" in exc.value.detail


def test_actuator_sanctuary_and_critical_redlines():
    """Verify actuator blocks 0% human work on critical nodes and preserves shielded sanctuary tasks."""
    guard = MultiTurnActuatorGuard()

    # Case A: Shielded sanctuary work reduced below 50%
    req_shielded = ActuationRequest(
        action_type=ActuatorAction.ADJUST_WORK_ALLOCATION,
        tenant_id="tenant-mfg-01",
        target_id="TSK-GRIEF-01",
        idempotency_key="IDEM-SHIELD-01",
        mutation_payload={"human_work_pct": 20.0, "is_shielded_sanctuary": True},
        risk_tier="T2",
    )
    with pytest.raises(HTTPException) as exc:
        guard.execute_actuation(req_shielded)
    assert exc.value.status_code == 400
    assert "ERR_SHIELDED_SANCTUARY_MUTATION" in exc.value.detail

    # Case B: 0% human work on life-critical T4 node
    req_t4_zero = ActuationRequest(
        action_type=ActuatorAction.ADJUST_WORK_ALLOCATION,
        tenant_id="tenant-mfg-01",
        target_id="TSK-TRIAGE-01",
        idempotency_key="IDEM-T4-01",
        mutation_payload={"human_work_pct": 0.0},
        risk_tier="T4",
    )
    with pytest.raises(HTTPException) as exc:
        guard.execute_actuation(req_t4_zero)
    assert exc.value.status_code == 400
    assert "ERR_ZERO_HUMAN_SHARE_CRITICAL" in exc.value.detail


def test_actuator_a2_human_approval_gate():
    """Verify T3/T4 actuation is blocked without valid A2 Human Approval Token."""
    guard = MultiTurnActuatorGuard()

    # Missing A2 token
    req_blocked = ActuationRequest(
        action_type=ActuatorAction.MUTATE_WORKGRAPH,
        tenant_id="tenant-mfg-01",
        target_id="TSK-RAD-01",
        idempotency_key="IDEM-GATE-01",
        mutation_payload={"speed_multiplier": 5.0},
        risk_tier="T3",
        human_approval_token=None,
    )
    res = guard.execute_actuation(req_blocked)
    assert res.status == "BLOCKED_NEED_A2"
    assert "Mandatory A2 Human Approval Token required" in res.message

    # With valid A2 token
    req_approved = ActuationRequest(
        action_type=ActuatorAction.MUTATE_WORKGRAPH,
        tenant_id="tenant-mfg-01",
        target_id="TSK-RAD-01",
        idempotency_key="IDEM-GATE-02",
        mutation_payload={"speed_multiplier": 5.0},
        risk_tier="T3",
        human_approval_token="TOKEN-A2-APPROVED-DR-CHEN-2026",
    )
    res_ok = guard.execute_actuation(req_approved)
    assert res_ok.status == "APPLIED"
