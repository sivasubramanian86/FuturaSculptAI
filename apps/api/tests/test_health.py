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
