"""Evidence Ledger and file ingestion API router."""

from typing import List

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.tenant import get_current_tenant_id
from app.models.evidence import EvidenceEnvelope, SensitivityTier, SourceType
from app.services.ingestion_service import (
    get_tenant_evidence_ledger,
    process_raw_evidence_upload,
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
