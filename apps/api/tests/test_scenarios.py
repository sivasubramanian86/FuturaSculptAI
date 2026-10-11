"""Unit tests for Future Scenario Foundry and Counterfactual Simulation Engine."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_scenarios_returns_four_classes():
    """Verify endpoint returns exactly the 4 required scenario classes."""
    response = client.get("/api/v1/scenarios", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) == 4

    classes = {s["scenario_class"] for s in data["scenarios"]}
    assert classes == {"conservative", "accelerated", "disruptive", "human_first"}

    # Assert required financial and uncertainty fields
    for s in data["scenarios"]:
        assert "ebitda_impact_usd" in s
        assert "confidence_score" in s
        assert len(s["invalidation_triggers"]) >= 1
        assert len(s["counterfactuals"]) >= 3  # Minimum 3 counterfactual assumptions contract


def test_get_scenario_by_id_success():
    """Verify retrieving a specific scenario by ID."""
    response = client.get("/api/v1/scenarios/SCEN-001", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "SCEN-001"
    assert data["scenario_class"] == "conservative"
    assert len(data["counterfactuals"]) >= 3


def test_get_scenario_by_id_not_found():
    """Verify retrieving an invalid scenario returns 404."""
    response = client.get("/api/v1/scenarios/SCEN-NONEXISTENT", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_simulate_counterfactual_nominal():
    """Verify executing What-If counterfactual simulation under standard parameters."""
    payload = {
        "scenario_id": "SCEN-002",
        "adoption_speed_multiplier": 1.1,
        "wage_inflation_pct": 3.5,
        "automation_aggression": 1.1,
        "capital_cost_delta_pct": 5.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["scenario"]["scenario_id"] == "SCEN-002"
    impact = data["impact"]
    assert impact["simulated_ebitda_usd"] > impact["base_ebitda_usd"]
    assert impact["delta_ebitda_usd"] > 0
    assert impact["risk_assessment"] in ["LOW_VOLATILITY", "HIGH_RETURN"]
    assert len(impact["tripped_triggers"]) == 0
    assert "projected EBITDA shifts" in impact["counterfactual_narrative"]


def test_simulate_counterfactual_tripping_triggers():
    """Verify extreme parameter simulation trips invalidation triggers."""
    # Low adoption (< 0.6) and high aggression (> 1.8) and high capital delta (> 35%)
    payload = {
        "scenario_id": "SCEN-001",
        "adoption_speed_multiplier": 0.4,
        "wage_inflation_pct": 2.0,
        "automation_aggression": 2.2,
        "capital_cost_delta_pct": 45.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    impact = data["impact"]
    assert impact["risk_assessment"] == "ELEVATED_FRICTION"
    assert len(impact["tripped_triggers"]) >= 2
    assert "WARNING: Tripped" in impact["counterfactual_narrative"]


def test_simulate_counterfactual_high_capital_exposure():
    """Verify simulation with high capital cost delta but without tripped triggers."""
    payload = {
        "scenario_id": "SCEN-001",
        "adoption_speed_multiplier": 1.0,
        "wage_inflation_pct": 3.0,
        "automation_aggression": 1.0,
        "capital_cost_delta_pct": 25.0,  # > 20% but <= 35%
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    impact = data["impact"]
    assert impact["risk_assessment"] == "HIGH_CAPITAL_EXPOSURE"
    assert len(impact["tripped_triggers"]) == 0


def test_simulate_counterfactual_high_return():
    """Verify simulation resulting in high return."""
    payload = {
        "scenario_id": "SCEN-001",
        "adoption_speed_multiplier": 1.5,
        "wage_inflation_pct": 8.0,
        "automation_aggression": 1.4,
        "capital_cost_delta_pct": -5.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    impact = data["impact"]
    assert impact["risk_assessment"] == "HIGH_RETURN"


def test_simulate_counterfactual_not_found():
    """Verify simulation on non-existent scenario returns 404."""
    payload = {
        "scenario_id": "SCEN-UNKNOWN",
        "adoption_speed_multiplier": 1.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
