"""Deterministic scoring API router."""

from fastapi import APIRouter, Depends, Query

from app.core.tenant import get_current_tenant_id
from app.models.scoring import RoleResilienceResult, TrustScoreResult
from app.services.scoring_engine import (
    calculate_role_resilience_index,
    calculate_trustboard_score,
)

router = APIRouter(prefix="/api/v1/scoring", tags=["Scoring"])


@router.get("/rri", response_model=RoleResilienceResult)
def evaluate_role_resilience(
    role_id: str = Query("ROL-001", description="Target role identifier"),
    role_name: str = Query("Packaging QA Inspector", description="Target role title"),
    non_routine: float = Query(65.0, ge=0.0, le=100.0),
    transferability: float = Query(70.0, ge=0.0, le=100.0),
    augmentation: float = Query(75.0, ge=0.0, le=100.0),
    strategic_criticality: float = Query(80.0, ge=0.0, le=100.0),
    tenant_id: str = Depends(get_current_tenant_id),
) -> RoleResilienceResult:
    """Compute deterministic Role Resilience Index (RRI).

    Args:
        role_id: Role identifier.
        role_name: Role name.
        non_routine: Non-routine judgment percentage.
        transferability: Skill transferability percentage.
        augmentation: Augmentation potential percentage.
        strategic_criticality: Strategic criticality percentage.
        tenant_id: Scoped tenant identifier.

    Returns:
        RoleResilienceResult: Mathematical index, tier, and breakdown.
    """
    return calculate_role_resilience_index(
        role_id=role_id,
        role_name=role_name,
        non_routine_judgment_pct=non_routine,
        skill_transferability_pct=transferability,
        augmentation_potential_pct=augmentation,
        strategic_criticality_pct=strategic_criticality,
        evidence_ids=["EVD-ROLE-01"],
    )


@router.get("/trustboard", response_model=TrustScoreResult)
def evaluate_trustboard_posture(
    saif_security: float = Query(92.0, ge=0.0, le=100.0),
    operational_excellence: float = Query(88.0, ge=0.0, le=100.0),
    reliability: float = Query(94.0, ge=0.0, le=100.0),
    performance: float = Query(90.0, ge=0.0, le=100.0),
    cost_optimization: float = Query(86.0, ge=0.0, le=100.0),
    sustainability: float = Query(85.0, ge=0.0, le=100.0),
    red_lines_breached: int = Query(0, ge=0),
    tenant_id: str = Depends(get_current_tenant_id),
) -> TrustScoreResult:
    """Compute Google Well-Architected 6 Pillars + SAIF TrustScore.

    Args:
        saif_security: SAIF security score.
        operational_excellence: Ops excellence score.
        reliability: Reliability score.
        performance: Performance efficiency score.
        cost_optimization: FinOps score.
        sustainability: Sustainability score.
        red_lines_breached: Count of red-line violations.
        tenant_id: Scoped tenant identifier.

    Returns:
        TrustScoreResult: Evaluated TrustScore and gate status.
    """
    return calculate_trustboard_score(
        saif_security=saif_security,
        operational_excellence=operational_excellence,
        reliability=reliability,
        performance=performance,
        cost_optimization=cost_optimization,
        sustainability=sustainability,
        red_lines_breached=red_lines_breached,
    )
