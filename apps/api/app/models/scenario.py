"""Pydantic schemas for the Future Scenario Foundry."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


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


# -----------------------------------------------------------------------------
# Future Work Transformation Simulator & Multimodal Studio Schemas
# -----------------------------------------------------------------------------


class HorizonModel(BaseModel):
    """Temporal horizon milestone model (Baseline, 1Y, 2Y, 3Y, 5Y, 10Y)."""

    model_config = ConfigDict(populate_by_name=True)

    year: str
    badge: str
    headline: str
    work_style: str = Field(..., alias="workStyle")
    worker_experience: str = Field(..., alias="workerExperience")
    productivity_multiplier: str = Field(..., alias="productivityMultiplier")
    productivity_index: int = Field(..., alias="productivityIndex")
    firm_metrics: dict = Field(..., alias="firmMetrics")
    key_milestones: List[str] = Field(..., alias="keyMilestones")


class ImagenInfographic(BaseModel):
    """Imagen 3 architecture twin visual blueprint specification."""

    title: str
    prompt: str
    zones: List[dict]
    svg_blueprint: str


class LyriaPodcast(BaseModel):
    """Lyria audio podcast studio specification with script and theme."""

    title: str
    speakers: List[str]
    script: str
    audio_theme: str
    duration_seconds: int


class VeoVideo(BaseModel):
    """Veo 2 cinematic video simulation with camera HUD telemetry."""

    title: str
    camera_movement: str
    scene_prompt: str
    hud_telemetry: dict
    resolution: str
    fps: int


class TransformationRoadmapRequest(BaseModel):
    """Request payload for Future Transformation Simulator."""

    firm_name: str
    scenario_prompt: str
    sector: Optional[str] = "healthcare"
    target_horizon_years: Optional[int] = 10
    website_url: Optional[str] = None


class CompanyProfile(BaseModel):
    """Authoritative enterprise intelligence profile fetched via Agentic RAG & MCP grounding."""

    name: str
    ticker_or_symbol: Optional[str] = None
    employee_count: str
    annual_revenue: str
    net_profit_or_margin: str
    core_business: str
    competitive_moat: str
    automation_baseline: str
    primary_sources: List[str] = Field(default_factory=list)


class FuturisticReadinessBreakdown(BaseModel):
    """Deterministic score (0-100) evaluating how futuristic and agentic the enterprise currently is."""

    ai_agentic_maturity: float = Field(..., ge=0.0, le=20.0, description="AI agent orchestration and workflow immersion")
    digital_telemetry_iot: float = Field(..., ge=0.0, le=20.0, description="Sub-10ms telemetry, sensor data, and cloud infrastructure")
    workforce_adaptability: float = Field(..., ge=0.0, le=20.0, description="Upskilling culture, safety covenant, and wage mobility")
    process_orchestration: float = Field(..., ge=0.0, le=20.0, description="Autonomous DAG task allocation and dynamic exception handling")
    data_moat_governance: float = Field(..., ge=0.0, le=20.0, description="Proprietary data assets, cryptographic proof, and SAIF controls")
    total_score: float = Field(..., ge=0.0, le=100.0, description="Overall futuristic readiness score")
    grade: str = Field(..., description="Letter tier rating (e.g. A+ Frontier Pioneer, B+ Digital Modernizer)")
    key_strengths: List[str] = Field(default_factory=list)
    modernization_gaps: List[str] = Field(default_factory=list)


class TransformationRoadmapResponse(BaseModel):
    """Vertex AI Gemini synthesized multi-horizon roadmap with multimodal assets."""

    firm_title: str
    category: str
    executive_summary: str
    societal_impact_narrative: str
    productivity_verdict: dict
    horizons: dict
    evidence_citations: List[dict]
    imagen_infographic: ImagenInfographic
    lyria_podcast: LyriaPodcast
    veo_video: VeoVideo
    model_used: str
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    company_profile: Optional[CompanyProfile] = None
    futuristic_readiness: Optional[FuturisticReadinessBreakdown] = None


class CompanyIntelligenceRequest(BaseModel):
    """Request payload for Agentic RAG & MCP Company Intelligence synthesis."""

    company_name: str
    sector: Optional[str] = "it_technology"
    website_url: Optional[str] = None
    custom_context: Optional[str] = None


class CompanyIntelligenceResponse(BaseModel):
    """Full corporate intelligence, deterministic readiness score, and multi-horizon transformation."""

    company_profile: CompanyProfile
    futuristic_readiness: FuturisticReadinessBreakdown
    roadmap: TransformationRoadmapResponse



