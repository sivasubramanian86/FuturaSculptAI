"""Multi-Turn Actuator Safety Guard and Mutation Ledger for Google ADK Mesh.

Enforces 5 non-negotiable checks across multi-turn autonomous actuations:
  1. Idempotency Token Enforcement (prevents double execution)
  2. Reversibility & Rollback Snapshot Ledger (every mutation can be undone)
  3. Blast Radius & A2 Gate Binding (T3/T4 life-critical nodes require human sign-off token)
  4. Cascade Depth Circuit Breaker (max 3 consecutive autonomous turns)
  5. Responsible Workforce Red-Line Barrier (prohibiting 0% human share on shielded sanctuary work)
"""

from datetime import datetime, timezone
from enum import Enum
import hashlib
import json
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from pydantic import BaseModel, Field


class ActuatorAction(str, Enum):
    """Supported state-altering operational actuation types."""

    MUTATE_WORKGRAPH = "mutate_workgraph"
    ADJUST_WORK_ALLOCATION = "adjust_work_allocation"
    TRIGGER_A2_GATE = "trigger_a2_gate"
    BRANCH_SCENARIO = "branch_scenario"


class ActuationRequest(BaseModel):
    """Payload submitted to an actuator for an operational state change."""

    action_type: ActuatorAction
    tenant_id: str
    target_id: str  # Task ID or Node ID
    idempotency_key: str
    mutation_payload: Dict[str, Any]
    risk_tier: str = "T2"  # T1 (Routine), T2 (Managed), T3 (Critical), T4 (Life-Critical)
    human_approval_token: Optional[str] = None
    session_turn_depth: int = Field(default=1, ge=1, le=10)


class ActuationSnapshot(BaseModel):
    """Snapshot record allowing deterministic rollback of an actuation."""

    mutation_id: str
    tenant_id: str
    target_id: str
    action_type: ActuatorAction
    applied_at: str
    previous_state: Dict[str, Any]
    applied_payload: Dict[str, Any]
    rollback_token: str


class ActuationResult(BaseModel):
    """Outcome of an evaluated actuation request."""

    mutation_id: str
    status: str  # APPLIED, BLOCKED_NEED_A2, REJECTED_RED_LINE, ALREADY_APPLIED
    message: str
    rollback_token: Optional[str] = None
    audit_hash: str


