"""Automated test suite for dynamic Gemini model invocation, multi-tier routing, and Gatekeeper guardrails."""

import json
from typing import List
from unittest.mock import patch

import pytest
from pydantic import BaseModel, Field

from app.adapters.vertex_adapter import (
    ModelTier,
    VertexAIAdapter,
)
from app.agents.tools import (
    MAX_ALLOWED_TURNS,
    ToolGatekeeper,
    calculate_deterministic_rri,
    calculate_finops_roi,
    inspect_workgraph_node,
)


class WorkforceEvolutionDecision(BaseModel):
    """Structured Pydantic v2 test schema for AI Builder Cup verification."""

    decision_id: str = Field(..., description="Unique decision token.")
    target_role: str = Field(..., description="Target role identifier.")
    human_retention_pct: float = Field(..., ge=0.0, le=100.0)
    agent_automation_pct: float = Field(..., ge=0.0, le=100.0)
    recommended_tools: List[str] = Field(default_factory=list)
    compliance_passed: bool = True


# =============================================================================
# 1. Dynamic Model Routing Across Tiers
# =============================================================================

def test_dynamic_model_routing_across_tiers():
    """Verify dynamic model resolution handles tier aliases, keywords, and explicit tags."""
    adapter = VertexAIAdapter()

    # Flash / Workhorse Tier
    assert adapter.resolve_model_name("flash") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("lightweight") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("workhorse") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("gemini-3.5-flash") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("gemini-2.5-flash") == "gemini-2.5-flash"

    # Pro / Deep Reasoning Tier
    assert adapter.resolve_model_name("pro") == "gemini-3.1-pro-preview"
    assert adapter.resolve_model_name("reasoning") == "gemini-3.1-pro-preview"
    assert adapter.resolve_model_name("deep_reasoning") == "gemini-3.1-pro-preview"

    # High-Volume Utility Tier
    assert adapter.resolve_model_name("lite") == "gemini-3.5-flash-lite"
    assert adapter.resolve_model_name("high_volume_utility") == "gemini-3.5-flash-lite"

    # Frontier / Argon Workspace Tier
    assert adapter.resolve_model_name("argon") == "gemini-4-argon"
    assert adapter.resolve_model_name("frontier") == "gemini-4-argon"
    assert adapter.resolve_model_name("frontier_workspace") == "gemini-4-argon"

    # Direct custom model preservation
    assert adapter.resolve_model_name("custom-tuned-gemini") == "custom-tuned-gemini"


# =============================================================================
# 2. Structured JSON Output with Pydantic Schema
# =============================================================================

@pytest.mark.asyncio
async def test_structured_pydantic_schema_generation():
    """Verify native Pydantic v2 structured output parse and validation."""
    adapter = VertexAIAdapter()
    adapter.mock_mode = True

    mock_payload = {
        "decision_id": "DEC-2026-001",
        "target_role": "ROL-001 Packaging Technician",
        "human_retention_pct": 65.0,
        "agent_automation_pct": 35.0,
        "recommended_tools": ["Edge-TPU Vision Scanner", "Automated Seal Triage"],
        "compliance_passed": True,
    }

    decision = await adapter.generate_structured(
        prompt="Synthesize workforce transformation for packaging line.",
        schema=WorkforceEvolutionDecision,
        model_tier=ModelTier.DEEP_REASONING,
        mock_data=mock_payload,
    )

    assert isinstance(decision, WorkforceEvolutionDecision)
    assert decision.decision_id == "DEC-2026-001"
    assert decision.human_retention_pct == 65.0
    assert decision.agent_automation_pct == 35.0
    assert decision.compliance_passed is True
    assert len(decision.recommended_tools) == 2


# =============================================================================
# 3. Dynamic Tier Downgrade and Fallback on Transient Failure
# =============================================================================

@pytest.mark.asyncio
async def test_transient_failure_dynamic_tier_downgrade():
    """Verify router automatically downgrades to Flash when Pro tier encounters transient failures."""
    adapter = VertexAIAdapter()
    adapter.mock_mode = False

    # Mock primary Pro model failure (e.g. HTTP 503 or 429), while fallback Flash succeeds
    async def mock_generate_text(prompt, model_name=None, **kwargs):
        if "pro" in str(model_name):
            return {
                "content": "[Live Gateway Fallback for gemini-3.8-pro-001]: Rate limit exceeded.",
                "model_used": model_name,
                "input_tokens": 50,
                "output_tokens": 10,
                "total_tokens": 60,
                "estimated_cost_usd": 0.0,
                "cached_hit": False,
                "fallback_applied": True,
            }
        else:
            return {
                "content": json.dumps({
                    "decision_id": "DEC-FALLBACK-002",
                    "target_role": "ROL-002",
                    "human_retention_pct": 50.0,
                    "agent_automation_pct": 50.0,
                    "recommended_tools": [],
                    "compliance_passed": True,
                }),
                "model_used": model_name,
                "input_tokens": 50,
                "output_tokens": 40,
                "total_tokens": 90,
                "estimated_cost_usd": 0.00002,
                "cached_hit": False,
                "fallback_applied": False,
            }

    with patch.object(adapter, "generate_text", side_effect=mock_generate_text):
        res = await adapter.generate_with_dynamic_fallback(
            prompt="Analyze transformation scenario under load",
            primary_model="gemini-3.8-pro-001",
            fallback_model="gemini-3.8-flash-001",
            schema=WorkforceEvolutionDecision,
        )

        assert res["downgraded_from"] == "gemini-3.8-pro-001"
        assert res["fallback_applied"] is True
        assert res["model_used"] == "gemini-3.8-flash-001"
        assert "parsed" in res
        assert isinstance(res["parsed"], WorkforceEvolutionDecision)
        assert res["parsed"].decision_id == "DEC-FALLBACK-002"


