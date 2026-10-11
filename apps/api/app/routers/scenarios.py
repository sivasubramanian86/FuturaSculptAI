"""Future Scenario Foundry API router."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.tenant import get_current_tenant_id
from app.models.scenario import (
    FutureScenario,
    ScenarioComparisonResponse,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
)
from app.services.scenario_service import (
    get_scenario_by_id,
    get_scenarios_for_tenant,
    simulate_counterfactual,
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
