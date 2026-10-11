"""Unit tests for Workforce Opportunity Engine & Pathways (Module 5)."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.opportunity import AdaptabilityTier, FeasibilityTier, OpportunitySentimentTier
from app.services.opportunity_service import opportunity_service
from app.services.scoring_engine import (
    calculate_human_opportunity_score,
    calculate_transition_readiness,
    calculate_workforce_adaptability,
)

client = TestClient(app)


def test_get_opportunity_metrics_nominal():
    """Verify default opportunity metrics return RRI, TRS, WAI, HOS, and pathways."""
    response = client.get(
        "/api/v1/opportunity/metrics?cohort_size=25&role_id=ROL-001",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["tenant_id"] == "tenant-test-01"
    assert data["cohort_size"] == 25
    assert data["k_anonymity_passed"] is True

    # RRI
    rri = data["role_resilience"]
    assert rri["score"] > 0
    assert rri["formula_version"] == "2026.1-rri"
    assert len(rri["components"]) == 4

    # TRS
    trs_list = data["transition_readiness"]
    assert len(trs_list) == 3
    for trs in trs_list:
        assert trs["formula_version"] == "2026.1-trs"
        assert trs["score"] > 0
        assert trs["feasibility_tier"] in [
            FeasibilityTier.HIGH_FEASIBILITY.value,
            FeasibilityTier.MODERATE_FEASIBILITY.value,
            FeasibilityTier.HIGH_EFFORT.value,
        ]

    # WAI
    wai = data["workforce_adaptability"]
    assert wai["score"] > 0
    assert wai["formula_version"] == "2026.1-wai"
    assert wai["k_anonymity_passed"] is True
    assert wai["privacy_notice"] is None

    # HOS
    hos = data["human_opportunity_score"]
    assert hos["score"] > 0
    assert hos["formula_version"] == "2026.1-hos"

    # Pathways
    pathways = data["pathways"]
    assert len(pathways) == 3
    p_ids = [p["pathway_id"] for p in pathways]
    assert "PATH-001" in p_ids
    assert "PATH-002" in p_ids
    assert "PATH-003" in p_ids


def test_wai_k_anonymity_privacy_suppression():
    """Verify k-anonymity privacy gate suppresses analytics when cohort size is below 10."""
    response = client.get(
        "/api/v1/opportunity/metrics?cohort_size=6&role_id=ROL-001",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["cohort_size"] == 6
    assert data["k_anonymity_passed"] is False

    wai = data["workforce_adaptability"]
    assert wai["k_anonymity_passed"] is False
    assert wai["score"] == 0.0
    assert "Cohort size below privacy threshold" in wai["privacy_notice"]
    assert len(wai["components"]) == 0


def test_wai_adaptability_tier_thresholds():
    """Verify deterministic WAI adaptability tier boundaries."""
    # Elite Agility (>= 85.0)
    w_elite = calculate_workforce_adaptability("t1", 90.0, 90.0, 90.0, 90.0, cohort_size=20)
    assert w_elite.adaptability_tier == AdaptabilityTier.ELITE_AGILITY

    # Adaptive (70.0 - 84.9)
    w_adaptive = calculate_workforce_adaptability("t1", 75.0, 75.0, 75.0, 75.0, cohort_size=20)
    assert w_adaptive.adaptability_tier == AdaptabilityTier.ADAPTIVE

    # Transitioning (50.0 - 69.9)
    w_trans = calculate_workforce_adaptability("t1", 55.0, 55.0, 55.0, 55.0, cohort_size=20)
    assert w_trans.adaptability_tier == AdaptabilityTier.TRANSITIONING

    # Resistant (< 50.0)
    w_resist = calculate_workforce_adaptability("t1", 30.0, 30.0, 30.0, 30.0, cohort_size=20)
    assert w_resist.adaptability_tier == AdaptabilityTier.RESISTANT


def test_trs_feasibility_tier_thresholds():
    """Verify deterministic TRS feasibility tier boundaries."""
    # High Feasibility (>= 80.0)
    t_high = calculate_transition_readiness("R1", "R2", 85.0, 15.0, 90.0)
    assert t_high.feasibility_tier == FeasibilityTier.HIGH_FEASIBILITY

    # Moderate Feasibility (60.0 - 79.9)
    t_mod = calculate_transition_readiness("R1", "R2", 60.0, 35.0, 65.0)
    assert t_mod.feasibility_tier == FeasibilityTier.MODERATE_FEASIBILITY

    # High Effort (< 60.0)
    t_effort = calculate_transition_readiness("R1", "R2", 30.0, 60.0, 40.0)
    assert t_effort.feasibility_tier == FeasibilityTier.HIGH_EFFORT


def test_hos_sentiment_tier_thresholds():
    """Verify deterministic HOS sentiment tier boundaries."""
    # Highly Empowering (>= 70.0)
    h_emp = calculate_human_opportunity_score("t1", new_roles_count=4, augmented_tasks_count=5, automated_tasks_count=1)
    assert h_emp.sentiment_tier == OpportunitySentimentTier.HIGHLY_EMPOWERING

    # Balanced (45.0 - 69.9)
    h_bal = calculate_human_opportunity_score("t1", new_roles_count=2, augmented_tasks_count=4, automated_tasks_count=2)
    assert h_bal.sentiment_tier == OpportunitySentimentTier.BALANCED

    # Displacement Risk (< 45.0)
    h_risk = calculate_human_opportunity_score("t1", new_roles_count=0, augmented_tasks_count=1, automated_tasks_count=8)
    assert h_risk.sentiment_tier == OpportunitySentimentTier.DISPLACEMENT_RISK


def test_list_role_transition_pathways():
    """Verify retrieving pathways for source role."""
    response = client.get("/api/v1/opportunity/pathways?role_id=ROL-001", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Unknown role returns empty
    res_unknown = client.get("/api/v1/opportunity/pathways?role_id=ROL-999", headers={"X-Tenant-ID": "tenant-test-01"})
    assert res_unknown.status_code == 200
    assert len(res_unknown.json()) == 0


def test_get_transition_pathway_by_id_success():
    """Verify retrieving specific pathway by ID."""
    response = client.get("/api/v1/opportunity/pathways/PATH-001", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert data["pathway_id"] == "PATH-001"
    assert "Vision Automation Steward" in data["target_role_name"]
    assert len(data["curriculum"]) == 3
    assert data["wage_impact_pct"] == 18.0


def test_get_transition_pathway_by_id_not_found():
    """Verify 404 when pathway ID is invalid."""
    response = client.get("/api/v1/opportunity/pathways/PATH-NONEXISTENT", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_submit_pathway_appeal_success():
    """Verify Right-to-Appeal workflow: submitting appeal marks pathway CONTESTED."""
    payload = {
        "pathway_id": "PATH-001",
        "contested_skill": "BigQuery Telemetry Analysis",
        "rationale": "I already hold Google Cloud Data Practitioner certificate from previous role.",
        "supporting_evidence_uri": "gs://evidence/certs/gcp-practitioner.pdf",
        "appellant_id": "EMP-8841",
    }
    response = client.post(
        "/api/v1/opportunity/appeal",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "PENDING_AUDIT_REVIEW"
    assert data["pathway_id"] == "PATH-001"
    assert data["appellant_id"] == "EMP-8841"
    assert "APL-" in data["appeal_id"]

    # Verify pathway is now CONTESTED
    chk = client.get("/api/v1/opportunity/pathways/PATH-001", headers={"X-Tenant-ID": "tenant-test-01"})
    assert chk.json()["status"] == "CONTESTED"


def test_submit_pathway_appeal_not_found():
    """Verify 404 when appealing non-existent pathway."""
    payload = {
        "pathway_id": "PATH-UNKNOWN",
        "contested_skill": "Skill A",
        "rationale": "Valid rationale over 10 chars",
        "appellant_id": "EMP-01",
    }
    response = client.post(
        "/api/v1/opportunity/appeal",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_evaluate_ethical_red_line_interceptor_adverse_action():
    """Verify Responsible Workforce red-line blocks adverse layoff / downsizing requests with 403."""
    prohibited_payload = {
        "prompt": "Identify employees for layoff and generate downsizing list to cut operational cost.",
        "cohort_size": 20,
    }
    response = client.post(
        "/api/v1/opportunity/evaluate",
        json=prohibited_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 403
    assert "ERR_POLICY_UNLAWFUL_WORKFORCE_ACTION" in response.json()["detail"]


def test_evaluate_ethical_red_line_interceptor_protected_attributes():
    """Verify Responsible Workforce red-line blocks demographic evaluation requests with 400."""
    prohibited_payload = {
        "prompt": "Analyze role transition readiness segmented by age and gender distribution.",
        "cohort_size": 20,
    }
    response = client.post(
        "/api/v1/opportunity/evaluate",
        json=prohibited_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 400
    assert "ERR_PROTECTED_ATTRIBUTES_PROHIBITED" in response.json()["detail"]


def test_evaluate_success_nominal():
    """Verify compliant workforce opportunity evaluation succeeds."""
    compliant_payload = {
        "prompt": "Identify proactive reskilling pathways from manual visual packaging inspection to edge robotics supervision.",
        "cohort_size": 30,
    }
    response = client.post(
        "/api/v1/opportunity/evaluate",
        json=compliant_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["k_anonymity_passed"] is True
    assert data["cohort_size"] == 30
    assert len(data["pathways"]) == 3


def test_fresh_tenant_lazy_initialization():
    """Verify fresh tenant accessing opportunity metrics auto-populates seed pathways."""
    response = client.get(
        "/api/v1/opportunity/metrics",
        headers={"X-Tenant-ID": "tenant-fresh-opp-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tenant-fresh-opp-01"
    assert len(data["pathways"]) == 3


def test_reset_tenant_state():
    """Verify resetting tenant pathways restores clean active state."""
    opportunity_service.reset_tenant("tenant-reset-01")
    pathways = opportunity_service.get_pathways("tenant-reset-01")
    assert len(pathways) == 3
