"""Unit tests for official Google ADK Boardroom Swarm, Specialist Agents, Verifier, and Conflict Resolver."""

import pytest
from google.adk.agents import Agent, ParallelAgent, SequentialAgent

from app.agents.adk_boardroom import (
    CEORoleTwinAgent,
    CFORoleTwinAgent,
    CHRORoleTwinAgent,
    CISORoleTwinAgent,
    ConflictResolverAgent,
    CTORoleTwinAgent,
    EmployeeAdvocateRoleTwinAgent,
    EvidenceVerifierAgent,
    FuturaBoardroomCoordinator,
    FutureBoardroomCoordinator,
    boardroom_coordinator,
    get_adk_boardroom_agent,
)
from app.core.exceptions import PolicyViolationException
from app.models.worktwin import (
    BoardroomPerspective,
    BoardroomSimulationRequest,
    ExecutivePersona,
)


def test_official_google_adk_imports_and_types():
    """Verify official Google ADK framework imports and class inheritance."""
    coordinator = get_adk_boardroom_agent()
    assert isinstance(coordinator, FuturaBoardroomCoordinator)
    assert isinstance(coordinator, Agent)
    assert isinstance(coordinator.parallel_deliberation, ParallelAgent)
    assert isinstance(coordinator.sequential_pipeline, SequentialAgent)
    assert FutureBoardroomCoordinator == FuturaBoardroomCoordinator
    assert boardroom_coordinator is coordinator


@pytest.mark.asyncio
async def test_ceo_role_twin_agent_deliberation():
    """Verify CEORoleTwinAgent strategic growth perspectives under both modes."""
    agent = CEORoleTwinAgent()
    assert isinstance(agent, Agent)

    # Growth proposal
    p_fwd = await agent.deliberate("Scale Intelligent Production", "DairyPro", "food_manufacturing", "EVD-FOOD")
    assert p_fwd.role == ExecutivePersona.CEO
    assert p_fwd.stance == "FAVORABLE"
    assert "EVD-FOOD-001" in p_fwd.cited_evidence_ids

    # Pause proposal
    p_pause = await agent.deliberate(
        "Pause Automation for 4-Day Work Week Mentoring", "DairyPro", "food_manufacturing", "EVD-FOOD"
    )
    assert p_pause.stance == "CAUTIOUS"
    assert "32-hour" in p_pause.recommendation


@pytest.mark.asyncio
async def test_cto_role_twin_agent_deliberation():
    """Verify CTORoleTwinAgent technology assessment and evidence linkage."""
    agent = CTORoleTwinAgent()
    assert isinstance(agent, Agent)

    p_fwd = await agent.deliberate("Sensor Network Upgrade", "AgriCorp", "food_manufacturing", "EVD-FOOD")
    assert p_fwd.role == ExecutivePersona.CTO
    assert p_fwd.stance == "FAVORABLE"
    assert "EVD-FOOD-002" in p_fwd.cited_evidence_ids

    p_pause = await agent.deliberate("Freeze Technology Rollout", "AgriCorp", "food_manufacturing", "EVD-FOOD")
    assert p_pause.stance == "CAUTIOUS"
    assert "asynchronous" in p_pause.recommendation.lower()


@pytest.mark.asyncio
async def test_chro_role_twin_agent_deliberation():
    """Verify CHRORoleTwinAgent workforce transition governance."""
    agent = CHRORoleTwinAgent()
    assert isinstance(agent, Agent)

    p_fwd = await agent.deliberate("Robotic Packing Line", "BakeryGroup", "food_manufacturing", "EVD-FOOD")
    assert p_fwd.role == ExecutivePersona.CHRO
    assert p_fwd.stance == "CAUTIOUS"
    assert "120-hour" in p_fwd.recommendation

    p_pause = await agent.deliberate(
        "Pause Automation for 4-Day Work Week", "BakeryGroup", "food_manufacturing", "EVD-FOOD"
    )
    assert p_pause.stance == "FAVORABLE"
    assert "mentoring" in p_pause.recommendation.lower()


@pytest.mark.asyncio
async def test_ciso_role_twin_agent_deliberation():
    """Verify CISORoleTwinAgent Google Cloud SAIF boundaries."""
    agent = CISORoleTwinAgent()
    assert isinstance(agent, Agent)

    p_fwd = await agent.deliberate("Vision Inspection Deployment", "SecureMfg", "food_manufacturing", "EVD-FOOD")
    assert p_fwd.role == ExecutivePersona.CISO
    assert p_fwd.stance == "CONDITIONAL"
    assert "air-gapped" in p_fwd.recommendation

    p_pause = await agent.deliberate("Pause Automation for Shift Work", "SecureMfg", "food_manufacturing", "EVD-FOOD")
    assert p_pause.stance == "CONDITIONAL"
    assert "zero-trust" in p_pause.recommendation


