"""Unit tests for Google ADK Boardroom Swarm, Specialist Agents, Verifier, and Conflict Resolver."""

import pytest

from app.agents.adk_boardroom import (
    CHRORoleTwinAgent,
    CISORoleTwinAgent,
    ConflictResolverAgent,
    CTORoleTwinAgent,
    EvidenceVerifierAgent,
    FutureBoardroomCoordinator,
    boardroom_coordinator,
)
from app.models.worktwin import BoardroomPerspective, ExecutivePersona


@pytest.mark.asyncio
async def test_cto_role_twin_agent_deliberation():
    """Verify CTO role twin generates distinct technical evaluation."""
    cto = CTORoleTwinAgent()

    # Standard automation proposal
    res1 = await cto.deliberate(
        proposal="Autonomous Robotic Packing Surge",
        enterprise="AgriFood Corp",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
    )
    assert res1.role == ExecutivePersona.CTO
    assert res1.stance == "FAVORABLE"
    assert "streaming" in res1.recommendation.lower()

    # Pause automation proposal
    res2 = await cto.deliberate(
        proposal="Pause Automation for 4-Day Work Week Mentoring",
        enterprise="AgriFood Corp",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
    )
    assert res2.stance == "CAUTIOUS"
    assert "asynchronous" in res2.recommendation.lower()


@pytest.mark.asyncio
async def test_chro_role_twin_agent_deliberation():
    """Verify CHRO role twin generates workforce-centric evaluation."""
    chro = CHRORoleTwinAgent()

    # Standard automation proposal
    res1 = await chro.deliberate(
        proposal="Autonomous Robotic Packing Surge",
        enterprise="AgriFood Corp",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
    )
    assert res1.role == ExecutivePersona.CHRO
    assert res1.stance == "CAUTIOUS"
    assert "upskilling" in res1.recommendation.lower()

    # Pause automation proposal
    res2 = await chro.deliberate(
        proposal="Pause Automation for 4-Day Work Week Mentoring",
        enterprise="AgriFood Corp",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
    )
    assert res2.stance == "FAVORABLE"
    assert "mentoring" in res2.recommendation.lower()


@pytest.mark.asyncio
async def test_ciso_role_twin_agent_deliberation():
    """Verify CISO role twin enforces Google Cloud SAIF boundaries."""
    ciso = CISORoleTwinAgent()

    # Standard automation proposal
    res1 = await ciso.deliberate(
        proposal="Autonomous Robotic Packing Surge",
        enterprise="AgriFood Corp",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
    )
    assert res1.role == ExecutivePersona.CISO
    assert res1.stance == "CONDITIONAL"
    assert "vpc" in res1.recommendation.lower() or "mtls" in res1.recommendation.lower()

    # Pause automation proposal
    res2 = await ciso.deliberate(
        proposal="Pause Automation for 4-Day Work Week Mentoring",
        enterprise="AgriFood Corp",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
    )
    assert res2.stance == "CONDITIONAL"
    assert "credentials" in res2.recommendation.lower() or "zero-trust" in res2.recommendation.lower()


