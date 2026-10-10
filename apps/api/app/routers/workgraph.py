"""Temporal Work Transformation Graph API router."""

from fastapi import APIRouter, Depends

from app.core.tenant import get_current_tenant_id
from app.models.workgraph import WorkGraphResponse
from app.services.workgraph_service import get_food_manufacturing_seed_graph

router = APIRouter(prefix="/api/v1/workgraph", tags=["WorkGraph"])


@router.get("", response_model=WorkGraphResponse)
def get_work_transformation_graph(
    tenant_id: str = Depends(get_current_tenant_id),
) -> WorkGraphResponse:
    """Retrieve the temporal Work Transformation Graph for the current tenant.

    Args:
        tenant_id: Scoped tenant identifier.

    Returns:
        WorkGraphResponse: Nodes, edges, and temporal metadata.
    """
    return get_food_manufacturing_seed_graph(tenant_id)
