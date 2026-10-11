"""Pydantic models for Governance TrustBoard, SAIF Matrix, and Investor Lens."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class SAIFDomain(str, Enum):
    """Google Secure AI Framework (SAIF) 6 Core Domains."""

    EXPAND_ECOSYSTEM = "EXPAND_ECOSYSTEM"  # 1. Expand the ecosystem securely
    SAFEGUARD_ARCH = "SAFEGUARD_ARCH"  # 2. Safeguard the technology architecture
    SECURE_AI_SYSTEMS = "SECURE_AI_SYSTEMS"  # 3. Secure AI systems and pipelines
    PROTECT_DATA = "PROTECT_DATA"  # 4. Context and input data protection
    CONTINUOUS_MONITOR = "CONTINUOUS_MONITOR"  # 5. Continuous monitoring & anomaly detection
    INCIDENT_RESPONSE = "INCIDENT_RESPONSE"  # 6. Incident response and human control


class ControlStatus(str, Enum):
    """Compliance verification status for security and governance controls."""

    VERIFIED = "VERIFIED"
    IN_PROGRESS = "IN_PROGRESS"
    ACTION_REQUIRED = "ACTION_REQUIRED"


class SAIFControlItem(BaseModel):
    """Individual SAIF compliance control item with evidence backing."""

    control_id: str
    domain: SAIFDomain
    title: str
    description: str
    status: ControlStatus
    evidence_ids: List[str] = Field(default_factory=list)
    verifier_component: str
    remediation_owner: Optional[str] = None
    notes: Optional[str] = None


class WellArchitectedPillarScore(BaseModel):
    """Evaluation score for a Well-Architected governance pillar."""

    pillar: str
    score: float = Field(..., ge=0.0, le=100.0)
    weight_pct: float = Field(..., ge=0.0, le=100.0)
    status: str  # "PASSED" | "FLAGGED" | "BLOCKED"
    failed_checks_count: int = Field(default=0, ge=0)
    remediation_owner: str
    evidence_ids: List[str] = Field(default_factory=list)


class GovernancePostureResponse(BaseModel):
    """Aggregated enterprise governance posture, SAIF controls, and pillar evaluations."""

    tenant_id: str = "tenant-food-mfg-01"
    overall_trust_score: float = Field(..., ge=0.0, le=100.0)
    gate_status: str  # "PASSED" | "FLAGGED" | "BLOCKED"
    red_lines_breached: int = Field(default=0, ge=0)
    policy_version: str = "2026.1-trustboard"
    pillars: List[WellArchitectedPillarScore]
    saif_controls: List[SAIFControlItem]
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvestorAssumptionPayload(BaseModel):
    """Dynamic assumption overrides for Investor Lens valuation simulations."""

    wage_uplift_multiplier: float = Field(default=1.0, ge=0.5, le=2.5)
    automation_yield_factor: float = Field(default=1.0, ge=0.5, le=2.0)
    transition_capex_usd: float = Field(default=200000.0, ge=10000.0, le=5000000.0)


class RoadmapMilestone(BaseModel):
    """Time-to-value roadmap milestone."""

    horizon: str  # "30_DAYS" | "90_DAYS" | "365_DAYS"
    title: str
    deliverables: List[str]
    target_roi_multiplier: float
    governance_checkpoint: str


class InvestorLensResponse(BaseModel):
    """Investor self-service transformation thesis and defensibility analysis."""

    tenant_id: str = "tenant-food-mfg-01"
    organization_name: str = "Apex Food Manufacturing"
    transformation_thesis: str
    projected_ebitda_impact_usd: float
    transition_cost_usd: float
    net_roi_multiple: float
    payback_period_months: float
    defensibility_moat_score: float = Field(..., ge=0.0, le=100.0)
    assumptions_applied: InvestorAssumptionPayload
    roadmaps: List[RoadmapMilestone]
    disclaimer: str = (
        "Simulated scenario projection. Not financial or investment advice. "
        "Grounded in cryptographic EvidenceEnvelopes and deterministic scoring engines."
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RemediationActionRequest(BaseModel):
    """Request payload to assign or update remediation on a governance control."""

    control_id: str
    remediation_owner: str = Field(..., min_length=2)
    action_notes: str = Field(..., min_length=5)
    resolved: bool = False


class RemediationActionResponse(BaseModel):
    """Confirmation receipt for governance remediation update."""

    control_id: str
    status: ControlStatus
    remediation_owner: str
    notes: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DiligencePackExport(BaseModel):
    """Cryptographically verifiable enterprise diligence pack for board/investor review."""

    pack_id: str
    tenant_id: str
    organization_name: str
    trust_score: float
    saif_compliance_pct: float
    red_lines_breached: int
    gate_status: str
    evidence_envelopes_count: int
    evidence_hashes: List[str]
    cryptographic_seal_hash: str
    exported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    disclaimer: str = (
        "Anti-Fabrication Notice: All diligence records mathematically derive from "
        "immutable SHA-256 Evidence Envelopes and deterministic governance algorithms."
    )
