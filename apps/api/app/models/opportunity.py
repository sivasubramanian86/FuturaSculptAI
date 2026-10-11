"""Pydantic schemas for Workforce Opportunity Engine & Pathways (Module 5)."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.scoring import RoleResilienceResult, ScoreComponent


class FeasibilityTier(str, Enum):
    """Transition feasibility categories."""

    HIGH_FEASIBILITY = "HIGH_FEASIBILITY"
    MODERATE_FEASIBILITY = "MODERATE_FEASIBILITY"
    HIGH_EFFORT = "HIGH_EFFORT"


class AdaptabilityTier(str, Enum):
    """Workforce adaptability readiness tiers."""

    ELITE_AGILITY = "ELITE_AGILITY"
    ADAPTIVE = "ADAPTIVE"
    TRANSITIONING = "TRANSITIONING"
    RESISTANT = "RESISTANT"


class OpportunitySentimentTier(str, Enum):
    """Human Opportunity Score classification."""

    HIGHLY_EMPOWERING = "HIGHLY_EMPOWERING"
    BALANCED = "BALANCED"
    DISPLACEMENT_RISK = "DISPLACEMENT_RISK"


class TransitionReadinessScore(BaseModel):
    """Deterministic Transition Readiness Score (TRS) for role-to-role adjacency."""

    source_role_id: str
    target_role_id: str
    score: float = Field(..., ge=0.0, le=100.0)
    shared_skills_pct: float = Field(..., ge=0.0, le=100.0)
    critical_gap_pct: float = Field(..., ge=0.0, le=100.0)
    learning_velocity_pct: float = Field(..., ge=0.0, le=100.0)
    feasibility_tier: FeasibilityTier
    formula_version: str = "2026.1-trs"
    components: List[ScoreComponent] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkforceAdaptabilityIndex(BaseModel):
    """Deterministic aggregate enterprise Workforce Adaptability Index (WAI)."""

    tenant_id: str
    score: float = Field(..., ge=0.0, le=100.0)
    learning_velocity_pct: float = Field(..., ge=0.0, le=100.0)
    tech_absorption_pct: float = Field(..., ge=0.0, le=100.0)
    skill_mobility_rate_pct: float = Field(..., ge=0.0, le=100.0)
    culture_readiness_pct: float = Field(..., ge=0.0, le=100.0)
    adaptability_tier: AdaptabilityTier
    cohort_size: int = Field(..., ge=0)
    k_anonymity_passed: bool
    privacy_notice: Optional[str] = None
    formula_version: str = "2026.1-wai"
    components: List[ScoreComponent] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HumanOpportunityScore(BaseModel):
    """Deterministic Human Opportunity Score (HOS) evaluating net human upside."""

    tenant_id: str
    score: float = Field(..., ge=0.0, le=100.0)
    new_roles_count: int = Field(..., ge=0)
    augmented_tasks_count: int = Field(..., ge=0)
    automated_tasks_count: int = Field(..., ge=0)
    sentiment_tier: OpportunitySentimentTier
    formula_version: str = "2026.1-hos"
    evidence_ids: List[str] = Field(default_factory=list)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReskillingModule(BaseModel):
    """Concrete micro-credential or targeted learning curriculum unit."""

    module_id: str
    title: str
    duration_weeks: int = Field(..., ge=1, le=52)
    skill_gaps_addressed: List[str]
    delivery_format: str = "Interactive Simulation & Hands-on Lab"
    certification: str


class RoleTransitionPathway(BaseModel):
    """Structured career mobility pathway connecting source role to emerging adjacent role."""

    pathway_id: str
    tenant_id: str = "tenant-food-mfg-01"
    source_role_id: str
    source_role_name: str
    target_role_id: str
    target_role_name: str
    transition_readiness: TransitionReadinessScore
    skill_overlap_pct: float = Field(..., ge=0.0, le=100.0)
    skill_gaps: List[str]
    curriculum: List[ReskillingModule]
    estimated_duration_weeks: int = Field(..., ge=1)
    wage_impact_pct: float = Field(..., ge=-50.0, le=100.0)
    status: str = "ACTIVE"  # "ACTIVE" | "INSUFFICIENT_EVIDENCE" | "CONTESTED"
    evidence_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PathwayAppealRequest(BaseModel):
    """Payload allowing employees/leads to appeal or contest a skill requirement or pathway."""

    pathway_id: str
    contested_skill: str = Field(..., min_length=2)
    rationale: str = Field(..., min_length=10)
    supporting_evidence_uri: Optional[str] = None
    appellant_id: str = Field(..., min_length=2)


class PathwayAppealResponse(BaseModel):
    """Receipt confirming registration of an appeal into the HITL audit queue."""

    appeal_id: str
    pathway_id: str
    appellant_id: str
    status: str = "PENDING_AUDIT_REVIEW"
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notice: str = "Appeal queued for Human-in-the-Loop review under Responsible Workforce governance protocol."


class OpportunityMetricsResponse(BaseModel):
    """Aggregated enterprise metrics and transition pathways response."""

    tenant_id: str
    role_resilience: RoleResilienceResult
    transition_readiness: List[TransitionReadinessScore]
    workforce_adaptability: WorkforceAdaptabilityIndex
    human_opportunity_score: HumanOpportunityScore
    cohort_size: int
    k_anonymity_passed: bool
    pathways: List[RoleTransitionPathway]
