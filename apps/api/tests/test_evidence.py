"""Unit tests for Evidence Ledger, multimodal ingestion, DLP masking, and claim verification."""

import io
import json

from fastapi.testclient import TestClient

from app.adapters.dlp_adapter import dlp_adapter
from app.main import app
from app.models.evidence import ClaimVerdict, SourceType
from app.services.multimodal_parser import multimodal_parser

client = TestClient(app)


def test_upload_evidence_computes_sha256_and_envelope():
    """Verify file upload produces valid EvidenceEnvelope with SHA-256 hash."""
    sample_content = (
        b"SOP-401: Packaging Line Thermal Seal Inspection Guidelines.\nCheck temperature 185 C every 15 minutes."
    )
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


def test_upload_multiple_documents_and_retrieve_detail():
    """Verify multiple uploads, retrieval by ID, and integrity check."""
    second_doc = b"SOP-402: Sanitation Procedure for Mixing Tanks. Operator must sanitize valves."
    file_payload = {"file": ("sanitation_sop.txt", io.BytesIO(second_doc), "text/plain")}

    upload_resp = client.post(
        "/api/v1/evidence/upload",
        files=file_payload,
        data={"source_type": "pdf", "author": "Sanitation Ops"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert upload_resp.status_code == 201
    ev_id = upload_resp.json()["evidence_id"]

    # Retrieve detail
    detail_resp = client.get(f"/api/v1/evidence/{ev_id}", headers={"X-Tenant-ID": "tenant-test-01"})
    assert detail_resp.status_code == 200
    assert detail_resp.json()["evidence_id"] == ev_id

    # Check cryptographic integrity
    integrity_resp = client.get(
        f"/api/v1/evidence/{ev_id}/integrity",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert integrity_resp.status_code == 200
    assert integrity_resp.json()["is_valid"] is True
    assert integrity_resp.json()["evidence_id"] == ev_id


def test_get_evidence_detail_and_integrity_404():
    """Verify 404 response when evidence ID is not found."""
    detail_resp = client.get(
        "/api/v1/evidence/EVD-NONEXISTENT",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert detail_resp.status_code == 404

    integrity_resp = client.get(
        "/api/v1/evidence/EVD-NONEXISTENT/integrity",
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert integrity_resp.status_code == 404


def test_multimodal_ingestion_formats():
    """Verify ingestion across CSV, JSON, Image, and Audio/Video."""
    # 1. CSV
    csv_bytes = b"role_id,role_name,headcount\nROL-01,Frontline Inspector,24\nROL-02,Packer,50"
    csv_payload = {"file": ("roles.csv", io.BytesIO(csv_bytes), "text/csv")}
    csv_resp = client.post(
        "/api/v1/evidence/upload",
        files=csv_payload,
        data={"source_type": "csv"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert csv_resp.status_code == 201
    assert len(csv_resp.json()["content"]["segments"]) == 2

    # 2. JSON
    json_bytes = json.dumps([{"task_id": "TSK-01", "name": "Seal inspection"}]).encode("utf-8")
    json_payload = {"file": ("tasks.json", io.BytesIO(json_bytes), "application/json")}
    json_resp = client.post(
        "/api/v1/evidence/upload",
        files=json_payload,
        data={"source_type": "api"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert json_resp.status_code == 201

    # 3. Image
    img_bytes = b"\x89PNG\r\n\x1a\nfakeimagebytes"
    img_payload = {"file": ("thermal_camera.png", io.BytesIO(img_bytes), "image/png")}
    img_resp = client.post(
        "/api/v1/evidence/upload",
        files=img_payload,
        data={"source_type": "image"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert img_resp.status_code == 201
    assert "Visual Asset" in img_resp.json()["content"]["normalized_text"]

    # 4. Audio/Video
    media_bytes = b"fakeaudiobytes"
    media_payload = {"file": ("briefing.mp3", io.BytesIO(media_bytes), "audio/mpeg")}
    media_resp = client.post(
        "/api/v1/evidence/upload",
        files=media_payload,
        data={"source_type": "audio"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert media_resp.status_code == 201
    assert "Media Asset" in media_resp.json()["content"]["normalized_text"]


def test_dlp_masking_integration():
    """Verify Sensitive Data Protection (DLP) masks email, phone, SSN, and compensation."""
    text_with_pii = (
        "Lead Inspector contact: john.doe@enterprise.com, phone: +1-555-019-2834. "
        "SSN: 123-45-6789. Card: 4111-2222-3333-4444. Salary: $125,000/yr."
    )
    redaction = dlp_adapter.redact_text(text_with_pii)
    assert "[REDACTED_EMAIL]" in redaction.sanitized_text
    assert "[REDACTED_PHONE]" in redaction.sanitized_text
    assert "[REDACTED_SSN]" in redaction.sanitized_text
    assert "[REDACTED_CREDIT_CARD]" in redaction.sanitized_text
    assert "[REDACTED_COMPENSATION]" in redaction.sanitized_text
    assert redaction.redacted_items_count == 5

    # Empty text case
    empty_redaction = dlp_adapter.redact_text("")
    assert empty_redaction.redacted_items_count == 0


def test_multimodal_parser_edge_cases():
    """Verify empty CSV, JSON dict, JSON primitive, empty text, corrupt JSON, whitespace PDF, and entity dedup."""
    # Empty CSV
    res_csv, segs_csv = multimodal_parser._parse_csv(b"")
    assert res_csv == ""
    assert segs_csv == []

    # JSON dict
    json_dict_bytes = b'{"module": "thermal", "tolerance": 0.05}'
    content_dict = multimodal_parser.parse_document(json_dict_bytes, "config.json", SourceType.API)
    assert len(content_dict.segments) == 2

    # JSON primitive
    json_prim_bytes = b'"simple string"'
    content_prim = multimodal_parser.parse_document(json_prim_bytes, "prim.json", SourceType.API)
    assert len(content_prim.segments) == 1

    # Empty text
    empty_content = multimodal_parser.parse_document(b"", "empty.txt", SourceType.WEB)
    assert empty_content.normalized_text == ""

    # Corrupt JSON fallback to text
    corrupt_json = multimodal_parser.parse_document(b"{invalid: json, data", "bad.json", SourceType.API)
    assert "{invalid: json, data" in corrupt_json.normalized_text

    # PDF with Parentheses literals
    pdf_stream = b"BT /F1 12 Tf (SOP-999: Sterilization Procedures) Tj ET"
    pdf_content = multimodal_parser.parse_document(pdf_stream, "sop.pdf", SourceType.PDF)
    assert "SOP-999" in pdf_content.normalized_text

    # Whitespace PDF fallback
    pdf_empty = multimodal_parser.parse_document(b"   \n\n   ", "empty.pdf", SourceType.PDF)
    assert "Operational SOP document." in pdf_empty.segments[0].text

    # Deduplicated entities (SOP codes, metrics, roles)
    dedup_text = "SOP-500 and SOP-500. Temperature 88 °C and 88 °C. Lead Operator and Lead Operator."
    entities = multimodal_parser._extract_entities(dedup_text)
    entity_names = [e.name for e in entities]
    assert entity_names.count("SOP-500") == 1
    assert entity_names.count("88 °C") == 1
    assert entity_names.count("Operator") == 1


def test_claim_verification_outcomes():
    """Verify Claim Verifier for SUPPORTED, CONTRADICTED, and INSUFFICIENT_EVIDENCE."""
    # 1. Supported claim
    claim_payload = {
        "claim_text": "Sanitation procedure requires operator to sanitize valves.",
        "evidence_ids": [],
    }
    supported_resp = client.post(
        "/api/v1/evidence/verify-claim",
        json=claim_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert supported_resp.status_code == 200
    res_data = supported_resp.json()
    assert res_data["verdict"] == ClaimVerdict.SUPPORTED.value
    assert len(res_data["cited_segments"]) >= 1

    # 2. Contradicted claim (asserts zero checks when SOP states operator must sanitize)
    contradict_payload = {
        "claim_text": "Operator must zero checks and never sanitize valves.",
        "evidence_ids": [],
    }
    contra_resp = client.post(
        "/api/v1/evidence/verify-claim",
        json=contradict_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert contra_resp.status_code == 200
    assert contra_resp.json()["verdict"] == ClaimVerdict.CONTRADICTED.value

    # 3. Insufficient evidence claim (unrelated topic)
    unrelated_payload = {
        "claim_text": "Quantum teleportation algorithms in aerospace satellites.",
        "evidence_ids": [],
    }
    unrelated_resp = client.post(
        "/api/v1/evidence/verify-claim",
        json=unrelated_payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert unrelated_resp.status_code == 200
    assert unrelated_resp.json()["verdict"] == ClaimVerdict.INSUFFICIENT_EVIDENCE.value

    # 4. Empty claim
    empty_claim_resp = client.post(
        "/api/v1/evidence/verify-claim",
        json={"claim_text": "", "evidence_ids": []},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert empty_claim_resp.status_code == 200
    assert empty_claim_resp.json()["verdict"] == ClaimVerdict.INSUFFICIENT_EVIDENCE.value

    # 5. Nonexistent target evidence IDs
    missing_id_resp = client.post(
        "/api/v1/evidence/verify-claim",
        json={"claim_text": "Sanitation valve check", "evidence_ids": ["EVD-NONEXISTENT"]},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert missing_id_resp.status_code == 200
    assert missing_id_resp.json()["verdict"] == ClaimVerdict.INSUFFICIENT_EVIDENCE.value


def test_claim_verification_multiple_segments_in_envelope():
    """Verify that multiple segments matching within the same envelope are processed cleanly."""
    doc_content = (
        "Valve sanitation procedure requires operator inspection.\n\n"
        "Operator valve sanitation inspection log must be filed every shift."
    )
    payload = {"file": ("multi_seg.txt", io.BytesIO(doc_content.encode("utf-8")), "text/plain")}
    resp = client.post(
        "/api/v1/evidence/upload",
        files=payload,
        data={"source_type": "pdf", "author": "Shift QA"},
        headers={"X-Tenant-ID": "tenant-test-multi"},
    )
    assert resp.status_code == 201
    ev_id = resp.json()["evidence_id"]

    verify_resp = client.post(
        "/api/v1/evidence/verify-claim",
        json={"claim_text": "Valve sanitation procedure operator", "evidence_ids": [ev_id]},
        headers={"X-Tenant-ID": "tenant-test-multi"},
    )
    assert verify_resp.status_code == 200
    res = verify_resp.json()
    assert res["verdict"] == ClaimVerdict.SUPPORTED.value
    assert len(res["cited_segments"]) == 2
    assert res["cited_evidence_ids"] == [ev_id]
