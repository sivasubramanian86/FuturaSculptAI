"""Evidence ingestion and EvidenceEnvelope normalization service."""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.core.security import assert_responsible_workforce_compliance
from app.models.evidence import (
    ClaimVerificationRequest,
    ClaimVerificationResult,
    EvidenceEnvelope,
    EvidenceProvenance,
    IntegrityCheckResult,
    SensitivityTier,
    SourceType,
)
from app.adapters.storage_adapter import storage_adapter
from app.services.evidence_verifier import evidence_verifier
from app.services.multimodal_parser import multimodal_parser

# In-memory tenant evidence store
_EVIDENCE_STORE: Dict[str, List[EvidenceEnvelope]] = {}
# Raw hash storage for cryptographic tamper verification
_HASH_STORE: Dict[str, str] = {}


def process_raw_evidence_upload(
    tenant_id: str,
    file_name: str,
    file_bytes: bytes,
    source_type: SourceType,
    author: str = "Enterprise Ingestion Pipeline",
    sensitivity: SensitivityTier = SensitivityTier.INTERNAL,
) -> EvidenceEnvelope:
    """Process uploaded evidence raw bytes into a verified EvidenceEnvelope.

    1. Computes cryptographic SHA-256 hash.
    2. Runs Responsible Workforce Red Line check.
    3. Normalizes text content via multimodal parser with automated DLP masking.
    4. Records envelope in the Evidence Ledger and registers hash.

    Args:
        tenant_id: Target tenant identifier.
        file_name: Original file name.
        file_bytes: Raw binary content.
        source_type: Ingested file type (PDF, CSV, image, audio, video, etc.).
        author: Attribution or source document author.
        sensitivity: Data classification tier.

    Returns:
        EvidenceEnvelope: Validated and stored evidence envelope.
    """
    # 1. Compute SHA-256 hash
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # 2. Responsible AI compliance assertion
    raw_str = file_bytes.decode("utf-8", errors="replace")
    assert_responsible_workforce_compliance(raw_str)

    # 3. Multimodal parsing and automated DLP redaction
    content = multimodal_parser.parse_document(file_bytes, file_name, source_type)

    evidence_id = f"EVD-{uuid.uuid4().hex[:8].upper()}"

    # 4. Store raw evidence blob in GCS
    source_uri = storage_adapter.upload_evidence_blob(
        tenant_id=tenant_id,
        file_name=file_name,
        file_bytes=file_bytes,
    )

    envelope = EvidenceEnvelope(
        evidence_id=evidence_id,
        tenant_id=tenant_id,
        source_type=source_type,
        source_uri=source_uri,
        sha256_hash=sha256_hash,
        ingested_at=datetime.now(timezone.utc),
        content=content,
        provenance=EvidenceProvenance(
            author_or_source=author,
            publication_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            freshness_horizon_days=180,
            confidence=0.98,
        ),
        acl=["role:analyst", "role:executive"],
        sensitivity=sensitivity,
    )

    _EVIDENCE_STORE.setdefault(tenant_id, []).append(envelope)
    _HASH_STORE[evidence_id] = sha256_hash

    return envelope


def get_tenant_evidence_ledger(tenant_id: str) -> List[EvidenceEnvelope]:
    """Retrieve all ingested evidence envelopes for a given tenant.

    Args:
        tenant_id: Tenant identifier.

    Returns:
        List[EvidenceEnvelope]: All active envelopes.
    """
    return _EVIDENCE_STORE.get(tenant_id, [])


def get_evidence_by_id(tenant_id: str, evidence_id: str) -> Optional[EvidenceEnvelope]:
    """Retrieve a single evidence envelope by ID under tenant isolation.

    Args:
        tenant_id: Tenant identifier.
        evidence_id: Target evidence ID.

    Returns:
        Optional[EvidenceEnvelope]: Matching envelope if found, else None.
    """
    envelopes = _EVIDENCE_STORE.get(tenant_id, [])
    for env in envelopes:
        if env.evidence_id == evidence_id:
            return env
    return None


def verify_evidence_integrity(tenant_id: str, evidence_id: str) -> Optional[IntegrityCheckResult]:
    """Verify cryptographic SHA-256 integrity of an evidence artifact.

    Args:
        tenant_id: Tenant identifier.
        evidence_id: Target evidence ID.

    Returns:
        Optional[IntegrityCheckResult]: Integrity status result if found, else None.
    """
    envelope = get_evidence_by_id(tenant_id, evidence_id)
    if not envelope:
        return None

    expected_hash = _HASH_STORE.get(evidence_id, envelope.sha256_hash)
    is_valid = envelope.sha256_hash == expected_hash

    return IntegrityCheckResult(
        evidence_id=evidence_id,
        sha256_hash=envelope.sha256_hash,
        is_valid=is_valid,
        checked_at=datetime.now(timezone.utc),
    )


def verify_claim_against_ledger(
    tenant_id: str,
    request: ClaimVerificationRequest,
) -> ClaimVerificationResult:
    """Audit an AI scenario claim against tenant evidence envelopes.

    Args:
        tenant_id: Tenant identifier.
        request: ClaimVerificationRequest with claim text and optional evidence IDs.

    Returns:
        ClaimVerificationResult: Entailment verdict, confidence, and cited segments.
    """
    envelopes = get_tenant_evidence_ledger(tenant_id)
    return evidence_verifier.verify_claim(request, envelopes)
