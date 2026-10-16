"""Integration tests for WorkTwin Fabric API endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_and_get_worktwin_manifests():
    """Verify listing and retrieving WorkTwin manifests via HTTP."""
    # List manifests
    res = client.get("/api/worktwins/manifests", headers={"X-Tenant-ID": "tenant-food-mfg-01"})
    assert res.status_code == 200
    manifests = res.json()
    assert len(manifests) >= 8

    twin_id = manifests[0]["twin_id"]
    get_res = client.get(f"/api/worktwins/manifests/{twin_id}")
    assert get_res.status_code == 200
    assert get_res.json()["twin_id"] == twin_id

    # Non-existent twin returns 404
    missing_res = client.get("/api/worktwins/manifests/twin-invalid-999")
    assert missing_res.status_code == 404


def test_create_custom_role_twin_endpoint():
    """Verify registering a new synthetic RoleTwin archetype via HTTP."""
    payload = {
        "role_archetype": "Packaging Line Robotics Operator",
        "declared_purpose": "Operating high-speed packaging robotic pick-and-place lines.",
        "skills": ["Robotic Cell Maintenance", "Packaging Speed Calibration"],
    }
    res = client.post("/api/worktwins/manifests", json=payload, headers={"X-Tenant-ID": "tenant-food-mfg-01"})
    assert res.status_code == 201
    data = res.json()
    assert data["role_archetype"] == payload["role_archetype"]
    assert data["twin_id"].startswith("twin-role-")

    # Missing fields return 400
    bad_res = client.post("/api/worktwins/manifests", json={"skills": []})
    assert bad_res.status_code == 400


def test_simulate_future_boardroom_endpoint():
    """Verify Future Boardroom simulation execution via HTTP."""
    payload = {
        "proposal_title": "AI Quality Vision Corridors",
        "proposal_description": "Install automated computer vision cameras on Line 3 conveyor to inspect sealed packages.",
        "sector": "food_manufacturing",
        "target_enterprise": "Artisan Food Processing Group",
    }
    res = client.post("/api/worktwins/boardroom/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["proposal_title"] == payload["proposal_title"]
    assert len(data["perspectives"]) >= 6
    assert "conflict_resolution" in data
    assert data["conflict_resolution"]["governed_recommendation"].startswith("APPROVE WITH CONDITIONS")


def test_register_personal_twin_consent_endpoint():
    """Verify employee consent submission for PersonalWorkTwin demo via HTTP."""
    payload = {
        "employee_id": "EMP-4102",
        "knowledge_consent": True,
        "writing_style_consent": True,
        "delegated_task_consent": True,
        "voice_avatar_consent": False,
        "revoked": False,
        "consent_timestamp": "2026-10-16T10:30:00Z",
    }
    res = client.post("/api/worktwins/personal/consent", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["twin_type"] == "PERSONAL_WORKTWIN"
    assert data["owner_id"] == "EMP-4102"
    assert data["tenant_id"] == "tenant-food-mfg-01"
