"""Unit tests for Dynamic Enterprise Profiles and Agentic RAG Domain Resolution."""

import pytest

from app.agents.enterprise_profiles import (
    ENTERPRISE_ARCHETYPES,
    EnterpriseProfile,
    resolve_enterprise_profile,
)
from app.models.agent_swarm import SwarmRunRequest
from app.models.worktwin import (
    BoardroomPerspective,
    ConflictResolution,
    ExecutivePersona,
)


def test_enterprise_archetypes_curated_profiles():
    """Verify curated profiles have valid schema and task allocations."""
    for key, profile in ENTERPRISE_ARCHETYPES.items():
        assert isinstance(profile, EnterpriseProfile)
        assert len(profile.company_name) > 0
        assert len(profile.tasks) >= 3
        assert profile.blueprint_id.startswith("ADK-")
        assert len(profile.blueprint_tools) >= 3
        assert profile.transition_difficulty != ""


def test_resolve_enterprise_profile_food_manufacturing():
    """Verify default resolution for food manufacturing sector."""
    req = SwarmRunRequest(
        scenario_prompt="Optimize Line 3 conveyor belt quality inspection.",
        sector="food_manufacturing",
        horizon_years=3,
    )
    profile = resolve_enterprise_profile(req)
    assert profile.company_name == "FoodPack International"
    assert profile.sector == "food_manufacturing"
    assert "EU AI Act" in " ".join(profile.regulations)


def test_resolve_enterprise_profile_tesla_detection():
    """Verify dynamic detection of Tesla keywords in scenario prompt."""
    req = SwarmRunRequest(
        scenario_prompt="Deploy Tesla Gigafactory robotics cell insertion automation.",
        sector="general_manufacturing",
        horizon_years=3,
    )
    profile = resolve_enterprise_profile(req)
    assert "Tesla" in profile.company_name
    assert profile.sector == "automotive_robotics"
    assert "TSLA" in profile.blueprint_id


def test_resolve_enterprise_profile_apple_detection():
    """Verify dynamic detection of Apple Foxconn AOI inspection."""
    req = SwarmRunRequest(
        scenario_prompt="Evaluate Apple iPhone cleanroom display optical inspection lines.",
        sector="consumer_electronics",
        horizon_years=3,
    )
    profile = resolve_enterprise_profile(req)
    assert "Apple" in profile.company_name
    assert profile.sector == "consumer_electronics"
    assert "AAPL" in profile.blueprint_id


def test_resolve_enterprise_profile_coca_cola_detection():
    """Verify dynamic detection of Coca-Cola high-speed bottling."""
    req = SwarmRunRequest(
        scenario_prompt="Analyze high-speed bottling and beverage container defect triage at Coca-Cola.",
        sector="beverage_bottling",
        horizon_years=3,
    )
    profile = resolve_enterprise_profile(req)
    assert "Coca-Cola" in profile.company_name
    assert profile.sector == "beverage_bottling"
    assert "KO" in profile.blueprint_id


def test_resolve_enterprise_profile_berkshire_detection():
    """Verify dynamic detection of Berkshire Hathaway / BNSF Railway logistics."""
    req = SwarmRunRequest(
        scenario_prompt="Implement BNSF Railway track inspection drone autonomy for Berkshire Hathaway.",
        sector="freight_rail_logistics",
        horizon_years=3,
    )
    profile = resolve_enterprise_profile(req)
    assert "Berkshire" in profile.company_name
    assert profile.sector == "freight_rail_logistics"
    assert "BRK" in profile.blueprint_id


def test_resolve_enterprise_profile_custom_fallback():
    """Verify graceful synthesis fallback for unspecified custom enterprise."""
    req = SwarmRunRequest(
        scenario_prompt="Quantum computing hardware cryogenic refrigeration monitoring.",
        sector="deep_tech_physics",
        horizon_years=5,
    )
    profile = resolve_enterprise_profile(req)
    assert profile.company_name == "Quantum"
    assert profile.sector == "deep_tech_physics"
    assert len(profile.tasks) >= 3


def test_boardroom_perspective_bidirectional_property_sync():
    """Verify BoardroomPerspective validator synchronizes dual property aliases seamlessly."""
    # Given backend payload with blocking_risks, approval_conditions, cited_evidence_ids
    persp = BoardroomPerspective(
        role=ExecutivePersona.CTO,
        role_title="Chief Technology Officer",
        stance="CONDITIONAL",
        assessment="Edge TPU inference is performant.",
        blocking_risks=["Edge camera overheating"],
        approval_conditions=["Thermal sensor threshold gating"],
        cited_evidence_ids=["EVD-TECH-01"],
    )
    # Both sets of properties must be populated
    assert persp.blocking_risks == ["Edge camera overheating"]
    assert persp.identified_risks == ["Edge camera overheating"]
    assert persp.approval_conditions == ["Thermal sensor threshold gating"]
    assert persp.mandatory_conditions == ["Thermal sensor threshold gating"]
    assert persp.cited_evidence_ids == ["EVD-TECH-01"]
    assert persp.evidence_citations == ["EVD-TECH-01"]

    # Given frontend payload with identified_risks, mandatory_conditions, evidence_citations
    persp2 = BoardroomPerspective(
        role=ExecutivePersona.CISO,
        role_title="Chief Information Security Officer",
        stance="FAVORABLE",
        assessment="Secure air-gapped corridor.",
        identified_risks=["Local network packet sniffing"],
        mandatory_conditions=["TLS 1.3 encrypted mTLS"],
        evidence_citations=["EVD-SEC-SAIF-01"],
    )
    assert persp2.blocking_risks == ["Local network packet sniffing"]
    assert persp2.identified_risks == ["Local network packet sniffing"]
    assert persp2.approval_conditions == ["TLS 1.3 encrypted mTLS"]
    assert persp2.mandatory_conditions == ["TLS 1.3 encrypted mTLS"]
    assert persp2.cited_evidence_ids == ["EVD-SEC-SAIF-01"]
    assert persp2.evidence_citations == ["EVD-SEC-SAIF-01"]


def test_conflict_resolution_bidirectional_property_sync():
    """Verify ConflictResolution validator synchronizes approvers and trade-offs seamlessly."""
    # Backend style
    res1 = ConflictResolution(
        consensus_points=["Consensus on edge latency"],
        unresolved_disagreements=["CapEx vs OpEx"],
        trade_offs=["Speed vs cost"],
        blocking_controls=["SAIF audit"],
        recommended_human_decision_makers=["VP of HR", "Chief Safety Officer"],
    )
    assert res1.recommended_human_decision_makers == ["VP of HR", "Chief Safety Officer"]
    assert res1.required_human_approvers == ["VP of HR", "Chief Safety Officer"]
    assert res1.trade_offs == ["Speed vs cost"]
    assert res1.value_risk_tradeoffs == ["Speed vs cost"]

    # Frontend style
    res2 = ConflictResolution(
        consensus_points=["Consensus on quality"],
        unresolved_disagreements=["Shift rotation"],
        value_risk_tradeoffs=["Well-being vs SLA"],
        blocking_controls=["HACCP compliance"],
        required_human_approvers=["Plant Director", "Union Representative"],
    )
    assert res2.recommended_human_decision_makers == ["Plant Director", "Union Representative"]
    assert res2.required_human_approvers == ["Plant Director", "Union Representative"]
    assert res2.trade_offs == ["Well-being vs SLA"]
    assert res2.value_risk_tradeoffs == ["Well-being vs SLA"]
