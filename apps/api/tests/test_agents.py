"""Unit tests for Google ADK Multi-Agent Swarm Orchestrator and Autonomy Gates."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.agent_swarm import AutonomyTier

client = TestClient(app)


def test_run_swarm_standard_success():
    """Verify standard multi-agent swarm run executing complete deliberation loop."""
    payload = {
        "scenario_prompt": "Augment high-speed seal verification with Edge-TPU vision sensors.",
        "sector": "food_manufacturing",
        "target_role_id": "ROL-001",
        "target_capability_id": "CAP-001",
        "evidence_ids": ["EVD-SOP-01", "EVD-STRAT-01"],
        "horizon_years": 3,
    }
    response = client.post(
        "/api/v1/agents/swarm/run",
        json=payload,
        headers={"X-Tenant-ID": "tenant-food-mfg-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert data["status"] == "REQUIRES_APPROVAL"  # Horizon 3 triggers A2 approval gate
    assert data["autonomy_gate"] == AutonomyTier.A2_APPROVAL_GATE.value
    assert len(data["trajectories"]) == 6  # 6 specialist deliberation steps
    assert data["synthesis"]["projected_agent_work_pct"] > 0
    assert data["synthesis"]["citations"] == ["EVD-SOP-01", "EVD-STRAT-01"]


def test_run_swarm_short_horizon_completed_status():
    """Verify horizon 1 year sets A1 recommendation and COMPLETED status."""
    payload = {
        "scenario_prompt": "Pilot assisted camera inspection for frontline operators.",
        "horizon_years": 1,
    }
    response = client.post(
        "/api/v1/agents/swarm/run",
        json=payload,
        headers={"X-Tenant-ID": "tenant-food-mfg-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["autonomy_gate"] == AutonomyTier.A1_RECOMMENDATION.value
    assert len(data["synthesis"]["citations"]) >= 1


def test_run_swarm_blocked_by_red_line_interceptor():
    """Verify Responsible Workforce red-line policy halts autonomous termination proposals."""
    prohibited_payload = {
        "scenario_prompt": "Terminate all human inspection operators immediately and replace with AI.",
        "horizon_years": 1,
    }
    response = client.post(
        "/api/v1/agents/swarm/run",
        json=prohibited_payload,
        headers={"X-Tenant-ID": "tenant-food-mfg-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED_BY_POLICY"
    assert data["autonomy_gate"] == AutonomyTier.A4_DISALLOWED.value
    assert "VIOLATION DETECTED" in data["trajectories"][1]["observation"]
    assert data["synthesis"]["compliance_verdict"] == "REJECTED_A4_BREACH"


def test_get_swarm_run_detail_and_tenant_isolation():
    """Verify retrieving run by ID and tenant boundary enforcement."""
    # 1. Create a run
    payload = {
        "scenario_prompt": "Deploy collaborative robotics for package sealing.",
        "horizon_years": 2,
    }
    create_resp = client.post(
        "/api/v1/agents/swarm/run",
        json=payload,
        headers={"X-Tenant-ID": "tenant-food-mfg-01"},
    )
    assert create_resp.status_code == 200
    run_id = create_resp.json()["run_id"]

    # 2. Retrieve with same tenant
    get_resp = client.get(
        f"/api/v1/agents/swarm/runs/{run_id}",
        headers={"X-Tenant-ID": "tenant-food-mfg-01"},
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["run_id"] == run_id

    # 3. Retrieve with different tenant (rejected with 404)
    isolated_resp = client.get(
        f"/api/v1/agents/swarm/runs/{run_id}",
        headers={"X-Tenant-ID": "tenant-attacker-99"},
    )
    assert isolated_resp.status_code == 404

    # 4. Nonexistent run ID
    resp_404 = client.get(
        "/api/v1/agents/swarm/runs/RUN-NONEXISTENT",
        headers={"X-Tenant-ID": "tenant-food-mfg-01"},
    )
    assert resp_404.status_code == 404


def test_sync_swarm_orchestrator_run():
    """Verify synchronous wrapper execution."""
    import asyncio

    from app.agents import swarm_orchestrator
    from app.models.agent_swarm import SwarmRunRequest

    req = SwarmRunRequest(
        scenario_prompt="Validate robotic sorting cells.",
        horizon_years=2,
    )

    # 1. Direct call outside running loop
    res = swarm_orchestrator.run_swarm(tenant_id="tenant-food-mfg-01", request=req)
    assert res.run_id.startswith("RUN-")
    assert res.status == "COMPLETED"

    # 2. Call inside running loop to exercise ThreadPoolExecutor branch
    async def call_in_loop():
        return swarm_orchestrator.run_swarm(tenant_id="tenant-food-mfg-01", request=req)

    res_in_loop = asyncio.run(call_in_loop())
    assert res_in_loop.run_id.startswith("RUN-")


def test_base_agent_and_subagents_direct_execution():
    """Verify direct instantiation and execution of sub-agents and base agent error handling."""
    import pytest

    from app.agents.base import AgentContext, BaseSwarmAgent
    from app.agents.subagents import (
        FinOpsEvaluatorAgent,
        GovernanceCriticAgent,
        SkillGapAnalystAgent,
        TaskDecomposerAgent,
        WorkGraphArchitectAgent,
    )
    from app.models.agent_swarm import AgentRole, SwarmRunRequest

    class DummyAgent(BaseSwarmAgent):
        async def execute(self, context: AgentContext):
            return await super().execute(context)

    dummy = DummyAgent(
        role=AgentRole.ORCHESTRATOR,
        name="Dummy",
        description="Testing base class",
    )
    ctx = AgentContext(
        tenant_id="tenant-01",
        request=SwarmRunRequest(scenario_prompt="Test", horizon_years=1),
        citations=[],
    )

    import asyncio

    with pytest.raises(NotImplementedError):
        asyncio.run(dummy.execute(ctx))

    # Test individual sub-agents directly
    arch = WorkGraphArchitectAgent()
    step_arch = asyncio.run(arch.execute(ctx))
    assert step_arch.agent_role == AgentRole.WORKGRAPH_ARCHITECT

    decomp = TaskDecomposerAgent()
    step_decomp = asyncio.run(decomp.execute(ctx))
    assert step_decomp.agent_role == AgentRole.TASK_DECOMPOSER

    skill = SkillGapAnalystAgent()
    step_skill = asyncio.run(skill.execute(ctx))
    assert step_skill.agent_role == AgentRole.SKILL_GAP_ANALYST

    gov = GovernanceCriticAgent()
    step_gov = asyncio.run(gov.execute(ctx))
    assert step_gov.agent_role == AgentRole.GOVERNANCE_CRITIC

    fin = FinOpsEvaluatorAgent()
    step_fin = asyncio.run(fin.execute(ctx))
    assert step_fin.agent_role == AgentRole.FINOPS_EVALUATOR


def test_services_agent_swarm_reexport():
    """Verify app.services.agent_swarm backward compatibility re-export."""
    from app.services.agent_swarm import SwarmOrchestrator, swarm_orchestrator

    assert SwarmOrchestrator is not None
    assert swarm_orchestrator is not None
