"""Future Scenario Foundry API router."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.tenant import get_current_tenant_id
from app.models.scenario import (
    CompanyIntelligenceRequest,
    CompanyIntelligenceResponse,
    FutureScenario,
    ScenarioComparisonResponse,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
    TransformationRoadmapRequest,
    TransformationRoadmapResponse,
)
from app.services.scenario_service import (
    generate_transformation_roadmap,
    get_scenario_by_id,
    get_scenarios_for_tenant,
    simulate_counterfactual,
    synthesize_company_intelligence,
)

router = APIRouter(prefix="/api/v1/scenarios", tags=["Scenarios"])


@router.get("", response_model=ScenarioComparisonResponse)
def list_future_scenarios(
    sector: str = Query("food_manufacturing", description="Industry sector filter"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> ScenarioComparisonResponse:
    """Retrieve simulated future scenarios for the active tenant.

    Args:
        sector: Target sector capsule.
        tenant_id: Scoped tenant identifier.

    Returns:
        ScenarioComparisonResponse: 4 scenario models with financial and workforce metrics.
    """
    return get_scenarios_for_tenant(tenant_id, sector)


@router.get("/{scenario_id}", response_model=FutureScenario)
def get_scenario(
    scenario_id: str,
    sector: str = Query("food_manufacturing", description="Industry sector filter"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> FutureScenario:
    """Retrieve a single scenario simulation by identifier.

    Args:
        scenario_id: Target scenario identifier.
        sector: Industry sector filter.
        tenant_id: Scoped tenant identifier.

    Returns:
        FutureScenario: Resolved scenario details.
    """
    scenario = get_scenario_by_id(tenant_id, scenario_id, sector)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found for tenant {tenant_id}",
        )
    return scenario


@router.post("/simulate", response_model=ScenarioSimulationResponse)
def simulate_scenario_counterfactual(
    payload: ScenarioSimulationRequest,
    sector: str = Query("food_manufacturing", description="Industry sector filter"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> ScenarioSimulationResponse:
    """Execute What-If sensitivity and counterfactual simulation for a scenario.

    Args:
        payload: Custom parameters (adoption speed, wage growth, automation aggression).
        sector: Industry sector filter.
        tenant_id: Scoped tenant identifier.

    Returns:
        ScenarioSimulationResponse: Simulated outcome with variance metrics and risk review.
    """
    result = simulate_counterfactual(tenant_id, payload, sector)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target scenario {payload.scenario_id} not found for simulation.",
        )
    return result


@router.post("/transformation-roadmap", response_model=TransformationRoadmapResponse)
async def generate_future_transformation_roadmap(
    payload: TransformationRoadmapRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> TransformationRoadmapResponse:
    """Generate Vertex AI Gemini-grounded transformation roadmap with multimodal assets.

    Args:
        payload: Firm name, scenario context, sector, and horizon.
        tenant_id: Scoped tenant identifier.

    Returns:
        TransformationRoadmapResponse: Multi-horizon roadmap with Imagen 3, Lyria, and Veo 2 specs.
    """
    return await generate_transformation_roadmap(tenant_id=tenant_id, request=payload)


@router.post("/company-intelligence", response_model=CompanyIntelligenceResponse)
async def analyze_company_intelligence(
    payload: CompanyIntelligenceRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> CompanyIntelligenceResponse:
    """Execute Agentic RAG & MCP company intelligence synthesis and future work roadmap.

    Fetches genuine corporate metrics (headcount, revenue, profit, moat) from trusted
    filing sources, calculates a deterministic Futuristic Readiness Score (0-100),
    and synthesizes 1Y, 3Y, 5Y, and 10Y future work transformation horizons.

    Args:
        payload: Company name, sector, website URL, and optional context.
        tenant_id: Scoped tenant identifier.

    Returns:
        CompanyIntelligenceResponse: Corporate profile, futuristic score, and multimodal roadmap.
    """
    return await synthesize_company_intelligence(tenant_id=tenant_id, request=payload)


