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
