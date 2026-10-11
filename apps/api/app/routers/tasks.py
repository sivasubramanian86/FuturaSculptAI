"""API router for Task Redesign Matrix & Sculptor (Module 4)."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.tenant import get_current_tenant_id
from app.models.tasks import (
    TaskApprovalRequest,
    TaskApprovalResponse,
    TaskMatrixResponse,
    TaskRedesignItem,
    TaskRedesignStatus,
    TaskRedesignUpdateRequest,
)
from app.services.task_sculptor_service import task_sculptor_service

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


@router.get("/matrix", response_model=TaskMatrixResponse)
def get_task_redesign_matrix(
    workflow_id: Optional[str] = Query(None, description="Optional workflow filter"),
    tenant_id: str = Depends(get_current_tenant_id),
) -> TaskMatrixResponse:
    """Retrieve 6-part task classification matrix and work allocation breakdown.

    Args:
        workflow_id: Optional workflow identifier.
        tenant_id: Active tenant identifier from headers.

    Returns:
        TaskMatrixResponse: Aggregated matrix with task items and percentage summaries.
    """
    return task_sculptor_service.get_matrix(tenant_id=tenant_id, workflow_id=workflow_id)


@router.get("/{task_id}", response_model=TaskRedesignItem)
def get_task_redesign_item(
    task_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
) -> TaskRedesignItem:
    """Retrieve individual task redesign specification by identifier.

    Args:
        task_id: Unique task identifier (e.g. TSK-001).
        tenant_id: Active tenant identifier from headers.

    Returns:
        TaskRedesignItem: Full task redesign details.
    """
    task = task_sculptor_service.get_task_by_id(tenant_id=tenant_id, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found for tenant {tenant_id}",
        )
    return task


@router.patch("/{task_id}", response_model=TaskRedesignItem)
def update_task_redesign_item(
    task_id: str,
    update: TaskRedesignUpdateRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> TaskRedesignItem:
    """Update task transformation classification, targets, or allocations.

    Note: Modifying an approved task automatically reverts its status to DRAFT
    requiring fresh human sign-off per A2 Governance controls.

    Args:
        task_id: Unique task identifier.
        update: Modification payload.
        tenant_id: Active tenant identifier from headers.

    Returns:
        TaskRedesignItem: Updated task redesign record.
    """
    updated = task_sculptor_service.update_task(tenant_id=tenant_id, task_id=task_id, update=update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found for tenant {tenant_id}",
        )
    return updated


@router.post("/{task_id}/approval", response_model=TaskApprovalResponse)
def submit_task_approval_decision(
    task_id: str,
    req: TaskApprovalRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> TaskApprovalResponse:
    """Submit human approval or rejection decision for task redesign specification.

    Args:
        task_id: Unique task identifier.
        req: Approval decision payload (APPROVED or REJECTED with approver ID and notes).
        tenant_id: Active tenant identifier from headers.

    Returns:
        TaskApprovalResponse: Signed governance approval record.
    """
    if req.decision not in (TaskRedesignStatus.APPROVED, TaskRedesignStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval decision must be either APPROVED or REJECTED.",
        )

    result = task_sculptor_service.approve_task(tenant_id=tenant_id, task_id=task_id, req=req)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found for tenant {tenant_id}",
        )
    return result
