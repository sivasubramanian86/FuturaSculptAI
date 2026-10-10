"""Evidence Ledger and multimodal file ingestion API router."""

from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.tenant import get_current_tenant_id
from app.models.evidence import (
    ClaimVerificationRequest,
    ClaimVerificationResult,
    EvidenceEnvelope,
    IntegrityCheckResult,
    SensitivityTier,
    SourceType,
)
from app.services.ingestion_service import (
    get_evidence_by_id,
    get_tenant_evidence_ledger,
    process_raw_evidence_upload,
    verify_claim_against_ledger,
    verify_evidence_integrity,
)

router = APIRouter(prefix="/api/v1/evidence", tags=["Evidence"])


@router.post("/upload", response_model=EvidenceEnvelope, status_code=status.HTTP_201_CREATED)
async def upload_evidence_file(
    file: UploadFile = File(...),
    source_type: SourceType = Form(SourceType.PDF),
    author: str = Form("Enterprise Uploader"),
    sensitivity: SensitivityTier = Form(SensitivityTier.INTERNAL),
    tenant_id: str = Depends(get_current_tenant_id),
) -> EvidenceEnvelope:
    """Ingest a multimodal evidence document and register it in the Evidence Ledger.

    Args:
        file: Uploaded file multipart stream.
        source_type: Document or media format.
        author: Attribution or source description.
        sensitivity: Data classification.
        tenant_id: Scoped tenant identifier.

    Returns:
        EvidenceEnvelope: Validated and hashed evidence envelope.
    """
    file_bytes = await file.read()
    return process_raw_evidence_upload(
        tenant_id=tenant_id,
        file_name=file.filename or "unknown_asset",
        file_bytes=file_bytes,
        source_type=source_type,
        author=author,
        sensitivity=sensitivity,
    )


@router.get("", response_model=List[EvidenceEnvelope])
def list_evidence_ledger(
    tenant_id: str = Depends(get_current_tenant_id),
) -> List[EvidenceEnvelope]:
    """Retrieve all evidence envelopes registered in the tenant's Evidence Ledger.

    Args:
        tenant_id: Scoped tenant identifier.

    Returns:
        List[EvidenceEnvelope]: All active evidence envelopes.
    """
    return get_tenant_evidence_ledger(tenant_id)


@router.get("/{evidence_id}", response_model=EvidenceEnvelope)
def get_evidence_detail(
    evidence_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
) -> EvidenceEnvelope:
    """Retrieve fine-grained segments and provenance for a single evidence asset.

    Args:
        evidence_id: Target evidence identifier.
        tenant_id: Scoped tenant identifier.

    Returns:
        EvidenceEnvelope: Detailed envelope with segments.
    """
    envelope = get_evidence_by_id(tenant_id, evidence_id)
    if not envelope:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence artifact '{evidence_id}' not found.",
        )
    return envelope


@router.get("/{evidence_id}/integrity", response_model=IntegrityCheckResult)
def check_evidence_integrity(
    evidence_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
) -> IntegrityCheckResult:
    """Re-verify cryptographic SHA-256 fingerprint for tamper detection.

    Args:
        evidence_id: Target evidence identifier.
        tenant_id: Scoped tenant identifier.

    Returns:
        IntegrityCheckResult: Tamper check status and timestamp.
    """
    result = verify_evidence_integrity(tenant_id, evidence_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence artifact '{evidence_id}' not found.",
        )
    return result


@router.post("/verify-claim", response_model=ClaimVerificationResult)
def verify_scenario_claim(
    request: ClaimVerificationRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> ClaimVerificationResult:
    """Audit an AI scenario assertion against tenant evidence envelopes.

    Args:
        request: Claim text and target evidence IDs.
        tenant_id: Scoped tenant identifier.

    Returns:
        ClaimVerificationResult: Entailment verdict, confidence, and cited segments.
    """
    return verify_claim_against_ledger(tenant_id, request)
