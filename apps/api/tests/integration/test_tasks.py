"""Unit tests for Task Redesign Matrix & Sculptor service and API router."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.agent_swarm import TaskClassificationType
from app.services.task_sculptor_service import task_sculptor_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_state():
    """Ensure clean tenant store state before each test."""
    task_sculptor_service.reset_tenant("tenant-test-01")
    task_sculptor_service.reset_tenant("tenant-iso-a")
    task_sculptor_service.reset_tenant("tenant-iso-b")


def test_get_matrix_seed_default():
    """Verify default seed matrix contains all 6 classification categories."""
    response = client.get("/api/v1/tasks/matrix", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()

    assert data["tenant_id"] == "tenant-test-01"
    assert data["total_tasks"] == 6
    assert data["workflow_id"] == "WKF-001"
    assert "High-Speed Packaging Line" in data["workflow_name"]

    summary = data["classification_summary"]
    for cat in TaskClassificationType:
        assert cat.value in summary
        assert summary[cat.value] >= 1

    assert data["overall_human_share_pct"] > 0
    assert data["overall_agent_share_pct"] > 0
    assert data["overall_cycle_time_reduction_pct"] > 0

    task_ids = [t["task_id"] for t in data["tasks"]]
    assert "TSK-001" in task_ids
    assert "TSK-006" in task_ids


def test_get_matrix_with_workflow_filter():
    """Verify matrix filters by workflow_id properly."""
    res_match = client.get(
        "/api/v1/tasks/matrix?workflow_id=WKF-001",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert res_match.status_code == 200
    assert res_match.json()["total_tasks"] == 6

    res_empty = client.get(
        "/api/v1/tasks/matrix?workflow_id=WKF-999",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert res_empty.status_code == 200
    assert res_empty.json()["total_tasks"] == 0
    assert res_empty.json()["overall_human_share_pct"] == 0.0


def test_get_task_by_id_success():
    """Verify retrieving specific task redesign specification."""
    response = client.get("/api/v1/tasks/TSK-001", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()

    assert data["task_id"] == "TSK-001"
    assert data["classification"] == "AUTOMATE"
    assert data["target_agent_id"] == "PackagingVisionAgent"
    assert data["baseline_cycle_time_seconds"] == 45.0
    assert data["target_cycle_time_seconds"] == 3.0
    assert data["cycle_time_reduction_pct"] == 93.3
    assert data["human_share_pct"] == 0.0
    assert data["agent_share_pct"] == 100.0
    assert data["status"] == "DRAFT"
    assert len(data["evidence_ids"]) >= 1


def test_get_task_by_id_not_found():
    """Verify 404 returned for unknown task ID."""
    response = client.get("/api/v1/tasks/TSK-NONEXISTENT", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_update_task_fields_and_recalculation():
    """Verify updating classification, cycle times, and automatic reduction recalculation."""
    update_payload = {
        "classification": "REDESIGN",
        "rationale": "Overhauled with multi-modal edge sensor stream.",
        "target_agent_id": "EdgeMultiModalAgent",
        "target_system": "Edge-TPU + Jetson Mesh",
        "target_cycle_time_seconds": 9.0,
        "human_share_pct": 20.0,
        "agent_share_pct": 80.0,
    }
    response = client.patch(
        "/api/v1/tasks/TSK-001",
        json=update_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["classification"] == "REDESIGN"
    assert data["rationale"] == update_payload["rationale"]
    assert data["target_agent_id"] == "EdgeMultiModalAgent"
    assert data["target_system"] == "Edge-TPU + Jetson Mesh"
    assert data["target_cycle_time_seconds"] == 9.0
    # Baseline was 45.0 -> (45 - 9) / 45 * 100 = 80.0%
    assert data["cycle_time_reduction_pct"] == 80.0
    assert data["human_share_pct"] == 20.0
    assert data["agent_share_pct"] == 80.0


def test_update_task_not_found():
    """Verify 404 returned when updating non-existent task."""
    response = client.patch(
        "/api/v1/tasks/TSK-UNKNOWN",
        json={"rationale": "New rationale"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_update_approved_task_reverts_to_draft():
    """Verify A2 Governance: modifying an approved task invalidates approval and reverts to DRAFT."""
    # TSK-003 begins as APPROVED
    check_orig = client.get("/api/v1/tasks/TSK-003", headers={"X-Tenant-ID": "tenant-test-01"})
    assert check_orig.json()["status"] == "APPROVED"
    assert check_orig.json()["approved_by"] == "Lead Production Engineer"

    # Modify TSK-003
    update_res = client.patch(
        "/api/v1/tasks/TSK-003",
        json={"target_cycle_time_seconds": 250.0},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "DRAFT"
    assert updated["approved_by"] is None
    assert updated["approval_timestamp"] is None
    assert updated["approval_notes"] is None
    assert updated["cycle_time_reduction_pct"] == round(((300.0 - 250.0) / 300.0) * 100.0, 1)


def test_update_task_baseline_zero():
    """Verify cycle time reduction calculation handles baseline of 0 safely."""
    # Temporarily set up a task with 0 baseline in tenant store
    store = task_sculptor_service._ensure_tenant("tenant-test-01")
    t0 = store["TSK-001"].model_copy(update={"baseline_cycle_time_seconds": 0.0})
    store["TSK-001"] = t0

    update_res = client.patch(
        "/api/v1/tasks/TSK-001",
        json={"target_cycle_time_seconds": 10.0},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["cycle_time_reduction_pct"] == 0.0


def test_approve_task_decision_approved():
    """Verify submitting approval transition updates status, approver, and timestamp."""
    payload = {
        "approver_id": "Chief Production Officer",
        "decision": "APPROVED",
        "notes": "Reviewed safety risk and SOP boundaries. Approved for deployment.",
    }
    response = client.post(
        "/api/v1/tasks/TSK-001/approval",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["task_id"] == "TSK-001"
    assert data["status"] == "APPROVED"
    assert data["approved_by"] == "Chief Production Officer"
    assert data["approval_notes"] == payload["notes"]
    assert data["approval_timestamp"] is not None
    assert data["task"]["status"] == "APPROVED"


def test_approve_task_decision_rejected():
    """Verify submitting rejection transition updates status accordingly."""
    payload = {
        "approver_id": "Plant Safety Inspector",
        "decision": "REJECTED",
        "notes": "Edge camera resolution does not meet ISO calibration standard.",
    }
    response = client.post(
        "/api/v1/tasks/TSK-001/approval",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "REJECTED"
    assert data["approved_by"] == "Plant Safety Inspector"
    assert data["task"]["status"] == "REJECTED"


def test_approve_task_invalid_decision_400():
    """Verify submitting invalid status transition (e.g. DRAFT) returns 400 Bad Request."""
    payload = {
        "approver_id": "Admin",
        "decision": "DRAFT",
    }
    response = client.post(
        "/api/v1/tasks/TSK-001/approval",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 400
    assert "APPROVED or REJECTED" in response.json()["detail"]


def test_approve_task_not_found():
    """Verify 404 returned when approving nonexistent task."""
    payload = {
        "approver_id": "Admin",
        "decision": "APPROVED",
    }
    response = client.post(
        "/api/v1/tasks/TSK-NONEXISTENT/approval",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_tenant_isolation():
    """Verify modifications in one tenant do not bleed into another tenant."""
    # Update task in tenant-iso-a
    client.patch(
        "/api/v1/tasks/TSK-002",
        json={"rationale": "Tenant A isolated modification"},
        headers={"X-Tenant-ID": "tenant-iso-a"},
    )

    # Check tenant-iso-a
    res_a = client.get("/api/v1/tasks/TSK-002", headers={"X-Tenant-ID": "tenant-iso-a"})
    assert res_a.json()["rationale"] == "Tenant A isolated modification"

    # Check tenant-iso-b
    res_b = client.get("/api/v1/tasks/TSK-002", headers={"X-Tenant-ID": "tenant-iso-b"})
    assert res_b.json()["rationale"] != "Tenant A isolated modification"


def test_fresh_tenant_lazy_initialization():
    """Verify fresh tenant accessing matrix auto-populates seed tasks via _ensure_tenant."""
    response = client.get("/api/v1/tasks/matrix", headers={"X-Tenant-ID": "tenant-fresh-lazy-init"})
    assert response.status_code == 200
    assert response.json()["total_tasks"] == 6
    assert response.json()["tenant_id"] == "tenant-fresh-lazy-init"
