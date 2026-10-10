"""Pydantic schemas for the Future Scenario Foundry."""

from datetime import datetime, timezone
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class ScenarioClass(str, Enum):
    """The four canonical future scenario classes."""

    CONSERVATIVE = "conservative"
    ACCELERATED = "accelerated"
    DISRUPTIVE = "disruptive"
    HUMAN_FIRST = "human_first"


class FutureScenario(BaseModel):
    """A projected future operating model scenario."""

    scenario_id: str
    tenant_id: str
    scenario_class: ScenarioClass
    title: str
    horizon_years: int = 3
    narrative_summary: str
    ebitda_impact_usd: float
    transition_cost_usd: float
    net_new_roles: int
    augmented_roles: int
    displaced_tasks_pct: float = Field(..., ge=0.0, le=100.0)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    uncertainty_range_pct: float = Field(..., ge=0.0, le=100.0)
    assumptions: List[str]
    invalidation_triggers: List[str]
    counterfactuals: List[str]
    primary_technologies: List[str]
    evidence_ids: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScenarioComparisonResponse(BaseModel):
    """Side-by-side scenario comparison payload."""

    tenant_id: str
    sector: str
    baseline_year: int = 2026
    scenarios: List[FutureScenario]
