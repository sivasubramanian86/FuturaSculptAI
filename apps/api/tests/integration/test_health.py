"""Unit tests for health and readiness endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint_returns_product_identity():
    """Verify root endpoint returns correct metadata and tagline."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "FuturaSculptAI"
    assert "Sculpt work" in data["tagline"]


def test_liveness_probe_returns_up():
    """Verify liveness probe responds with UP status."""
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"


def test_readiness_probe_returns_ready():
    """Verify readiness probe responds with READY status and active project."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "READY"
    assert "gcp_project" in data


def test_healthz_endpoint_returns_healthy():
    """Verify healthz probe returns healthy status."""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_api_v1_health_returns_healthy():
    """Verify versioned api/v1/health endpoint returns healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_build_manifest_endpoint_returns_audit_metadata():
    """Verify build manifest exposes version, git SHA, and capability flags."""
    resp1 = client.get("/api/v1/system/build")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["application"] == "FuturaSculptAI"
    assert data1["version"] == "0.2.0"
    assert "git_sha" in data1
    assert data1["features"]["worktwin"] == "live"
    assert data1["features"]["ambient_copilot"] == "live"

    resp2 = client.get("/system/build")
    assert resp2.status_code == 200
    assert resp2.json()["version"] == "0.2.0"

