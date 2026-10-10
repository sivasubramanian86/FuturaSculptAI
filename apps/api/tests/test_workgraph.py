"""Unit tests for WorkGraph queries and temporal nodes."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_workgraph_returns_nodes_and_edges():
    """Verify WorkGraph endpoint returns nodes and valid schema."""
    response = client.get("/api/v1/workgraph", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tenant-test-01"
    assert data["sector"] == "food_manufacturing"
    assert data["total_nodes"] > 5
    assert data["total_edges"] > 3

    # Assert specific node types exist
    node_types = {n["node_type"] for n in data["nodes"]}
    assert "outcome" in node_types
    assert "task" in node_types
    assert "role" in node_types
    assert "agent" in node_types


def test_workgraph_empty_tenant_header_raises_error():
    """Verify empty X-Tenant-ID header is rejected."""
    response = client.get("/api/v1/workgraph", headers={"X-Tenant-ID": "   "})
    assert response.status_code == 400
