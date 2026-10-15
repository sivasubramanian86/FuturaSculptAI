"""FastAPI router for Governance TrustBoard, SAIF Controls, Investor Lens, and Alerts."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

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
from app.services.alert_service import AlertNotification, AlertSeverity, alert_service
from app.services.governance_service import governance_service

router = APIRouter(tags=["governance"])


class CreateAlertPayload(BaseModel):
    """Payload to trigger a governance alert."""

    severity: AlertSeverity = Field(default=AlertSeverity.INFO)
    title: str = Field(..., min_length=3)
    message: str = Field(..., min_length=3)
    source: str = Field(default="MANUAL_GOVERNANCE")
    metadata: Optional[Dict[str, Any]] = None


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


@router.get(
    "/alerts",
    response_model=List[AlertNotification],
    summary="List governance and telemetry alerts",
)
def list_alerts(
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity level"),
    unacknowledged_only: bool = Query(False, description="Filter unacknowledged alerts only"),
    limit: int = Query(50, ge=1, le=500, description="Max alerts to retrieve"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> List[AlertNotification]:
    """Retrieve recent governance redlines, approval requests, and policy alerts."""
    return alert_service.list_alerts(
        tenant_id=tenant_id,
        severity=severity,
        unacknowledged_only=unacknowledged_only,
        limit=limit,
    )


@router.post(
    "/alerts",
    response_model=AlertNotification,
    status_code=status.HTTP_201_CREATED,
    summary="Emit new governance or policy alert",
)
def emit_alert(
    payload: CreateAlertPayload,
    tenant_id: str = Depends(get_current_tenant_id),
) -> AlertNotification:
    """Manually dispatch a governance alert or policy breach notification."""
    return alert_service.emit_alert(
        tenant_id=tenant_id,
        severity=payload.severity,
        title=payload.title,
        message=payload.message,
        source=payload.source,
        metadata=payload.metadata,
    )


@router.post(
    "/alerts/{alert_id}/acknowledge",
    response_model=AlertNotification,
    summary="Acknowledge pending governance alert",
)
def acknowledge_alert(
    alert_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
) -> AlertNotification:
    """Acknowledge a specific alert notification."""
    alert = alert_service.acknowledge_alert(tenant_id=tenant_id, alert_id=alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found for current tenant",
        )
    return alert


@router.get(
    "/alerts/stream",
    summary="Real-time Server-Sent Events (SSE) notification stream",
)
async def stream_alerts(
    tenant_id: str = Depends(get_current_tenant_id),
) -> EventSourceResponse:
    """Stream live governance redlines and approval triggers to cockpit UI."""
    return EventSourceResponse(alert_service.stream_alerts(tenant_id))
