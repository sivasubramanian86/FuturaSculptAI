"""Pydantic schemas for deterministic consequential scoring engines."""

from datetime import datetime, timezone
from typing import List

from pydantic import BaseModel, Field


class ScoreComponent(BaseModel):
    """Component factor inside a deterministic formula."""

    name: str
    weight: float
    raw_value: float = Field(..., ge=0.0, le=100.0)
    weighted_value: float
    rationale: str
    evidence_ids: List[str] = []


class RoleResilienceResult(BaseModel):
    """Deterministic Role Resilience Index (RRI) calculation."""

    role_id: str
    role_name: str
    score: float = Field(..., ge=0.0, le=100.0)
    tier: str  # "HIGH_RESILIENCE" | "MODERATE_RESILIENCE" | "TRANSITION_PRIORITY"
    formula_version: str = "2026.1-rri"
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    components: List[ScoreComponent]
    recommended_pathway: str
    evidence_ids: List[str] = []


class TrustScoreResult(BaseModel):
    """Google Well-Architected 6 Pillars + SAIF governance evaluation."""

    trust_score: float = Field(..., ge=0.0, le=100.0)
    saif_security_score: float = Field(..., ge=0.0, le=100.0)
    operational_excellence_score: float = Field(..., ge=0.0, le=100.0)
    reliability_score: float = Field(..., ge=0.0, le=100.0)
    performance_score: float = Field(..., ge=0.0, le=100.0)
    cost_optimization_score: float = Field(..., ge=0.0, le=100.0)
    sustainability_score: float = Field(..., ge=0.0, le=100.0)
    red_lines_breached: int = 0
    gate_status: str  # "PASSED" | "FLAGGED" | "BLOCKED"
    formula_version: str = "2026.1-trust"
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
