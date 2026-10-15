"""Alert and Notification Service for governance redlines, approval requests, and telemetry.

Integrates directly with Google Cloud Pub/Sub (`futurasculpt-governance-alerts`),
in-memory ring buffer for low-latency queries, and Server-Sent Events (SSE) streaming.
"""

import asyncio
from collections import defaultdict
from datetime import datetime, timezone
from enum import Enum
import threading
from typing import Any, AsyncGenerator, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field

from app.adapters.pubsub_adapter import pubsub_adapter
from app.core.logging import get_logger
from app.core.monitoring import telemetry_registry

logger = get_logger("futurasculpt.alerts")


class AlertSeverity(str, Enum):
    """Severity tier classification for governance and operations."""

    INFO = "INFO"
    WARNING = "WARNING"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    CRITICAL_REDLINE = "CRITICAL_REDLINE"


class AlertNotification(BaseModel):
    """Immutable governance alert notification envelope."""

    alert_id: str = Field(default_factory=lambda: f"alert-{uuid.uuid4().hex[:10]}")
    tenant_id: str = Field(..., description="Multi-tenant context identifier")
    severity: AlertSeverity = Field(..., description="Alert severity classification")
    title: str = Field(..., description="Concise human-readable alert title")
    message: str = Field(..., description="Detailed description and actionable remediation guidance")
    source: str = Field(..., description="Subsystem or agent origin (e.g., Gatekeeper, FinOps, TrustGovernance)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Structured diagnostics and lineage context")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    acknowledged: bool = Field(default=False, description="Whether human governance officer acknowledged the alert")


class AlertService:
    """Thread-safe alert dispatch, Pub/Sub emission, and notification manager."""

    def __init__(self, max_buffer_per_tenant: int = 500):
        """Initialize AlertService with in-memory ring buffer and SSE event queues.

        Args:
            max_buffer_per_tenant: Maximum retained alerts per tenant.
        """
        self._max_buffer = max_buffer_per_tenant
        self._lock = threading.Lock()
        self._tenant_alerts: Dict[str, List[AlertNotification]] = defaultdict(list)
        self._subscribers: Dict[str, List[asyncio.Queue]] = defaultdict(list)

    def emit_alert(
        self,
        tenant_id: str,
        severity: AlertSeverity | str,
        title: str,
        message: str,
        source: str = "SYSTEM",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AlertNotification:
        """Create, record, and dispatch a new governance or operational alert.

        Args:
            tenant_id: Target tenant ID.
            severity: Severity tier.
            title: Headline summary.
            message: Actionable details.
            source: Emitting component.
            metadata: Additional structured payload.

        Returns:
            AlertNotification: Created alert record.
        """
        if isinstance(severity, str):
            severity = AlertSeverity(severity)

        alert = AlertNotification(
            tenant_id=tenant_id,
            severity=severity,
            title=title,
            message=message,
            source=source,
            metadata=metadata or {},
        )

        with self._lock:
            buffer = self._tenant_alerts[tenant_id]
            buffer.insert(0, alert)
            if len(buffer) > self._max_buffer:
                buffer.pop()

            queues = list(self._subscribers.get(tenant_id, []))

        # Push to asynchronous SSE subscriber queues
        for q in queues:
            try:
                q.put_nowait(alert)
            except Exception as exc:  # pragma: no cover
                logger.debug("Subscriber queue put failed: %s", exc)

        # Record metrics telemetry
        if severity == AlertSeverity.CRITICAL_REDLINE:
            telemetry_registry.record_governance_redline(source, "CRITICAL")
        elif severity == AlertSeverity.WARNING:
            telemetry_registry.record_governance_redline(source, "WARNING")

        # Publish to Google Cloud Pub/Sub
        try:
            pubsub_adapter.publish_governance_alert(
                alert_title=title,
                severity=severity.value,
                details=alert.model_dump(),
                tenant_id=tenant_id,
            )
        except Exception as exc:  # pragma: no cover
            logger.warning("Failed to publish alert to Pub/Sub: %s", exc)

        logger.info(
            "Governance alert [%s] emitted for tenant %s from %s: %s",
            severity.value,
            tenant_id,
            source,
            title,
        )
        return alert

    def list_alerts(
        self,
        tenant_id: str,
        severity: Optional[AlertSeverity | str] = None,
        unacknowledged_only: bool = False,
        limit: int = 50,
    ) -> List[AlertNotification]:
        """Query alert notifications with optional filters.

        Args:
            tenant_id: Target tenant.
            severity: Optional severity filter.
            unacknowledged_only: If True, exclude acknowledged alerts.
            limit: Maximum count to return.

        Returns:
            List of matching AlertNotification records.
        """
        target_sev = AlertSeverity(severity) if isinstance(severity, str) else severity

        with self._lock:
            alerts = list(self._tenant_alerts.get(tenant_id, []))

        filtered = []
        for a in alerts:
            if target_sev is not None and a.severity != target_sev:
                continue
            if unacknowledged_only and a.acknowledged:
                continue
            filtered.append(a)
            if len(filtered) >= limit:
                break

        return filtered

    def acknowledge_alert(self, tenant_id: str, alert_id: str) -> Optional[AlertNotification]:
        """Acknowledge a pending alert by ID.

        Args:
            tenant_id: Target tenant.
            alert_id: Identifier of alert.

        Returns:
            Updated AlertNotification or None if not found.
        """
        with self._lock:
            for alert in self._tenant_alerts.get(tenant_id, []):
                if alert.alert_id == alert_id:
                    alert.acknowledged = True
                    return alert
        return None

    async def stream_alerts(self, tenant_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Async generator streaming live alerts over Server-Sent Events (SSE).

        Args:
            tenant_id: Target tenant ID.

        Yields:
            SSE dictionary payload.
        """
        queue: asyncio.Queue = asyncio.Queue()
        with self._lock:
            self._subscribers[tenant_id].append(queue)

        try:
            # Yield initial keep-alive / connection confirmation event
            yield {
                "event": "connected",
                "data": {"status": "connected", "tenant_id": tenant_id, "timestamp": datetime.now(timezone.utc).isoformat()},
            }

            while True:
                try:
                    alert: AlertNotification = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield {
                        "event": "alert",
                        "data": alert.model_dump(),
                    }
                except asyncio.TimeoutError:
                    # Send keepalive heartbeat comment
                    yield {
                        "event": "ping",
                        "data": {"timestamp": datetime.now(timezone.utc).isoformat()},
                    }
        finally:
            with self._lock:
                if queue in self._subscribers[tenant_id]:
                    self._subscribers[tenant_id].remove(queue)

    def clear_alerts(self, tenant_id: Optional[str] = None) -> None:
        """Clear alerts from memory buffer.

        Args:
            tenant_id: Optional tenant; if None clears all tenants.
        """
        with self._lock:
            if tenant_id:
                self._tenant_alerts[tenant_id].clear()
            else:
                self._tenant_alerts.clear()


alert_service = AlertService()