# =============================================================================
# 4. Token Usage Metadata and Latency Telemetry
# =============================================================================

@pytest.mark.asyncio
async def test_token_telemetry_and_latency_logging():
    """Verify input, output, and total token count telemetry with execution latency."""
    adapter = VertexAIAdapter()
    adapter.mock_mode = True

    res = await adapter.generate_text("Predict skill shift for food manufacturing technician", model_name="gemini-3.8-flash-001")

    assert res["model_used"] == "gemini-3.8-flash-001"
    assert res["input_tokens"] > 0
    assert res["output_tokens"] > 0
    assert res["total_tokens"] == res["input_tokens"] + res["output_tokens"]
    assert res["latency_ms"] >= 0.0
    assert res["estimated_cost_usd"] > 0.0
    assert res["fallback_applied"] is False


# =============================================================================
# 5. Gatekeeper Invariant Enforcement (Bounds & Sanity Checking)
# =============================================================================

def test_gatekeeper_deterministic_invariants():
    """Verify Gatekeeper enforces bounds, positive numbers, and prefix invariants."""
    gk = ToolGatekeeper()
    run_id = "RUN-TEST-INVARIANTS"

    # Case A: Negative numbers in FinOps ROI -> Rejected
    bad_roi = gk.intercept_and_execute(
        calculate_finops_roi,
        "calculate_finops_roi",
        {"annual_savings_usd": -500.0, "token_cost_usd": 100.0},
        run_id=run_id,
    )
    assert bad_roi.status == "REJECTED_INVARIANT"
    assert bad_roi.confidence_score == 0.0
    assert "Invariant violation" in bad_roi.error_message

    # Case B: Horizon years exceeding [1..5] bounds -> Rejected
    bad_rri = gk.intercept_and_execute(
        calculate_deterministic_rri,
        "calculate_deterministic_rri",
        {"horizon_years": 10, "automation_pct": 50.0},
        run_id=run_id,
    )
    assert bad_rri.status == "REJECTED_INVARIANT"

    # Case C: Malformed node ID without standard prefix -> Rejected
    bad_node = gk.intercept_and_execute(
        inspect_workgraph_node,
        "inspect_workgraph_node",
        {"tenant_id": "tenant-01", "node_id": "INVALID-123"},
        run_id=run_id,
    )
    assert bad_node.status == "REJECTED_INVARIANT"

    # Case D: Valid invocation -> Success with cryptographic hash
    valid_call = gk.intercept_and_execute(
        calculate_deterministic_rri,
        "calculate_deterministic_rri",
        {"horizon_years": 3, "automation_pct": 40.0},
        run_id=run_id,
    )
    assert valid_call.status == "SUCCESS"
    assert valid_call.confidence_score == 1.0
    assert valid_call.output is not None
    assert len(valid_call.provenance_hash) == 64


# =============================================================================
# 6. Circuit Breaker: Hard Turn Cap (max_turns <= 8)
# =============================================================================

def test_gatekeeper_circuit_breaker_max_turns():
    """Verify gatekeeper trips the circuit breaker when turn count exceeds 8."""
    gk = ToolGatekeeper(max_turns=MAX_ALLOWED_TURNS)
    run_id = "RUN-CIRCUIT-BREAKER"

    # Execute 8 unique turns successfully
    for i in range(MAX_ALLOWED_TURNS):
        call_res = gk.intercept_and_execute(
            calculate_deterministic_rri,
            "calculate_deterministic_rri",
            {"horizon_years": 1, "automation_pct": float(i * 10)},
            run_id=run_id,
        )
        assert call_res.status == "SUCCESS"

    # 9th turn must trip circuit breaker
    overflow_res = gk.intercept_and_execute(
        calculate_deterministic_rri,
        "calculate_deterministic_rri",
        {"horizon_years": 2, "automation_pct": 99.0},
        run_id=run_id,
    )
    assert overflow_res.status == "CIRCUIT_BREAKER_TRIPPED"
    assert overflow_res.confidence_score == 0.0
    assert "Hard turn cap reached: 8/8" in overflow_res.error_message


# =============================================================================
# 7. Deadlock Prevention: Consecutive Duplicate Call Trapping
# =============================================================================

def test_gatekeeper_deadlock_detection():
    """Verify consecutive duplicate tool calls are trapped immediately as potential infinite loops."""
    gk = ToolGatekeeper()
    run_id = "RUN-DEADLOCK-TEST"

    # First call -> Success
    res1 = gk.intercept_and_execute(
        inspect_workgraph_node,
        "inspect_workgraph_node",
        {"tenant_id": "tenant-01", "node_id": "ROL-001"},
        run_id=run_id,
    )
    assert res1.status == "SUCCESS"

    # Exact duplicate call immediately following -> Deadlock trapped
    res2 = gk.intercept_and_execute(
        inspect_workgraph_node,
        "inspect_workgraph_node",
        {"tenant_id": "tenant-01", "node_id": "ROL-001"},
        run_id=run_id,
    )
    assert res2.status == "DEADLOCK_DETECTED"
    assert res2.confidence_score == 0.0
    assert "Consecutive duplicate call trapped" in res2.error_message
