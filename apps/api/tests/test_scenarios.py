"""Unit tests for Future Scenario Foundry."""

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
        assert len(s["counterfactuals"]) >= 1
