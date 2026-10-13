"""Unit tests for Google ADK Multi-Agent Swarm Orchestrator, Specialist Mesh, and Autonomy Gates."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.agents.base import AgentContext, BaseSwarmAgent
from app.agents.subagents import (
    AdversarialCriticAgent,
    AgentBlueprintAgent,
    BusinessSolutionAgent,
    FinOpsAgent,
    FinOpsEvaluatorAgent,
    FutureSignalsAgent,
    GovernanceCriticAgent,
    SkillGapAnalystAgent,
    SkillsMobilityAgent,
    TaskDecomposerAgent,
    TaskRedesignAgent,
    TrustGovernanceAgent,
    WorkGraphArchitectAgent,
)
from app.agents.tools import (
    audit_saif_controls,
    calculate_deterministic_rri,
    calculate_finops_roi,
    detect_adverse_employment_actions,
    inspect_workgraph_node,
    mutate_workgraph_topology,
    retrieve_evidence_citations,
    verify_claim_groundedness,
)
from app.main import app
from app.models.agent_swarm import AgentRole, AutonomyTier, SwarmRunRequest

client = TestClient(app)


def test_run_swarm_standard_success():
    """Verify standard multi-agent swarm run executing complete 9-specialist deliberation loop."""
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
    assert len(data["trajectories"]) == 10  # Full 9-specialist + orchestrator deliberation steps
    assert data["synthesis"]["projected_agent_work_pct"] > 0
    assert data["synthesis"]["citations"] == ["EVD-SOP-01", "EVD-STRAT-01"]
    assert len(data["synthesis"]["task_matrix"]) == 3
    assert len(data["synthesis"]["agent_blueprints"]) == 1
    assert data["synthesis"]["solution_dossier"] is not None
    assert data["synthesis"]["groundedness_score"] == 1.0


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
    assert data["synthesis"]["groundedness_score"] == 0.0


def test_get_swarm_run_detail_and_tenant_isolation():
    """Verify retrieving run by ID and tenant boundary enforcement."""
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
    """Verify synchronous wrapper execution and thread pool execution."""
    from app.agents import swarm_orchestrator

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


def test_base_agent_and_all_specialists_direct_execution():
    """Verify direct instantiation and execution of all 9 specialist sub-agents."""

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
        request=SwarmRunRequest(scenario_prompt="Test scenario", horizon_years=2),
        citations=["EVD-01"],
    )

    with pytest.raises(NotImplementedError):
        asyncio.run(dummy.execute(ctx))

    # 1. WorkGraphArchitectAgent
    arch = WorkGraphArchitectAgent()
    step_arch = asyncio.run(arch.execute(ctx))
    assert step_arch.agent_role == AgentRole.WORKGRAPH_ARCHITECT

    # 2. FutureSignalsAgent
    signals = FutureSignalsAgent()
    step_signals = asyncio.run(signals.execute(ctx))
    assert step_signals.agent_role == AgentRole.FUTURE_SIGNALS

    # 3. TaskRedesignAgent & TaskDecomposerAgent
    redesign = TaskRedesignAgent()
    step_redesign = asyncio.run(redesign.execute(ctx))
    assert step_redesign.agent_role == AgentRole.TASK_REDESIGN

    decomp = TaskDecomposerAgent(role=AgentRole.TASK_DECOMPOSER)
    step_decomp = asyncio.run(decomp.execute(ctx))
    assert step_decomp.agent_role == AgentRole.TASK_DECOMPOSER

    # 4. SkillsMobilityAgent & SkillGapAnalystAgent
    skills = SkillsMobilityAgent()
    step_skills = asyncio.run(skills.execute(ctx))
    assert step_skills.agent_role == AgentRole.SKILLS_MOBILITY

    analyst = SkillGapAnalystAgent(role=AgentRole.SKILL_GAP_ANALYST)
    step_analyst = asyncio.run(analyst.execute(ctx))
    assert step_analyst.agent_role == AgentRole.SKILL_GAP_ANALYST

    # 5. AgentBlueprintAgent
    blueprint = AgentBlueprintAgent()
    step_blueprint = asyncio.run(blueprint.execute(ctx))
    assert step_blueprint.agent_role == AgentRole.AGENT_BLUEPRINT

    # 6. FinOpsAgent & FinOpsEvaluatorAgent
    fin = FinOpsAgent()
    step_fin = asyncio.run(fin.execute(ctx))
    assert step_fin.agent_role == AgentRole.FINOPS

    evaluator = FinOpsEvaluatorAgent(role=AgentRole.FINOPS_EVALUATOR)
    step_eval = asyncio.run(evaluator.execute(ctx))
    assert step_eval.agent_role == AgentRole.FINOPS_EVALUATOR

    # 7. BusinessSolutionAgent
    biz = BusinessSolutionAgent()
    step_biz = asyncio.run(biz.execute(ctx))
    assert step_biz.agent_role == AgentRole.BUSINESS_SOLUTION

    # 8. AdversarialCriticAgent
    critic = AdversarialCriticAgent()
    step_critic = asyncio.run(critic.execute(ctx))
    assert step_critic.agent_role == AgentRole.ADVERSARIAL_CRITIC

    # 9. TrustGovernanceAgent & GovernanceCriticAgent
    gov = TrustGovernanceAgent()
    step_gov = asyncio.run(gov.execute(ctx))
    assert step_gov.agent_role == AgentRole.TRUST_GOVERNANCE

    gov_critic = GovernanceCriticAgent(role=AgentRole.GOVERNANCE_CRITIC)
    step_gov_critic = asyncio.run(gov_critic.execute(ctx))
    assert step_gov_critic.agent_role == AgentRole.GOVERNANCE_CRITIC


def test_domain_tools_execution():
    """Verify domain tool logic across workgraph, evidence, scoring, and governance tools."""
    # WorkGraph tools
    node_role = inspect_workgraph_node("tenant-01", "ROL-001")
    assert node_role["node_type"] == "ROLE"
    node_cap = inspect_workgraph_node("tenant-01", "CAP-001")
    assert node_cap["node_type"] == "CAPABILITY"
    node_task = inspect_workgraph_node("tenant-01", "TSK-001")
    assert node_task["node_type"] == "TASK"

    mutation = mutate_workgraph_topology("tenant-01", "CAP-001", 3)
    assert len(mutation["introduced_nodes"]) == 2
    assert len(mutation["introduced_edges"]) == 2

    # Evidence tools
    citations = retrieve_evidence_citations(["EVD-SOP-01", "EVD-STRAT-01"])
    assert len(citations) == 2
    assert citations[0]["sha256_verified"] is True

    verif_ok = verify_claim_groundedness(["Claim 1"], ["EVD-SOP-01"])
    assert verif_ok["is_grounded"] is True
    assert verif_ok["hallucination_rate"] == 0.0

    verif_unsupported = verify_claim_groundedness(["Speculative assertion"], [])
    assert verif_unsupported["is_grounded"] is False
    assert verif_unsupported["hallucination_rate"] == 1.0

    # Scoring tools
    rri_high = calculate_deterministic_rri(horizon_years=5, automation_pct=20.0)
    assert 50.0 <= rri_high <= 100.0
    rri_clamped = calculate_deterministic_rri(horizon_years=1, automation_pct=95.0)
    assert rri_clamped >= 10.0

    roi = calculate_finops_roi(annual_savings_usd=100000.0, token_cost_usd=500.0)
    assert roi["net_ebitda_impact_usd"] == 99500.0
    assert roi["roi_multiple"] > 0

    # Governance tools
    assert detect_adverse_employment_actions("fire all frontline staff") is True
    assert detect_adverse_employment_actions("assist staff with edge cameras") is False

    saif_clean = audit_saif_controls("assist staff", "A1_RECOMMENDATION")
    assert saif_clean["saif_audit_verdict"] == "PASSED_SAIF_CONTROLS"

    saif_blocked = audit_saif_controls("terminate all", "A4_DISALLOWED")
    assert saif_blocked["saif_audit_verdict"] == "REJECTED_A4_BREACH"
    assert saif_blocked["anti_jailbreak_check"] == "TRIPPED"


def test_services_agent_swarm_reexport():
    """Verify app.services.agent_swarm backward compatibility re-export."""
    from app.services.agent_swarm import SwarmOrchestrator, swarm_orchestrator

    assert SwarmOrchestrator is not None
    assert swarm_orchestrator is not None


def test_subagents_backward_compatibility_modules():
    """Verify legacy subagent module paths directly import and expose aliases."""
    import app.agents.subagents.finops_evaluator as mod_finops
    import app.agents.subagents.governance_critic as mod_gov
    import app.agents.subagents.skill_gap_analyst as mod_skill
    import app.agents.subagents.task_decomposer as mod_task

    assert mod_finops.FinOpsEvaluatorAgent is not None
    assert mod_gov.GovernanceCriticAgent is not None
    assert mod_skill.SkillGapAnalystAgent is not None
    assert mod_task.TaskDecomposerAgent is not None