@pytest.mark.asyncio
async def test_cfo_role_twin_agent_deliberation():
    """Verify CFORoleTwinAgent unit economics and token budget caps."""
    agent = CFORoleTwinAgent()
    assert isinstance(agent, Agent)

    p_fwd = await agent.deliberate("Automation Investment Tranche", "BioFood", "food_manufacturing", "EVD-FOOD")
    assert p_fwd.role == ExecutivePersona.CFO
    assert p_fwd.stance == "FAVORABLE"
    assert "0.001" in p_fwd.recommendation

    p_pause = await agent.deliberate("Freeze Capital Expenditures", "BioFood", "food_manufacturing", "EVD-FOOD")
    assert p_pause.stance == "CAUTIOUS"
    assert "4%" in p_pause.recommendation


@pytest.mark.asyncio
async def test_employee_advocate_role_twin_agent_deliberation():
    """Verify EmployeeAdvocateRoleTwinAgent worker sovereignty and override rights."""
    agent = EmployeeAdvocateRoleTwinAgent()
    assert isinstance(agent, Agent)

    p_fwd = await agent.deliberate("Automated Line Speed Surge", "LaborFront", "food_manufacturing", "EVD-FOOD")
    assert p_fwd.role == ExecutivePersona.EMPLOYEE_ADVOCATE
    assert p_fwd.stance == "CONDITIONAL"
    assert "override" in p_fwd.recommendation.lower()

    p_pause = await agent.deliberate(
        "Pause Automation for Worker Well-Being", "LaborFront", "food_manufacturing", "EVD-FOOD"
    )
    assert p_pause.stance == "FAVORABLE"
    assert "Right to Disconnect" in p_pause.recommendation


def test_evidence_verifier_agent_grounding():
    """Verify EvidenceVerifierAgent validates cited citations against vault."""
    verifier = EvidenceVerifierAgent()
    assert isinstance(verifier, Agent)

    p_valid = BoardroomPerspective(
        role=ExecutivePersona.CTO,
        role_title="CTO",
        stance="FAVORABLE",
        assessment="Valid tech plan",
        key_arguments=["Proven track record"],
        blocking_risks=[],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-FOOD-002"],
    )

    v1 = verifier.verify_perspective(p_valid, approved_evidence_ids=["EVD-FOOD-002"])
    assert v1.support_status == "SUPPORTED"
    assert len(v1.source_spans) == 1

    # Unapproved evidence ID trips verification check
    p_invalid = BoardroomPerspective(
        role=ExecutivePersona.CTO,
        role_title="CTO",
        stance="FAVORABLE",
        assessment="Hallucinated claims",
        key_arguments=["No basis in fact"],
        blocking_risks=[],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-FAKE-999"],
    )
    v2 = verifier.verify_perspective(p_invalid, approved_evidence_ids=["EVD-FOOD-001", "EVD-FOOD-002"])
    assert v2.support_status == "INSUFFICIENT_EVIDENCE"
    assert v2.confidence_score == 0.35

    # Perspective without citations
    p_empty = BoardroomPerspective(
        role=ExecutivePersona.CEO,
        role_title="CEO",
        stance="FAVORABLE",
        assessment="No citations provided",
        key_arguments=["Hunch"],
        blocking_risks=[],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=[],
    )
    v3 = verifier.verify_perspective(p_empty)
    assert v3.support_status == "NON_FACTUAL_RECOMMENDATION"
    assert v3.confidence_score == 0.50


def test_conflict_resolver_agent():
    """Verify ConflictResolverAgent produces consensus strategies for diverse proposals."""
    resolver = ConflictResolverAgent()
    assert isinstance(resolver, Agent)

    p1 = BoardroomPerspective(
        role=ExecutivePersona.CTO,
        role_title="CTO",
        stance="FAVORABLE",
        assessment="Tech works",
        key_arguments=["Efficiency"],
        blocking_risks=["SCADA integration lag"],
        approval_conditions=["Sandbox test"],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-1"],
    )
    p2 = BoardroomPerspective(
        role=ExecutivePersona.CHRO,
        role_title="CHRO",
        stance="CAUTIOUS",
        assessment="Worker impact",
        key_arguments=["Training needed"],
        blocking_risks=["Worker fatigue"],
        approval_conditions=["Wage floor"],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-2"],
    )

    res_auto = resolver.resolve("Robotic Packaging Surge", [p1, p2])
    assert len(res_auto.disagreements) >= 1
    assert "approve with conditions" in res_auto.consensus_strategy.lower()
    assert "SCADA integration lag" in res_auto.consolidated_blocking_risks

    res_pause = resolver.resolve("Pause Automation for 4-Day Work Week Mentoring", [p1, p2])
    assert "32-hour" in res_pause.consensus_strategy.lower()


