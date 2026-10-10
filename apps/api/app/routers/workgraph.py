"""Temporal Work Transformation Graph API router."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.tenant import get_current_tenant_id
from app.models.temporal_workgraph import BlastRadiusResponse
from app.models.workgraph import WorkGraphResponse
from app.services.temporal_graph_engine import temporal_graph_engine
from app.services.workgraph_service import get_food_manufacturing_seed_graph

router = APIRouter(prefix="/api/v1/workgraph", tags=["WorkGraph"])


@router.get("", response_model=WorkGraphResponse)
def get_work_transformation_graph(
    tenant_id: str = Depends(get_current_tenant_id),
) -> WorkGraphResponse:
    """Retrieve the baseline Work Transformation Graph for the current tenant.

    Args:
        tenant_id: Scoped tenant identifier.

    Returns:
        WorkGraphResponse: Nodes, edges, and metadata.
    """
    return get_food_manufacturing_seed_graph(tenant_id)


@router.get("/temporal")
def get_temporal_work_graph(
    horizon_year: int = Query(default=0, ge=0, le=5),
    tenant_id: str = Depends(get_current_tenant_id),
) -> Dict[str, Any]:
    """Retrieve projected Work Transformation Graph snapshot at specified horizon.

    Args:
        horizon_year: 0 (Baseline), 1 (Augmented Hybrid), 3 (Autonomous Transformation).
        tenant_id: Scoped tenant identifier.

    Returns:
        Dict[str, Any]: Graph snapshot and simulation summary metrics.
    """
    graph, summary = temporal_graph_engine.get_temporal_projection(tenant_id=tenant_id, horizon_year=horizon_year)
    return {
        "graph": graph,
        "summary": summary,
    }


@router.get("/blast-radius", response_model=BlastRadiusResponse)
def get_blast_radius(
    node_id: str = Query(..., description="Target node to analyze"),
    max_depth: int = Query(default=3, ge=1, le=5),
    tenant_id: str = Depends(get_current_tenant_id),
) -> BlastRadiusResponse:
    """Analyze downstream reachability and organizational impact cascade for a node.

    Args:
        node_id: Target root node.
        max_depth: Maximum exploration depth.
        tenant_id: Scoped tenant identifier.

    Returns:
        BlastRadiusResponse: Cascade of affected nodes, roles, and risk assessment.
    """
    result = temporal_graph_engine.compute_blast_radius(tenant_id=tenant_id, node_id=node_id, max_depth=max_depth)
    if not result:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found in WorkGraph.")
    return result
