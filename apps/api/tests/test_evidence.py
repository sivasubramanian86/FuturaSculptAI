"""Unit tests for Evidence Ledger ingestion and hashing."""

import io

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_upload_evidence_computes_sha256_and_envelope():
    """Verify file upload produces valid EvidenceEnvelope with SHA-256 hash."""
    sample_content = b"SOP-401: Packaging Line Thermal Seal Inspection Guidelines.\nCheck temperature every 15 minutes."
    file_payload = {"file": ("packaging_sop.txt", io.BytesIO(sample_content), "text/plain")}

    response = client.post(
        "/api/v1/evidence/upload",
        files=file_payload,
        data={"source_type": "pdf", "author": "QA Operations"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "evidence_id" in data
    assert len(data["sha256_hash"]) == 64
    assert data["provenance"]["author_or_source"] == "QA Operations"
    assert len(data["content"]["segments"]) >= 1


def test_list_evidence_ledger():
    """Verify listing evidence for active tenant."""
    response = client.get("/api/v1/evidence", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