@pytest.mark.asyncio
async def test_futura_boardroom_coordinator_full_trajectory_and_filters():
    """Verify FuturaBoardroomCoordinator coordinates parallel deliberation and filters roles."""
    coordinator = get_adk_boardroom_agent()

    # All 6 twins
    out = await coordinator.coordinate_deliberation(
        proposal="Robotic Packaging Surge",
        enterprise="DairyPro",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
        approved_evidence_ids=["EVD-FOOD-001", "EVD-FOOD-002", "EVD-FOOD-003", "EVD-SEC-SAIF-01", "EVD-FIN-92"],
    )
    assert len(out["perspectives"]) == 6
    for p in out["perspectives"]:
        assert p.support_status == "SUPPORTED"

    # Filtered participating twins
    out_filtered = await coordinator.coordinate_deliberation(
        proposal="Robotic Packaging Surge",
        enterprise="DairyPro",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
        participating_twins=[ExecutivePersona.CTO, ExecutivePersona.CISO],
    )
    assert len(out_filtered["perspectives"]) == 2
    roles = {p.role for p in out_filtered["perspectives"]}
    assert roles == {ExecutivePersona.CTO, ExecutivePersona.CISO}


@pytest.mark.asyncio
async def test_futura_boardroom_simulation_and_red_line_violation():
    """Verify complete simulation execution and Responsible AI policy red-line exceptions."""
    coordinator = get_adk_boardroom_agent()

    # Valid simulation
    req = BoardroomSimulationRequest(
        proposal_title="AI Quality Vision Corridors",
        proposal_description="Deploy optical inspection to verify food packaging seals.",
        sector="food_manufacturing",
        target_enterprise="Artisan Food Processing Group",
    )
    sim_res = await coordinator.simulate_boardroom(req)
    assert sim_res.proposal_title == req.proposal_title
    assert len(sim_res.perspectives) == 6
    assert sim_res.conflict_resolution.governed_recommendation.startswith("APPROVE WITH CONDITIONS")
    assert sim_res.model_route == "google-adk-gemini-2.5-pro"

    # Synchronous simulation wrapper
    sync_res = coordinator.simulate_boardroom_sync(req)
    assert sync_res.proposal_title == req.proposal_title

    # Red-line violation
    redline_req = BoardroomSimulationRequest(
        proposal_title="Automated Workforce Replacement",
        proposal_description="Terminate workers and rank for termination based on productivity telemetry.",
    )
    with pytest.raises(PolicyViolationException) as exc:
        await coordinator.simulate_boardroom(redline_req)
    assert "Red-line violation" in str(exc.value)


@pytest.mark.asyncio
async def test_adk_runner_and_session_invocation():
    """Verify official Google ADK InMemoryRunner and Session invocation in deliberation pipeline."""
    from google.adk.runners import InMemoryRunner

    coordinator = get_adk_boardroom_agent()
    assert isinstance(coordinator.adk_runner, InMemoryRunner)

    req = BoardroomSimulationRequest(
        proposal_title="Edge Compute Automation",
        proposal_description="Deploy edge inferencing for packaging Line 3.",
        sector="food_manufacturing",
        target_enterprise="AgriTech Processing",
    )
    res = await coordinator.simulate_boardroom(req)
    assert res.adk_session_id is not None
    assert res.adk_session_id.startswith("adk-session-")
    assert res.adk_runner_status == "COMPLETED"


@pytest.mark.asyncio
async def test_independent_role_deliberation_domain_aware():
    """Verify role agents provide independent, domain-aware deliberation rather than static food templates."""
    coordinator = get_adk_boardroom_agent()

    healthcare_req = BoardroomSimulationRequest(
        proposal_title="AI-Assisted Discharge Planning",
        proposal_description="Clinical workflow tool to assist attending clinicians in hospital discharge planning with full doctor veto authority.",
        sector="healthcare",
        target_enterprise="MetroHealth Regional Hospital",
    )
    res = await coordinator.simulate_boardroom(healthcare_req)
    advocate_perspective = next(p for p in res.perspectives if p.role == ExecutivePersona.EMPLOYEE_ADVOCATE)
    ciso_perspective = next(p for p in res.perspectives if p.role == ExecutivePersona.CISO)

    # Healthcare-specific advocacy rather than food conveyors
    assert (
        "clinician" in advocate_perspective.recommendation.lower()
        or "patient" in advocate_perspective.recommendation.lower()
    )
    assert "conveyor" not in advocate_perspective.recommendation.lower()

    # Healthcare-specific security rather than camera feeds
    assert (
        "hipaa" in ciso_perspective.recommendation.lower()
        or "phi" in ciso_perspective.recommendation.lower()
        or "zero-trust" in ciso_perspective.recommendation.lower()
    )

    # Healthcare-specific conflict resolution
    assert "clinical" in res.conflict_resolution.governed_recommendation.lower()
