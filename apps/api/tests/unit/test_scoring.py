"""Unit tests for deterministic scoring engines."""

from app.services.scoring_engine import (
    calculate_role_resilience_index,
    calculate_trustboard_score,
)


def test_calculate_role_resilience_index_high_resilience():
    """Verify RRI calculation for high resilience score."""
    result = calculate_role_resilience_index(
        role_id="ROL-001",
        role_name="Vision Lead",
        non_routine_judgment_pct=85.0,
        skill_transferability_pct=80.0,
        augmentation_potential_pct=90.0,
        strategic_criticality_pct=85.0,
    )
    # Expected: (0.35*85) + (0.30*80) + (0.20*90) + (0.15*85)
    # 29.75 + 24.0 + 18.0 + 12.75 = 84.5
    assert result.score == 84.5
    assert result.tier == "HIGH_RESILIENCE"
    assert len(result.components) == 4


def test_calculate_role_resilience_index_moderate():
    """Verify RRI calculation for moderate resilience role."""
    result = calculate_role_resilience_index(
        role_id="ROL-003",
        role_name="Maintenance Lead",
        non_routine_judgment_pct=60.0,
        skill_transferability_pct=60.0,
        augmentation_potential_pct=60.0,
        strategic_criticality_pct=60.0,
    )
    assert result.score == 60.0
    assert result.tier == "MODERATE_RESILIENCE"


def test_calculate_role_resilience_index_transition_priority():
    """Verify RRI calculation for vulnerable / transition priority role."""
    result = calculate_role_resilience_index(
        role_id="ROL-002",
        role_name="Manual Packer",
        non_routine_judgment_pct=20.0,
        skill_transferability_pct=30.0,
        augmentation_potential_pct=40.0,
        strategic_criticality_pct=30.0,
    )
    # Expected: (0.35*20) + (0.30*30) + (0.20*40) + (0.15*30)
    # 7.0 + 9.0 + 8.0 + 4.5 = 28.5
    assert result.score == 28.5
    assert result.tier == "TRANSITION_PRIORITY"


def test_trustboard_score_passed():
    """Verify TrustBoard score passing all gates."""
    result = calculate_trustboard_score(
        saif_security=95.0,
        operational_excellence=90.0,
        reliability=92.0,
        performance=88.0,
        cost_optimization=85.0,
        sustainability=87.0,
        red_lines_breached=0,
    )
    assert result.gate_status == "PASSED"
    assert result.trust_score >= 85.0


def test_trustboard_score_flagged():
    """Verify TrustBoard score flagged when overall score is between 75 and 85."""
    result = calculate_trustboard_score(
        saif_security=80.0,
        operational_excellence=75.0,
        reliability=78.0,
        performance=76.0,
        cost_optimization=75.0,
        sustainability=77.0,
        red_lines_breached=0,
    )
    assert result.gate_status == "FLAGGED"


def test_trustboard_score_blocked_on_redlines():
    """Verify TrustBoard immediately blocks release if red lines are breached."""
    result = calculate_trustboard_score(
        saif_security=95.0,
        operational_excellence=90.0,
        reliability=92.0,
        performance=88.0,
        cost_optimization=85.0,
        sustainability=87.0,
        red_lines_breached=1,
    )
    assert result.gate_status == "BLOCKED"


def test_trustboard_score_blocked_on_low_security():
    """Verify TrustBoard blocks release if SAIF security falls below 75."""
    result = calculate_trustboard_score(
        saif_security=70.0,
        operational_excellence=90.0,
        reliability=92.0,
        performance=88.0,
        cost_optimization=85.0,
        sustainability=87.0,
        red_lines_breached=0,
    )
    assert result.gate_status == "BLOCKED"


def test_scoring_api_endpoints():
    """Verify HTTP GET /api/v1/scoring/rri and /api/v1/scoring/trustboard."""
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)

    rri_resp = client.get(
        "/api/v1/scoring/rri?role_id=ROL-001&role_name=Inspector&non_routine=70&transferability=75&augmentation=80&strategic_criticality=85",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert rri_resp.status_code == 200
    assert rri_resp.json()["score"] > 0.0

    trust_resp = client.get(
        "/api/v1/scoring/trustboard?saif_security=92&operational_excellence=88&reliability=90&performance=89&cost_optimization=87&sustainability=86&red_lines_breached=0",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert trust_resp.status_code == 200
    assert trust_resp.json()["gate_status"] == "PASSED"
