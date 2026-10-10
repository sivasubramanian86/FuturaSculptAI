"""Organization onboarding API router."""

from fastapi import APIRouter, Depends, status

from app.core.security import assert_responsible_workforce_compliance, sanitize_input_text
from app.core.tenant import get_current_tenant_id
from app.models.onboarding import OnboardingRequest, OnboardingResponse
from app.services.scenario_service import get_scenarios_for_tenant
from app.services.workgraph_service import get_food_manufacturing_seed_graph

router = APIRouter(prefix="/api/v1/onboard", tags=["Onboarding"])


@router.post("", response_model=OnboardingResponse, status_code=status.HTTP_201_CREATED)
def onboard_organization(
    payload: OnboardingRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> OnboardingResponse:
    """Register and bootstrap a tenant's Work Transformation digital twin.

    Args:
        payload: Intake configuration including strategic goals and consent.
        tenant_id: Scoped tenant identifier.

    Returns:
        OnboardingResponse: Provisioned workspace confirmation.
    """
    assert_responsible_workforce_compliance(payload.primary_strategic_goal)
    _ = sanitize_input_text(payload.primary_strategic_goal)

    # Initialize seed graph and baseline scenarios for tenant
    graph = get_food_manufacturing_seed_graph(tenant_id)
    scenarios = get_scenarios_for_tenant(tenant_id, payload.sector)

    return OnboardingResponse(
        tenant_id=tenant_id,
        organization_name=payload.organization_name,
        sector=payload.sector,
        status="ACTIVE_PROVISIONED",
        workspace_initialized=True,
        seed_nodes_count=graph.total_nodes,
        seed_scenarios_count=len(scenarios.scenarios),
    )
