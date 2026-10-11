"""Pydantic models for Task Redesign Matrix & Sculptor (Module 4)."""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.agent_swarm import TaskClassificationType


class TaskRedesignStatus(str, Enum):
    """Human-in-the-loop governance status for task redesign proposals."""

    DRAFT = "DRAFT"
    SUBMITTED_FOR_REVIEW = "SUBMITTED_FOR_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TaskRedesignItem(BaseModel):
    """Fine-grained task redesign specification within the 6-part transformation matrix."""

    task_id: str
    tenant_id: str
    workflow_id: str = "WKF-001"
    task_name: str
    role_id: str
    role_name: str
    classification: TaskClassificationType
    rationale: str
    target_agent_id: Optional[str] = None
    target_system: Optional[str] = None
    baseline_cycle_time_seconds: float = Field(..., ge=0.0)
    target_cycle_time_seconds: float = Field(..., ge=0.0)
    cycle_time_reduction_pct: float = Field(..., ge=-100.0, le=100.0)
    human_share_pct: float = Field(..., ge=0.0, le=100.0)
    agent_share_pct: float = Field(..., ge=0.0, le=100.0)
    status: TaskRedesignStatus = TaskRedesignStatus.DRAFT
    approved_by: Optional[str] = None
    approval_timestamp: Optional[datetime] = None
    approval_notes: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TaskMatrixResponse(BaseModel):
    """Workload matrix response aggregating 6-part task classification distribution."""

    tenant_id: str
    workflow_id: str
    workflow_name: str
    total_tasks: int
    classification_summary: Dict[str, int]
    overall_human_share_pct: float
    overall_agent_share_pct: float
    overall_cycle_time_reduction_pct: float
    tasks: List[TaskRedesignItem]


class TaskRedesignUpdateRequest(BaseModel):
    """Payload for updating an existing task redesign item."""

    classification: Optional[TaskClassificationType] = None
    rationale: Optional[str] = None
    target_agent_id: Optional[str] = None
    target_system: Optional[str] = None
    target_cycle_time_seconds: Optional[float] = Field(None, ge=0.0)
    human_share_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    agent_share_pct: Optional[float] = Field(None, ge=0.0, le=100.0)


class TaskApprovalRequest(BaseModel):
    """Payload for human-in-the-loop approval or rejection of task redesign."""

    approver_id: str = Field(..., min_length=2, max_length=100)
    decision: TaskRedesignStatus = Field(...)
    notes: Optional[str] = None


class TaskApprovalResponse(BaseModel):
    """Outcome confirmation of a human approval gate action."""

    task_id: str
    status: TaskRedesignStatus
    approved_by: str
    approval_timestamp: datetime
    approval_notes: Optional[str] = None
    task: TaskRedesignItem