def test_evidence_verifier_agent_calibration():
    """Verify EvidenceVerifierAgent validates cited spans and flags ungrounded claims."""
    verifier = EvidenceVerifierAgent()

    valid_perspective = BoardroomPerspective(
        role=ExecutivePersona.CTO,
        role_title="Chief Technology Officer",
        stance="FAVORABLE",
        assessment="Valid technical proposal.",
        recommendation="Scale telemetry.",
        key_arguments=["Telemetry saves scrap."],
        blocking_risks=[],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-001"],
        confidence_score=0.90,
        support_status="SUPPORTED",
    )

    # 1. Verified against approved evidence IDs
    v_res = verifier.verify_perspective(valid_perspective, approved_evidence_ids=["EVD-001", "EVD-002"])
    assert v_res.support_status == "SUPPORTED"
    assert v_res.confidence_score == 0.90
    assert len(v_res.source_spans) >= 1

    # 2. Flagged when evidence ID is missing from approved evidence vault
    invalid_perspective = BoardroomPerspective(
        role=ExecutivePersona.CFO,
        role_title="Chief Financial Officer",
        stance="CAUTIOUS",
        assessment="Unverified claim.",
        recommendation="Audit.",
        key_arguments=[],
        blocking_risks=[],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["UNKNOWN-EVD-999"],
        confidence_score=0.90,
        support_status="SUPPORTED",
    )
    inv_res = verifier.verify_perspective(invalid_perspective, approved_evidence_ids=["EVD-001"])
    assert inv_res.support_status == "INSUFFICIENT_EVIDENCE"
    assert inv_res.confidence_score == 0.35
    assert inv_res.source_spans == []

    # 3. Non-factual recommendation without citations
    empty_perspective = BoardroomPerspective(
        role=ExecutivePersona.CEO,
        role_title="CEO",
        stance="NEUTRAL",
        assessment="No data.",
        recommendation="Proceed.",
        key_arguments=[],
        blocking_risks=[],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=[],
        confidence_score=0.90,
        support_status="SUPPORTED",
    )
    emp_res = verifier.verify_perspective(empty_perspective)
    assert emp_res.support_status == "NON_FACTUAL_RECOMMENDATION"
    assert emp_res.confidence_score == 0.50


def test_conflict_resolver_agent_consensus():
    """Verify ConflictResolverAgent formulates consensus and captures disagreements."""
    resolver = ConflictResolverAgent()

    # Perspective list
    p1 = BoardroomPerspective(
        role=ExecutivePersona.CTO,
        role_title="CTO",
        stance="FAVORABLE",
        assessment="Automate.",
        recommendation="Deploy vision sensors.",
        key_arguments=[],
        blocking_risks=["SCADA integration lag"],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-001"],
        confidence_score=0.90,
        support_status="SUPPORTED",
    )
    p2 = BoardroomPerspective(
        role=ExecutivePersona.CHRO,
        role_title="CHRO",
        stance="CAUTIOUS",
        assessment="Protect workers.",
        recommendation="Upskill operators.",
        key_arguments=[],
        blocking_risks=["Operator anxiety"],
        approval_conditions=[],
        assumptions_requiring_evidence=[],
        cited_evidence_ids=["EVD-002"],
        confidence_score=0.95,
        support_status="SUPPORTED",
    )

    res_auto = resolver.resolve("Robotic Packaging Surge", [p1, p2])
    assert len(res_auto.disagreements) >= 1
    assert "modernization" in res_auto.consensus_strategy.lower()
    assert "SCADA integration lag" in res_auto.consolidated_blocking_risks

    res_pause = resolver.resolve("Pause Automation for 4-Day Work Week Mentoring", [p1, p2])
    assert "32-hour" in res_pause.consensus_strategy.lower()


@pytest.mark.asyncio
async def test_future_boardroom_coordinator_full_trajectory():
    """Verify FutureBoardroomCoordinator executes parallel deliberation and verification."""
    coordinator = FutureBoardroomCoordinator()
    output = await coordinator.coordinate_deliberation(
        proposal="Robotic Packaging Surge",
        enterprise="DairyPro",
        sector="food_manufacturing",
        evd_prefix="EVD-FOOD",
        approved_evidence_ids=["EVD-FOOD-002", "EVD-FOOD-003", "EVD-SEC-SAIF-01"],
    )

    assert len(output["perspectives"]) == 3
    for p in output["perspectives"]:
        assert p.support_status == "SUPPORTED"
        assert len(p.source_spans) >= 1
    assert len(output["conflict_resolution"].disagreements) >= 1
    assert len(output["conflict_resolution"].mandatory_conditions) >= 1
    assert isinstance(boardroom_coordinator, FutureBoardroomCoordinator)
