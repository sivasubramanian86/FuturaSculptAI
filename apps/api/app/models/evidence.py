"""Pydantic schemas for Evidence Ledger and EvidenceEnvelope."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Field, model_validator


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


class MultimodalAnalysisRequest(BaseModel):
    """Invocation payload for live multimodal media intelligence."""

    asset_id: Optional[str] = None
    media_title: str = ""
    title: Optional[str] = None
    media_category: str = "image"
    category: Optional[str] = None
    source_context: str = ""
    source: Optional[str] = None
    content_snippet: str = ""
    snippet: Optional[str] = None
    target_sector: Optional[str] = "food_manufacturing"
    company_name: Optional[str] = None
    company_context: Optional[str] = None
    prompt_directive: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_request_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            t = data.get("title") or data.get("media_title") or "Workplace Evidence Asset"
            data["title"] = t
            data["media_title"] = t

            c = data.get("category") or data.get("media_category") or "image"
            data["category"] = c
            data["media_category"] = c

            s = data.get("source") or data.get("source_context") or "Sensor Telemetry"
            data["source"] = s
            data["source_context"] = s

            sn = data.get("snippet") or data.get("content_snippet") or "Telemetry excerpt"
            data["snippet"] = sn
            data["content_snippet"] = sn

            comp = data.get("company_context") or data.get("company_name") or "Enterprise Workplace"
            data["company_context"] = comp
            data["company_name"] = comp
        return data


class MultimodalAnalysisResult(BaseModel):
    """Structured operational intelligence extracted from multimodal media."""

    sample_id: Optional[str] = None
    asset_id: Optional[str] = None
    category: str = "image"
    title: str = ""
    source: str = ""
    snippet: str = ""
    detected_tasks: List[str] = Field(default_factory=list)
    ergonomic_risk: str = "LOW (15/100)"
    automation_potential: int = 70
    recommended_pathway: str = "Frontline Operator -> AI Automation Specialist"
    model_used: str = "Vertex AI Gemini 2.5 Flash (Multimodal)"
    model_attributed: str = "Google Vertex AI Gemini 2.5 Flash Multimodal"
    ai_reasoning_trace: str = ""
    reasoning_trace: str = ""
    sha256: str = ""
    sha256_seal: str = ""
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="before")
    @classmethod
    def sync_result_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            sid = data.get("sample_id") or data.get("asset_id") or "SMP-ASSET-01"
            data["sample_id"] = sid
            data["asset_id"] = sid

            m = data.get("model_used") or data.get("model_attributed") or "Google Vertex AI Gemini 2.5 Flash Multimodal"
            data["model_used"] = m
            data["model_attributed"] = m

            r = data.get("ai_reasoning_trace") or data.get("reasoning_trace") or "Extracted via Gemini Multimodal perception."
            data["ai_reasoning_trace"] = r
            data["reasoning_trace"] = r

            h = data.get("sha256") or data.get("sha256_seal") or ""
            data["sha256"] = h
            data["sha256_seal"] = h
        return data

