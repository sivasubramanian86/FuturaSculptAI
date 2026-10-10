"""Pydantic schemas for Evidence Ledger and EvidenceEnvelope."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    """Supported multimodal evidence source formats."""

    PDF = "pdf"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    CSV = "csv"
    API = "api"
    WEB = "web"
    HUMAN_EXPERT = "human_expert"


class SensitivityTier(str, Enum):
    """Data sensitivity classification."""

    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED_PII = "restricted_pii"


class EvidenceSegment(BaseModel):
    """Sub-segment of evidence with location provenance."""

    segment_id: str
    offset_start: Optional[int] = None
    offset_end: Optional[int] = None
    page_number: Optional[int] = None
    timestamp_seconds: Optional[float] = None
    text: str


class EvidenceEntity(BaseModel):
    """Extracted business entity from evidence."""

    name: str
    entity_type: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class EvidenceContent(BaseModel):
    """Normalized content payload."""

    language: str = "en"
    normalized_text: str
    segments: List[EvidenceSegment] = []
    entities: List[EvidenceEntity] = []


class EvidenceProvenance(BaseModel):
    """Origin and freshness metadata for an evidence asset."""

    author_or_source: str
    publication_date: str
    freshness_horizon_days: int = 180
    extraction_method: str = "document_ai_parser"
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)


class EvidenceEnvelope(BaseModel):
    """Universal multimodal evidence container schema."""

    evidence_id: str
    tenant_id: str
    source_type: SourceType
    source_uri: str
    sha256_hash: str = Field(..., pattern=r"^[a-f0-9]{64}$")
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    content: EvidenceContent
    provenance: EvidenceProvenance
    acl: List[str] = ["role:analyst", "role:executive"]
    sensitivity: SensitivityTier = SensitivityTier.INTERNAL


class ClaimVerdict(str, Enum):
    """Claim verification outcome."""

    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class DlpRedactionResult(BaseModel):
    """Output of Sensitive Data Protection (DLP) redaction."""

    sanitized_text: str
    redacted_items_count: int
    detected_info_types: List[str]


class ClaimVerificationRequest(BaseModel):
    """Request payload to verify an AI-generated claim against evidence."""

    claim_text: str
    evidence_ids: List[str] = []


class ClaimVerificationResult(BaseModel):
    """Result of claim-to-source entailment audit."""

    claim_text: str
    verdict: ClaimVerdict
    confidence: float = Field(..., ge=0.0, le=1.0)
    cited_evidence_ids: List[str] = []
    cited_segments: List[EvidenceSegment] = []
    explanation: str


class IntegrityCheckResult(BaseModel):
    """Cryptographic tamper verification status."""

    evidence_id: str
    sha256_hash: str
    is_valid: bool
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
