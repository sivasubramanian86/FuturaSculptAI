"""Unit tests for Temporal WorkGraph snapshots, horizon projections, and blast radius analytics."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.workgraph import NodeType

client = TestClient(app)


def test_get_baseline_workgraph():
    """Verify default baseline WorkGraph response."""
    response = client.get("/api/v1/workgraph", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tenant-test-01"
    assert data["total_nodes"] >= 8
    assert data["total_edges"] >= 8


def test_get_temporal_snapshots_across_horizons():
    """Verify temporal projections at Year 0, Year 1, and Year 3."""
    # Year 0: Baseline
    resp_y0 = client.get(
        "/api/v1/workgraph/temporal?horizon_year=0",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_y0.status_code == 200
    data_y0 = resp_y0.json()
    assert data_y0["summary"]["horizon_year"] == 0
    assert data_y0["summary"]["human_task_allocation_pct"] == 100.0
    assert data_y0["summary"]["agent_task_allocation_pct"] == 0.0

    # Year 1: Hybrid Augmentation
    resp_y1 = client.get(
        "/api/v1/workgraph/temporal?horizon_year=1",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_y1.status_code == 200
    data_y1 = resp_y1.json()
    assert data_y1["summary"]["horizon_year"] == 1
    assert data_y1["summary"]["agent_task_allocation_pct"] == 40.0
    # Verify SKL-002 reskilling node is present
    node_ids_y1 = [n["node_id"] for n in data_y1["graph"]["nodes"]]
    assert "SKL-002" in node_ids_y1

    # Year 3: Autonomous Continuous Transformation
    resp_y3 = client.get(
        "/api/v1/workgraph/temporal?horizon_year=3",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_y3.status_code == 200
    data_y3 = resp_y3.json()
    assert data_y3["summary"]["horizon_year"] == 3
    assert data_y3["summary"]["agent_task_allocation_pct"] == 80.0
    node_ids_y3 = [n["node_id"] for n in data_y3["graph"]["nodes"]]
    assert "ROL-003" in node_ids_y3


def test_compute_blast_radius_success():
    """Verify downstream reachability cascade from Capability to Workflow, Task, and Role."""
    response = client.get(
        "/api/v1/workgraph/blast-radius?node_id=CAP-001&max_depth=3",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_node_id"] == "CAP-001"
    assert data["total_affected_nodes"] >= 1
    assert data["disruption_risk"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(data["cascade"]) >= 1


def test_compute_blast_radius_edge_cases(monkeypatch):
    """Verify blast radius on nonexistent, critical, high, medium, and low risk scenarios."""
    # 1. Nonexistent node 404
    resp_404 = client.get(
        "/api/v1/workgraph/blast-radius?node_id=NONEXISTENT_NODE",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_404.status_code == 404

    # 2. Critical risk (reaches FDA Control CTR-001)
    resp_crit = client.get(
        "/api/v1/workgraph/blast-radius?node_id=WF-001&max_depth=2",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_crit.status_code == 200
    assert resp_crit.json()["disruption_risk"] == "CRITICAL"
    assert "FDA 21 CFR Part 11 Audit Trail" in resp_crit.json()["affected_controls"]

    # 3. Test isolated node for LOW disruption risk and 1-2 nodes for MEDIUM
    from app.models.workgraph import NodeProperties, WorkGraphNode, WorkGraphResponse

    def mock_seed_graph(tenant_id: str) -> WorkGraphResponse:
        nodes = [
            WorkGraphNode(
                node_id="ISO-001",
                tenant_id=tenant_id,
                node_type=NodeType.TASK,
                name="Isolated Archival Check",
                description="Stand-alone manual task.",
                properties=NodeProperties(),
            ),
            WorkGraphNode(
                node_id="MED-001",
                tenant_id=tenant_id,
                node_type=NodeType.TASK,
                name="Medium Impact Task",
                description="Task with single connection.",
                properties=NodeProperties(),
            ),
            WorkGraphNode(
                node_id="MED-ROLE",
                tenant_id=tenant_id,
                node_type=NodeType.ROLE,
                name="Operator Role",
                description="Single role connection.",
                properties=NodeProperties(),
            ),
            WorkGraphNode(
                node_id="HIGH-001",
                tenant_id=tenant_id,
                node_type=NodeType.SYSTEM,
                name="High Impact System",
                description="System with 3 connected tasks.",
                properties=NodeProperties(),
            ),
            WorkGraphNode(
                node_id="HIGH-T1",
                tenant_id=tenant_id,
                node_type=NodeType.TASK,
                name="Task 1",
                description="Task 1",
                properties=NodeProperties(),
            ),
            WorkGraphNode(
                node_id="HIGH-T2",
                tenant_id=tenant_id,
                node_type=NodeType.TASK,
                name="Task 2",
                description="Task 2",
                properties=NodeProperties(),
            ),
            WorkGraphNode(
                node_id="HIGH-T3",
                tenant_id=tenant_id,
                node_type=NodeType.TASK,
                name="Task 3",
                description="Task 3",
                properties=NodeProperties(),
            ),
        ]
        from app.models.workgraph import EdgeType, WorkGraphEdge

        edges = [
            WorkGraphEdge(
                edge_id="E-MED-1",
                tenant_id=tenant_id,
                source_node_id="MED-001",
                target_node_id="MED-ROLE",
                relation_type=EdgeType.EXECUTES,
            ),
            WorkGraphEdge(
                edge_id="E-HIGH-1",
                tenant_id=tenant_id,
                source_node_id="HIGH-001",
                target_node_id="HIGH-T1",
                relation_type=EdgeType.OPERATES_SYSTEM,
            ),
            WorkGraphEdge(
                edge_id="E-HIGH-2",
                tenant_id=tenant_id,
                source_node_id="HIGH-001",
                target_node_id="HIGH-T2",
                relation_type=EdgeType.OPERATES_SYSTEM,
            ),
            WorkGraphEdge(
                edge_id="E-HIGH-3",
                tenant_id=tenant_id,
                source_node_id="HIGH-001",
                target_node_id="HIGH-T3",
                relation_type=EdgeType.OPERATES_SYSTEM,
            ),
        ]
        return WorkGraphResponse(
            tenant_id=tenant_id,
            sector="food_manufacturing",
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges),
        )

    monkeypatch.setattr(
        "app.services.temporal_graph_engine.get_food_manufacturing_seed_graph",
        mock_seed_graph,
    )

    # Isolated node -> LOW
    res_low = client.get(
        "/api/v1/workgraph/blast-radius?node_id=ISO-001&max_depth=2",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert res_low.status_code == 200
    assert res_low.json()["disruption_risk"] == "LOW"

    # Single connection -> MEDIUM
    res_med = client.get(
        "/api/v1/workgraph/blast-radius?node_id=MED-001&max_depth=2",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert res_med.status_code == 200
    assert res_med.json()["disruption_risk"] == "MEDIUM"

    # 3 connections without controls -> HIGH
    res_high = client.get(
        "/api/v1/workgraph/blast-radius?node_id=HIGH-001&max_depth=2",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert res_high.status_code == 200
    assert res_high.json()["disruption_risk"] == "HIGH"
    assert "Task 1" in res_high.json()["affected_tasks"]

    # Reaching a system from a task
    res_sys = client.get(
        "/api/v1/workgraph/blast-radius?node_id=HIGH-T1&max_depth=2",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert res_sys.status_code == 200
    assert "High Impact System" in res_sys.json()["affected_systems"]
