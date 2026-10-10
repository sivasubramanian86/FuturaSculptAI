"""Evidence ingestion and EvidenceEnvelope normalization service."""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List

from app.core.security import assert_responsible_workforce_compliance, sanitize_input_text
from app.models.evidence import (
    EvidenceContent,
    EvidenceEnvelope,
    EvidenceProvenance,
    EvidenceSegment,
    SensitivityTier,
    SourceType,
)

# In-memory tenant evidence store for Phase 1 vertical slice
_EVIDENCE_STORE: Dict[str, List[EvidenceEnvelope]] = {}


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
    2. Runs Responsible Workforce Red Line check and sanitization.
    3. Normalizes text content into segments.
    4. Records envelope in the Evidence Ledger.

    Args:
        tenant_id: Target tenant.
        file_name: Original file name.
        file_bytes: Raw binary content.
        source_type: Ingested file type (PDF, CSV, image, etc.).
        author: Attribution or source document author.
        sensitivity: Data classification.

    Returns:
        EvidenceEnvelope: Validated and stored evidence envelope.
    """
    # 1. Compute SHA-256
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # 2. Extract and decode text (safe UTF-8 decoding with replacement)
    raw_text = file_bytes.decode("utf-8", errors="replace")

    # 3. Security & Policy Inspection
    assert_responsible_workforce_compliance(raw_text)
    sanitized_text = sanitize_input_text(raw_text)

    # 4. Generate segments
    lines = [line.strip() for line in sanitized_text.splitlines() if line.strip()]
    segments: List[EvidenceSegment] = []
    for idx, line in enumerate(lines[:50]):  # Cap initial slice to 50 segments
        segments.append(
            EvidenceSegment(
                segment_id=f"SEG-{idx+1:03d}",
                offset_start=idx * 100,
                offset_end=(idx + 1) * 100,
                page_number=(idx // 10) + 1,
                text=line,
            )
        )

    evidence_id = f"EVD-{uuid.uuid4().hex[:8].upper()}"

    envelope = EvidenceEnvelope(
        evidence_id=evidence_id,
        tenant_id=tenant_id,
        source_type=source_type,
        source_uri=f"gs://futurasculpt-evidence/{tenant_id}/{file_name}",
        sha256_hash=sha256_hash,
        ingested_at=datetime.now(timezone.utc),
        content=EvidenceContent(
            language="en",
            normalized_text=sanitized_text[:5000],  # Normalized preview
            segments=segments,
        ),
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

    return envelope


def get_tenant_evidence_ledger(tenant_id: str) -> List[EvidenceEnvelope]:
    """Retrieve all ingested evidence envelopes for a given tenant.

    Args:
        tenant_id: Tenant identifier.

    Returns:
        List[EvidenceEnvelope]: All active envelopes.
    """
    return _EVIDENCE_STORE.get(tenant_id, [])
