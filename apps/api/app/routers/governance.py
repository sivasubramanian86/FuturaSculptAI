"""FastAPI router for Governance TrustBoard, SAIF Controls, and Investor Lens."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.tenant import get_current_tenant_id
from app.models.governance import (
    DiligencePackExport,
    GovernancePostureResponse,
    InvestorAssumptionPayload,
    InvestorLensResponse,
    RemediationActionRequest,
    RemediationActionResponse,
    SAIFControlItem,
    SAIFDomain,
)
from app.services.governance_service import governance_service

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get(
    "/trustboard",
    response_model=GovernancePostureResponse,
    summary="Get holistic 8-pillar Well-Architected and SAIF governance posture",
)
def get_governance_trustboard(
    tenant_id: str = Depends(get_current_tenant_id),
) -> GovernancePostureResponse:
    """Retrieve composite TrustBoard health, pillar breakdowns, and SAIF control status."""
    return governance_service.get_governance_posture(tenant_id)


@router.get(
    "/saif-controls",
    response_model=List[SAIFControlItem],
    summary="List granular SAIF controls with evidence lineage",
)
def get_saif_controls(
    domain: Optional[SAIFDomain] = Query(None, description="Optional SAIF domain filter"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> List[SAIFControlItem]:
    """Retrieve SAIF matrix controls, verification status, and verifier components."""
    return governance_service.get_saif_controls(tenant_id, domain)


@router.get(
    "/investor-lens",
    response_model=InvestorLensResponse,
    summary="Get baseline Investor Lens transformation thesis and metrics",
)
def get_investor_lens(
    tenant_id: str = Depends(get_current_tenant_id),
) -> InvestorLensResponse:
    """Generate dynamic investor thesis, payback period, and 30/90/365-day roadmaps."""
    return governance_service.simulate_investor_lens(tenant_id)


@router.post(
    "/investor-lens/simulate",
    response_model=InvestorLensResponse,
    summary="Simulate transformation ROI with custom investor assumptions",
)
def simulate_investor_lens(
    payload: InvestorAssumptionPayload,
    tenant_id: str = Depends(get_current_tenant_id),
) -> InvestorLensResponse:
    """Recalculate EBITDA uplift, transition costs, and payback period under custom parameters."""
    return governance_service.simulate_investor_lens(tenant_id, payload)


@router.post(
    "/remediate",
    response_model=RemediationActionResponse,
    summary="Assign or update governance remediation task",
)
def update_remediation(
    payload: RemediationActionRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> RemediationActionResponse:
    """Assign remediation owner, update notes, or resolve control check."""
    try:
        return governance_service.update_remediation(tenant_id, payload)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/diligence-pack",
    response_model=DiligencePackExport,
    summary="Export cryptographically verifiable enterprise diligence pack",
)
def export_diligence_pack(
    tenant_id: str = Depends(get_current_tenant_id),
) -> DiligencePackExport:
    """Export complete diligence summary sealed with deterministic SHA-256 hash."""
    return governance_service.generate_diligence_pack(tenant_id)
