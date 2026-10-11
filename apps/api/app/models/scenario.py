"""Pydantic schemas for the Future Scenario Foundry."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

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


class ScenarioSimulationRequest(BaseModel):
    """Payload for What-If parameter sensitivity and counterfactual simulation."""

    scenario_id: str
    adoption_speed_multiplier: float = Field(default=1.0, ge=0.2, le=3.0)
    wage_inflation_pct: float = Field(default=3.0, ge=-5.0, le=20.0)
    automation_aggression: float = Field(default=1.0, ge=0.5, le=2.5)
    capital_cost_delta_pct: float = Field(default=0.0, ge=-50.0, le=100.0)
    custom_counterfactual_query: Optional[str] = None


class CounterfactualImpact(BaseModel):
    """Estimated variance and risk assessment under counterfactual parameters."""

    base_ebitda_usd: float
    simulated_ebitda_usd: float
    delta_ebitda_usd: float
    base_transition_cost_usd: float
    simulated_transition_cost_usd: float
    net_roles_created_delta: int
    displaced_tasks_pct_simulated: float
    risk_assessment: str  # LOW_VOLATILITY | HIGH_RETURN | ELEVATED_FRICTION | HIGH_CAPITAL_EXPOSURE
    tripped_triggers: List[str] = Field(default_factory=list)
    counterfactual_narrative: str


class ScenarioSimulationResponse(BaseModel):
    """Simulated scenario outcome under custom operating conditions."""

    tenant_id: str
    scenario: FutureScenario
    simulation_parameters: dict
    impact: CounterfactualImpact
    simulated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

