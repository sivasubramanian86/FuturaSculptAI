"""Task Sculptor Service providing 6-part task classification matrix and HITL governance."""

from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.models.agent_swarm import TaskClassificationType
from app.models.tasks import (
    TaskApprovalRequest,
    TaskApprovalResponse,
    TaskMatrixResponse,
    TaskRedesignItem,
    TaskRedesignStatus,
    TaskRedesignUpdateRequest,
)


class TaskSculptorService:
    """Manages workflow task transformation matrix, cycle time reductions, and approval gates."""

    def __init__(self):
        """Initialize in-memory tenant store with seed workloads."""
        self._tenant_store: Dict[str, Dict[str, TaskRedesignItem]] = {}

    def _get_seed_tasks(self, tenant_id: str) -> Dict[str, TaskRedesignItem]:
        """Generate canonical 6-part workload items for food manufacturing packaging line."""
        now = datetime.now(timezone.utc)
        items: List[TaskRedesignItem] = [
            TaskRedesignItem(
                task_id="TSK-001",
                tenant_id=tenant_id,
                workflow_id="WKF-001",
                task_name="Continuous Surface Defect Screening",
                role_id="ROL-001",
                role_name="Packaging Quality Inspector",
                classification=TaskClassificationType.AUTOMATE,
                rationale="Repetitive high-frequency visual inspection executed reliably via Edge-TPU vision inference.",
                target_agent_id="PackagingVisionAgent",
                target_system="Edge-TPU Vision Pipeline",
                baseline_cycle_time_seconds=45.0,
                target_cycle_time_seconds=3.0,
                cycle_time_reduction_pct=93.3,
                human_share_pct=0.0,
                agent_share_pct=100.0,
                status=TaskRedesignStatus.DRAFT,
                evidence_ids=["EVD-001", "EVD-004"],
                created_at=now,
                updated_at=now,
            ),
            TaskRedesignItem(
                task_id="TSK-002",
                tenant_id=tenant_id,
                workflow_id="WKF-001",
                task_name="Anomalous Seal Defect Adjudication",
                role_id="ROL-001",
                role_name="Packaging Quality Inspector",
                classification=TaskClassificationType.AUGMENT,
                rationale="Regulatory critical boundary requiring human operator final verdict with ADK Copilot confidence scoring.",
                target_agent_id="PackagingVisionAgent",
                target_system="Human-Agent Cockpit",
                baseline_cycle_time_seconds=120.0,
                target_cycle_time_seconds=30.0,
                cycle_time_reduction_pct=75.0,
                human_share_pct=60.0,
                agent_share_pct=40.0,
                status=TaskRedesignStatus.DRAFT,
                evidence_ids=["EVD-001"],
                created_at=now,
                updated_at=now,
            ),
            TaskRedesignItem(
                task_id="TSK-003",
                tenant_id=tenant_id,
                workflow_id="WKF-001",
                task_name="Sensor Calibration & Optical Alignment",
                role_id="ROL-001",
                role_name="Packaging Quality Inspector",
                classification=TaskClassificationType.RETAIN,
                rationale="Physical tactile alignment and optical precision intervention retained exclusively by certified technician.",
                target_agent_id=None,
                target_system="Physical Workstation & Tooling",
                baseline_cycle_time_seconds=300.0,
                target_cycle_time_seconds=300.0,
                cycle_time_reduction_pct=0.0,
                human_share_pct=100.0,
                agent_share_pct=0.0,
                status=TaskRedesignStatus.APPROVED,
                approved_by="Lead Production Engineer",
                approval_timestamp=now,
                approval_notes="Safety & physical compliance requires human intervention.",
                evidence_ids=["EVD-002"],
                created_at=now,
                updated_at=now,
            ),
            TaskRedesignItem(
                task_id="TSK-004",
                tenant_id=tenant_id,
                workflow_id="WKF-001",
                task_name="SOP & Compliance Lookups",
                role_id="ROL-001",
                role_name="Packaging Quality Inspector",
                classification=TaskClassificationType.ASSIST,
                rationale="Natural language contextual lookup for FDA 21 CFR Part 11 and ISO 22000 procedures via grounded RAG.",
                target_agent_id="Vertex AI Search Copilot",
                target_system="Vertex AI Search Engine",
                baseline_cycle_time_seconds=180.0,
                target_cycle_time_seconds=20.0,
                cycle_time_reduction_pct=88.9,
                human_share_pct=30.0,
                agent_share_pct=70.0,
                status=TaskRedesignStatus.DRAFT,
                evidence_ids=["EVD-003"],
                created_at=now,
                updated_at=now,
            ),
            TaskRedesignItem(
                task_id="TSK-005",
                tenant_id=tenant_id,
                workflow_id="WKF-001",
                task_name="End-of-Shift Paperwork & Manual Reporting",
                role_id="ROL-001",
                role_name="Packaging Quality Inspector",
                classification=TaskClassificationType.RETIRE,
                rationale="Manual paper binder logging retired and replaced by real-time BigQuery telemetry ledger.",
                target_agent_id="BigQuery Telemetry Pipeline",
                target_system="Google Cloud BigQuery",
                baseline_cycle_time_seconds=900.0,
                target_cycle_time_seconds=0.0,
                cycle_time_reduction_pct=100.0,
                human_share_pct=0.0,
                agent_share_pct=100.0,
                status=TaskRedesignStatus.DRAFT,
                evidence_ids=["EVD-004"],
                created_at=now,
                updated_at=now,
            ),
            TaskRedesignItem(
                task_id="TSK-006",
                tenant_id=tenant_id,
                workflow_id="WKF-001",
                task_name="Packaging Anomaly Root-Cause Review",
                role_id="ROL-001",
                role_name="Packaging Quality Inspector",
                classification=TaskClassificationType.REDESIGN,
                rationale="Reconfigured from retrospective monthly meetings into real-time collaborative swarm incident debrief.",
                target_agent_id="FuturaSculpt Swarm Coordinator",
                target_system="ADK Swarm Deliberation Engine",
                baseline_cycle_time_seconds=3600.0,
                target_cycle_time_seconds=600.0,
                cycle_time_reduction_pct=83.3,
                human_share_pct=50.0,
                agent_share_pct=50.0,
                status=TaskRedesignStatus.DRAFT,
                evidence_ids=["EVD-001", "EVD-002", "EVD-003"],
                created_at=now,
                updated_at=now,
            ),
        ]
        return {item.task_id: item for item in items}

    def _ensure_tenant(self, tenant_id: str) -> Dict[str, TaskRedesignItem]:
        """Ensure tenant store is populated."""
        if tenant_id not in self._tenant_store:
            self._tenant_store[tenant_id] = self._get_seed_tasks(tenant_id)
        return self._tenant_store[tenant_id]

    def reset_tenant(self, tenant_id: str) -> None:
        """Reset tenant tasks back to clean seed state."""
        self._tenant_store[tenant_id] = self._get_seed_tasks(tenant_id)

    def get_matrix(self, tenant_id: str, workflow_id: Optional[str] = None) -> TaskMatrixResponse:
        """Retrieve aggregated 6-category workload matrix."""
        store = self._ensure_tenant(tenant_id)
        tasks = list(store.values())
        if workflow_id:
            tasks = [t for t in tasks if t.workflow_id == workflow_id]

        total = len(tasks)
        summary: Dict[str, int] = {cat.value: 0 for cat in TaskClassificationType}
        total_human_share = 0.0
        total_agent_share = 0.0
        total_reduction = 0.0

        for t in tasks:
            summary[t.classification.value] = summary.get(t.classification.value, 0) + 1
            total_human_share += t.human_share_pct
            total_agent_share += t.agent_share_pct
            total_reduction += t.cycle_time_reduction_pct

        avg_human = round(total_human_share / total, 1) if total > 0 else 0.0
        avg_agent = round(total_agent_share / total, 1) if total > 0 else 0.0
        avg_reduction = round(total_reduction / total, 1) if total > 0 else 0.0

        return TaskMatrixResponse(
            tenant_id=tenant_id,
            workflow_id=workflow_id or "WKF-001",
            workflow_name="High-Speed Packaging Line Quality Inspection",
            total_tasks=total,
            classification_summary=summary,
            overall_human_share_pct=avg_human,
            overall_agent_share_pct=avg_agent,
            overall_cycle_time_reduction_pct=avg_reduction,
            tasks=tasks,
        )

    def get_task_by_id(self, tenant_id: str, task_id: str) -> Optional[TaskRedesignItem]:
        """Retrieve single task redesign item by ID."""
        store = self._ensure_tenant(tenant_id)
        return store.get(task_id)

    def update_task(
        self, tenant_id: str, task_id: str, update: TaskRedesignUpdateRequest
    ) -> Optional[TaskRedesignItem]:
        """Update task properties; automatically reverts approved tasks to draft for governance re-check."""
        store = self._ensure_tenant(tenant_id)
        task = store.get(task_id)
        if not task:
            return None

        # Governance rule: modification of approved task invalidates prior human sign-off
        now = datetime.now(timezone.utc)
        new_status = task.status
        approved_by = task.approved_by
        approval_ts = task.approval_timestamp
        approval_notes = task.approval_notes

        if task.status == TaskRedesignStatus.APPROVED:
            new_status = TaskRedesignStatus.DRAFT
            approved_by = None
            approval_ts = None
            approval_notes = None

        new_classification = update.classification if update.classification is not None else task.classification
        new_rationale = update.rationale if update.rationale is not None else task.rationale
        new_target_agent = update.target_agent_id if update.target_agent_id is not None else task.target_agent_id
        new_target_system = update.target_system if update.target_system is not None else task.target_system
        new_target_time = (
            update.target_cycle_time_seconds
            if update.target_cycle_time_seconds is not None
            else task.target_cycle_time_seconds
        )
        new_human_share = update.human_share_pct if update.human_share_pct is not None else task.human_share_pct
        new_agent_share = update.agent_share_pct if update.agent_share_pct is not None else task.agent_share_pct

        # Recalculate cycle time reduction pct
        if task.baseline_cycle_time_seconds > 0.0:
            new_reduction = round(
                ((task.baseline_cycle_time_seconds - new_target_time) / task.baseline_cycle_time_seconds) * 100.0, 1
            )
        else:
            new_reduction = 0.0

        updated_task = task.model_copy(
            update={
                "classification": new_classification,
                "rationale": new_rationale,
                "target_agent_id": new_target_agent,
                "target_system": new_target_system,
                "target_cycle_time_seconds": new_target_time,
                "cycle_time_reduction_pct": new_reduction,
                "human_share_pct": new_human_share,
                "agent_share_pct": new_agent_share,
                "status": new_status,
                "approved_by": approved_by,
                "approval_timestamp": approval_ts,
                "approval_notes": approval_notes,
                "updated_at": now,
            }
        )
        store[task_id] = updated_task
        return updated_task

    def approve_task(
        self, tenant_id: str, task_id: str, req: TaskApprovalRequest
    ) -> Optional[TaskApprovalResponse]:
        """Apply human-in-the-loop governance sign-off or rejection."""
        store = self._ensure_tenant(tenant_id)
        task = store.get(task_id)
        if not task:
            return None

        now = datetime.now(timezone.utc)
        updated_task = task.model_copy(
            update={
                "status": req.decision,
                "approved_by": req.approver_id,
                "approval_timestamp": now,
                "approval_notes": req.notes,
                "updated_at": now,
            }
        )
        store[task_id] = updated_task

        return TaskApprovalResponse(
            task_id=task_id,
            status=req.decision,
            approved_by=req.approver_id,
            approval_timestamp=now,
            approval_notes=req.notes,
            task=updated_task,
        )


task_sculptor_service = TaskSculptorService()
