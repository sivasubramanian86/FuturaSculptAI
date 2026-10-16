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


def test_materially_different_proposals_produce_different_deliberations():
    """Release Gate: verify materially different proposals produce distinct recommendations, disagreements, and evidentiary support."""
    first = client.post(
        "/api/v1/worktwins/boardroom/simulate",
        json={
            "proposal_title": "Autonomous Packaging Quality Corridors",
            "proposal_description": "Use computer vision and cobots.",
            "sector": "food_manufacturing",
        },
    ).json()
    second = client.post(
        "/api/v1/worktwins/boardroom/simulate",
        json={
            "proposal_title": "Four-Day Human-First Work Week",
            "proposal_description": "Prohibit automation and increase mentoring.",
            "sector": "financial_services",
        },
    ).json()
    assert first["perspectives"] != second["perspectives"]
    assert {p["recommendation"] for p in first["perspectives"]} != {p["recommendation"] for p in second["perspectives"]}
    assert first["conflict_resolution"]["disagreements"] != second["conflict_resolution"]["disagreements"]
    for result in (first, second):
        for perspective in result["perspectives"]:
            assert perspective["support_status"] in {
                "SUPPORTED",
                "INSUFFICIENT_EVIDENCE",
                "NON_FACTUAL_RECOMMENDATION",
            }
            if perspective["support_status"] == "SUPPORTED":
                assert perspective["source_spans"]
                assert all(span.get("evidence_id") for span in perspective["source_spans"])


def test_adversarial_proposals_with_similar_titles_produce_opposite_deliberations():
    """Adversarial Release Gate: Two proposals with similar titles but opposite policy intentions produce opposite stances and recommendations."""
    adv_automation = client.post(
        "/api/v1/worktwins/boardroom/simulate",
        json={
            "proposal_title": "Workforce Optimization Protocol: Maximum Automation Surge",
            "proposal_description": "Eliminate manual touchpoints across all facilities and replace human line workers.",
            "sector": "food_manufacturing",
        },
    ).json()
    adv_human = client.post(
        "/api/v1/worktwins/boardroom/simulate",
        json={
            "proposal_title": "Workforce Optimization Protocol: Human Agency Sanctuary",
            "proposal_description": "Prohibit automation and establish human-first four-day mentoring sanctuaries.",
            "sector": "food_manufacturing",
        },
    ).json()

    assert adv_automation["perspectives"] != adv_human["perspectives"]
    assert {p["recommendation"] for p in adv_automation["perspectives"]} != {p["recommendation"] for p in adv_human["perspectives"]}

    # Extreme automation triggers BLOCKING from worker-protection roles
    auto_chro = next(p for p in adv_automation["perspectives"] if p["role"] == "CHRO")
    human_chro = next(p for p in adv_human["perspectives"] if p["role"] == "CHRO")
    assert auto_chro["stance"] == "BLOCKING"
    assert human_chro["stance"] == "FAVORABLE"


