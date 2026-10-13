"""Unit tests for organization onboarding router."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_onboard_organization_successful():
    """Verify onboarding creates tenant workspace with seed graph and scenarios."""
    payload = {
        "organization_name": "Nordic Foods Processing",
        "sector": "food_manufacturing",
        "headcount": 450,
        "primary_strategic_goal": "Modernize packaging line quality assurance and reduce defect rates",
        "contact_email": "coo@nordicfoods.com",
    }
    response = client.post(
        "/api/v1/onboard",
        json=payload,
        headers={"X-Tenant-ID": "tenant-nordic-01"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tenant_id"] == "tenant-nordic-01"
    assert data["organization_name"] == "Nordic Foods Processing"
    assert data["workspace_initialized"] is True
    assert data["seed_nodes_count"] > 0
    assert data["seed_scenarios_count"] == 4
