"""Future Scenario Foundry API router."""

from fastapi import APIRouter, Depends, Query

from app.core.tenant import get_current_tenant_id
from app.models.scenario import ScenarioComparisonResponse
from app.services.scenario_service import get_scenarios_for_tenant

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
