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
    for _key, profile in ENTERPRISE_ARCHETYPES.items():
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


@pytest.mark.asyncio
async def test_resolve_enterprise_profile_async_mock_and_live_paths(monkeypatch):
    """Verify resolve_enterprise_profile_async across mock mode, live Vertex AI, and fallback."""
    from unittest.mock import MagicMock
    from app.agents.enterprise_profiles import resolve_enterprise_profile_async
    from app.core.config import settings
    import json

    req = SwarmRunRequest(
        scenario_prompt="Tesla Gigafactory structural casting cell.",
        sector="automotive_robotics",
        horizon_years=3,
    )

    # 1. Mock mode active
    monkeypatch.setattr(settings, "mock_llm_mode", True)
    prof_mock = await resolve_enterprise_profile_async(req)
    assert "Tesla" in prof_mock.company_name

    # 2. Live mode with successful Vertex AI synthesis
    monkeypatch.setattr(settings, "mock_llm_mode", False)
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "company_name": "Tesla, Inc.",
        "sector": "automotive_robotics",
        "sector_display_name": "Automotive Robotics & Autonomous Gigafactory Assembly",
        "target_role_id": "ROL-TSLA-01",
        "target_role_name": "Gigafactory Robotics Assembly Operator",
        "target_capability_id": "CAP-TSLA-01",
        "target_capability_name": "Autonomous Giga-Casting & Battery Cell Insertion",
        "regulations": ["ISO 26262 Road Vehicles", "OSHA Safety Standard"],
        "tasks": [
            {
                "task_id": "TSK-001",
                "task_name": "Routine screening",
                "classification": "AUTOMATE",
                "human_share_pct": 0.0,
                "agent_share_pct": 100.0,
                "justification": "Edge-TPU inference",
            }
        ],
        "blueprint_agent_name": "TeslaGigaVisionAgent",
        "blueprint_id": "ADK-TSLA-001",
        "blueprint_tools": ["camera", "classifier"],
        "reskilling_pathway": "Operator -> Robotics Specialist",
        "current_state_assessment": "Bottleneck",
        "target_state_architecture": "Edge-TPU",
        "source_skills": ["Manual"],
        "target_skills": ["Robotics"],
        "transition_difficulty": "Moderate",
        "default_scenario_prompt": "Tesla Gigafactory",
    })
    mock_client.models.generate_content.return_value = mock_resp
    import google.genai
    monkeypatch.setattr(google.genai, "Client", MagicMock(return_value=mock_client))

    prof_live = await resolve_enterprise_profile_async(req)
    assert "Tesla" in prof_live.company_name
    assert prof_live.blueprint_agent_name == "TeslaGigaVisionAgent"

    # 3. Live mode with Vertex AI exception fallback
    mock_client.models.generate_content.side_effect = RuntimeError("Vertex AI rate limit")
    prof_fallback = await resolve_enterprise_profile_async(req)
    assert "Tesla" in prof_fallback.company_name


def test_multimodal_analyze_live_vertex_and_exception_paths(monkeypatch):
    """Verify analyze_multimodal_asset in evidence router when mock_llm_mode is False."""
    from unittest.mock import MagicMock
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.config import settings
    import json
    import google.genai

    client = TestClient(app)
    payload = {
        "asset_id": "SMP-IMG-01",
        "category": "image",
        "title": "Packaging Line 4 Optical Sorter Feed",
        "source": "Edge-TPU Camera 04",
        "snippet": "High-speed conveyor surface with 12 food package seal defects detected per minute.",
        "company_context": "food_manufacturing",
        "prompt_directive": "Assess visual defect rate and operator ergonomics.",
    }

    # 1. Live mode with successful Vertex AI multimodal perception
    monkeypatch.setattr(settings, "mock_llm_mode", False)
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "detected_tasks": ["Conveyor Optical Inspection", "Package Seal Alignment"],
        "ergonomic_risk": "LOW (14/100) — Autonomous edge camera screening",
        "automation_potential": 90,
        "recommended_pathway": "Packaging Inspector -> Machine Vision Quality Auditor",
        "ai_reasoning_trace": "1. Telemetry parsing. 2. WorkGraph biomechanical mapping. 3. Reskilling opportunity.",
    })
    mock_client.models.generate_content.return_value = mock_resp
    monkeypatch.setattr(google.genai, "Client", MagicMock(return_value=mock_client))

    resp = client.post(
        "/api/v1/evidence/multimodal-analyze",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["automation_potential"] == 90
    assert "Machine Vision Quality Auditor" in data["recommended_pathway"]
    assert "Vertex AI Gemini 2.5 Flash (Multimodal)" in data["model_used"]

    # 2. Live mode with Vertex AI exception fallback
    mock_client.models.generate_content.side_effect = RuntimeError("Multimodal pipeline timeout")
    resp_fallback = client.post(
        "/api/v1/evidence/multimodal-analyze",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_fallback.status_code == 200
    data_fb = resp_fallback.json()
    assert data_fb["asset_id"] == "SMP-IMG-01"
    assert len(data_fb["detected_tasks"]) >= 1