class MultiTurnActuatorGuard:
    """Evaluates and executes stateful actuations with cryptographic rollback capabilities."""

    def __init__(self, max_turn_depth: int = 3):
        """Initialize guard with turn depth cap and in-memory ledgers."""
        self.max_turn_depth = max_turn_depth
        # idempotency_key -> ActuationResult
        self._idempotency_cache: Dict[str, ActuationResult] = {}
        # mutation_id -> ActuationSnapshot
        self._rollback_ledger: Dict[str, ActuationSnapshot] = {}

    def _hash_audit(self, req: ActuationRequest, status_val: str) -> str:
        """Compute SHA-256 audit fingerprint."""
        raw = f"{req.tenant_id}:{req.target_id}:{req.idempotency_key}:{status_val}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def execute_actuation(
        self,
        req: ActuationRequest,
        current_target_state: Optional[Dict[str, Any]] = None,
    ) -> ActuationResult:
        """Execute a state mutation adhering to the 5 safety gates.

        Args:
            req: ActuationRequest with action type, idempotency key, and risk tier.
            current_target_state: Current state before mutation for rollback capture.

        Returns:
            ActuationResult: Result indicating whether mutation was APPLIED, BLOCKED, or REJECTED.

        Raises:
            HTTPException: On critical policy breaches.
        """
        # 1. Idempotency Check
        if req.idempotency_key in self._idempotency_cache:
            prior = self._idempotency_cache[req.idempotency_key]
            return ActuationResult(
                mutation_id=prior.mutation_id,
                status="ALREADY_APPLIED",
                message=f"Actuation {req.idempotency_key} already processed idempotently.",
                rollback_token=prior.rollback_token,
                audit_hash=prior.audit_hash,
            )

        # 2. Autonomous Cascade Depth Circuit Breaker
        if req.session_turn_depth > self.max_turn_depth:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"ACTUATOR_CIRCUIT_BREAKER: Autonomous actuation depth {req.session_turn_depth} "
                    f"exceeds safety ceiling ({self.max_turn_depth}). Human supervisory pause required."
                ),
            )

        # 3. Responsible Workforce Red-Line Barrier (Sanctuary tasks & zero human share)
        if req.action_type == ActuatorAction.ADJUST_WORK_ALLOCATION:
            human_share = req.mutation_payload.get("human_work_pct", 100.0)
            is_shielded = req.mutation_payload.get("is_shielded_sanctuary", False)
            if is_shielded and human_share < 50.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "POLICY VIOLATION [ERR_SHIELDED_SANCTUARY_MUTATION]: "
                        "Shielded sanctuary tasks must maintain at least 50% human ownership."
                    ),
                )
            if human_share <= 0.0 and req.risk_tier in ("T3", "T4"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "POLICY VIOLATION [ERR_ZERO_HUMAN_SHARE_CRITICAL]: "
                        "Complete autonomous automation (0% human) is strictly prohibited on T3/T4 nodes."
                    ),
                )

        # 4. Blast Radius & Mandatory A2 Sign-Off Gate for T3/T4
        if req.risk_tier in ("T3", "T4"):
            if not req.human_approval_token or not req.human_approval_token.startswith("TOKEN-A2-APPROVED-"):
                audit_h = self._hash_audit(req, "BLOCKED_NEED_A2")
                mut_id = f"MUT-GATE-{audit_h[:8].upper()}"
                res = ActuationResult(
                    mutation_id=mut_id,
                    status="BLOCKED_NEED_A2",
                    message=(
                        f"Target {req.target_id} has Risk Tier {req.risk_tier}. "
                        "Actuator halted. Mandatory A2 Human Approval Token required before mutation."
                    ),
                    rollback_token=None,
                    audit_hash=audit_h,
                )
                self._idempotency_cache[req.idempotency_key] = res
                return res

        # 5. Reversibility & Rollback Snapshot Capture
        now_iso = datetime.now(timezone.utc).isoformat()
        audit_h = self._hash_audit(req, "APPLIED")
        mut_id = f"MUT-{req.action_type.value[:4].upper()}-{audit_h[:8].upper()}"
        rollback_tok = f"RBK-{mut_id}"

        snapshot = ActuationSnapshot(
            mutation_id=mut_id,
            tenant_id=req.tenant_id,
            target_id=req.target_id,
            action_type=req.action_type,
            applied_at=now_iso,
            previous_state=current_target_state or {},
            applied_payload=req.mutation_payload,
            rollback_token=rollback_tok,
        )
        self._rollback_ledger[rollback_tok] = snapshot

        result = ActuationResult(
            mutation_id=mut_id,
            status="APPLIED",
            message=f"Actuation {req.action_type.value} successfully applied to {req.target_id}.",
            rollback_token=rollback_tok,
            audit_hash=audit_h,
        )
        self._idempotency_cache[req.idempotency_key] = result
        return result

    def rollback(self, rollback_token: str) -> Dict[str, Any]:
        """Roll back a previous actuation using its cryptographic rollback token.

        Args:
            rollback_token: Token issued at actuation time.

        Returns:
            Dict[str, Any]: Restored state details.

        Raises:
            HTTPException: If rollback token is unrecognized.
        """
        if rollback_token not in self._rollback_ledger:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ROLLBACK_ERROR: Token '{rollback_token}' not found in audit ledger.",
            )
        snapshot = self._rollback_ledger[rollback_token]
        return {
            "status": "ROLLED_BACK",
            "mutation_id": snapshot.mutation_id,
            "target_id": snapshot.target_id,
            "restored_state": snapshot.previous_state,
        }


actuator_guard = MultiTurnActuatorGuard()
