"""Workforce Opportunity Engine & Pathways API router (Module 5)."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.tenant import get_current_tenant_id
from app.models.opportunity import (
    OpportunityMetricsResponse,
    PathwayAppealRequest,
    PathwayAppealResponse,
    RoleTransitionPathway,
)
from app.services.opportunity_service import opportunity_service

router = APIRouter(prefix="/api/v1/opportunity", tags=["Workforce Opportunity"])


@router.get("/metrics", response_model=OpportunityMetricsResponse)
def get_opportunity_metrics(
    cohort_size: int = Query(25, ge=0, description="Workforce cohort size for k-anonymity check"),
    role_id: str = Query("ROL-001", description="Source role identifier"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> OpportunityMetricsResponse:
    """Retrieve complete deterministic opportunity index suite (RRI, TRS, WAI, HOS) and pathways.

    Args:
        cohort_size: Number of workers evaluated in cohort.
        role_id: Source role evaluated.
        tenant_id: Active tenant identifier.

    Returns:
        OpportunityMetricsResponse: Full consequential scores and transition pathways.
    """
    return opportunity_service.get_opportunity_metrics(
        tenant_id=tenant_id, cohort_size=cohort_size, role_id=role_id
    )


@router.get("/pathways", response_model=List[RoleTransitionPathway])
def list_role_transition_pathways(
    role_id: str = Query("ROL-001", description="Source role identifier"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> List[RoleTransitionPathway]:
    """Retrieve all active transition pathways from source role to emerging adjacent roles.

    Args:
        role_id: Originating role identifier.
        tenant_id: Active tenant identifier.

    Returns:
        List[RoleTransitionPathway]: Transition pathways with curriculum and readiness scores.
    """
    return opportunity_service.get_pathways(tenant_id=tenant_id, role_id=role_id)


@router.get("/pathways/{pathway_id}", response_model=RoleTransitionPathway)
def get_transition_pathway_detail(
    pathway_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
) -> RoleTransitionPathway:
    """Retrieve specific transition pathway detail by ID.

    Args:
        pathway_id: Unique pathway identifier (e.g. PATH-001).
        tenant_id: Active tenant identifier.

    Returns:
        RoleTransitionPathway: Detailed pathway specification.
    """
    pathway = opportunity_service.get_pathway_by_id(tenant_id=tenant_id, pathway_id=pathway_id)
    if not pathway:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pathway {pathway_id} not found for tenant {tenant_id}",
        )
    return pathway


@router.post("/appeal", response_model=PathwayAppealResponse)
def submit_pathway_appeal(
    request: PathwayAppealRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> PathwayAppealResponse:
    """Submit an employee or department appeal against a pathway skill requirement.

    Args:
        request: Appeal payload including contested skill and supporting rationale.
        tenant_id: Active tenant identifier.

    Returns:
        PathwayAppealResponse: Confirmation receipt in HITL governance audit queue.
    """
    return opportunity_service.submit_appeal(tenant_id=tenant_id, request=request)


@router.post("/evaluate", response_model=OpportunityMetricsResponse)
def evaluate_workforce_transformation_query(
    payload: Dict[str, Any],
    tenant_id: str = Depends(get_current_tenant_id),
) -> OpportunityMetricsResponse:
    """Evaluate workforce transformation query under strict Responsible Workforce red lines.

    Rejects adverse actions (layoffs, downsizing) and protected demographic attributes.

    Args:
        payload: Input dictionary containing 'prompt' and optional 'cohort_size'.
        tenant_id: Active tenant identifier.

    Returns:
        OpportunityMetricsResponse: Evaluated opportunity scores.
    """
    prompt = str(payload.get("prompt", ""))
    cohort_size = int(payload.get("cohort_size", 25))

    # Enforce non-negotiable responsible workforce red line interceptor
    opportunity_service.validate_ethical_workforce_rules(prompt)

    return opportunity_service.get_opportunity_metrics(
        tenant_id=tenant_id, cohort_size=cohort_size, role_id="ROL-001"
    )
