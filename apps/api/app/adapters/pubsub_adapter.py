"""Google Cloud Pub/Sub Adapter for event publishing and telemetry subscription.

Provides unified streaming across:
- `futurasculpt-workforce-telemetry` (ingestion, shift changes, skill graphs)
- `futurasculpt-governance-alerts` (redlines, bias drift, approval triggers)
- `futurasculpt-actuation-events` (Workday/SAP dispatch, rollbacks)
"""

from collections import defaultdict
from datetime import datetime, timezone
import json
import threading
from typing import Any, Callable, Dict, List, Optional
import uuid

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("futurasculpt.pubsub")

try:
    from google.cloud import pubsub_v1
    from google.cloud.pubsub_v1.publisher.futures import Future

    _PUBSUB_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover
    pubsub_v1 = None  # type: ignore
    Future = None  # type: ignore
    _PUBSUB_SDK_AVAILABLE = False


class PubSubAdapter:
    """Enterprise Google Cloud Pub/Sub adapter with in-memory fallback.

    Enforces tenant isolation, idempotency key generation, and resilient delivery.
    """

    def __init__(self, project_id: Optional[str] = None):
        """Initialize PubSubAdapter with GCP project reference and thread-safe mock queue.

        Args:
            project_id: Optional GCP project ID override.
        """
        self.project_id = project_id or settings.gcp_project_id
        self._lock = threading.Lock()
        self._in_memory_topics: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._subscriptions: Dict[str, List[Callable[[Dict[str, Any]], None]]] = defaultdict(list)
        self._publisher_client = None

        if _PUBSUB_SDK_AVAILABLE and not settings.mock_llm_mode:
            try:
                self._publisher_client = pubsub_v1.PublisherClient()
                logger.info("Live Google Cloud PubSub publisher initialized for project: %s", self.project_id)
            except Exception as exc:  # pragma: no cover
                logger.warning("Could not initialize live PubSub client (%s); operating in in-memory mode.", exc)
                self._publisher_client = None

    def _resolve_topic_path(self, topic_name: str) -> str:
        """Resolve full GCP topic resource path.

        Args:
            topic_name: Short topic name or fully-qualified path.

        Returns:
            Fully-qualified Pub/Sub topic path.
        """
        if topic_name.startswith("projects/"):
            return topic_name
        return f"projects/{self.project_id}/topics/{topic_name}"

    def publish(
        self,
        topic_name: str,
        message: Dict[str, Any],
        attributes: Optional[Dict[str, str]] = None,
        tenant_id: Optional[str] = None,
    ) -> str:
        """Publish structured message envelope to specified topic.

        Args:
            topic_name: Target topic name or path.
            message: JSON-serializable message payload.
            attributes: Optional message attributes for filtering.
            tenant_id: Optional tenant isolation identifier.

        Returns:
            str: Unique message ID.
        """
        msg_id = f"pubsub-msg-{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        resolved_tenant = tenant_id or message.get("tenant_id") or settings.default_tenant_id

        payload_envelope = {
            "message_id": msg_id,
            "topic": topic_name,
            "tenant_id": resolved_tenant,
            "timestamp": now_iso,
            "data": message,
            "attributes": attributes or {},
        }

        # Store in thread-safe memory queue
        with self._lock:
            self._in_memory_topics[topic_name].append(payload_envelope)
            callbacks = list(self._subscriptions.get(topic_name, []))

        # Invoke in-process subscriber callbacks
        for cb in callbacks:
            try:
                cb(payload_envelope)
            except Exception as exc:  # pragma: no cover
                logger.error("Error executing in-process Pub/Sub callback on %s: %s", topic_name, exc)

        # Attempt live Google Cloud Pub/Sub dispatch if client exists
        if self._publisher_client is not None:
            try:
                topic_path = self._resolve_topic_path(topic_name)
                serialized = json.dumps(payload_envelope).encode("utf-8")
                merged_attrs = {"tenant_id": resolved_tenant, **(attributes or {})}
                future = self._publisher_client.publish(topic_path, serialized, **merged_attrs)
                live_id = future.result(timeout=5.0)
                logger.debug("Published to live Pub/Sub topic %s: %s", topic_name, live_id)
                return str(live_id)
            except Exception as exc:
                logger.warning("Live Pub/Sub publish failed (%s); fallback message ID returned: %s", exc, msg_id)

        return msg_id

    def publish_telemetry(
        self,
        event_name: str,
        payload: Dict[str, Any],
        tenant_id: Optional[str] = None,
    ) -> str:
        """Publish workforce telemetry event.

        Args:
            event_name: Telemetry event discriminator (e.g., 'evidence_ingested').
            payload: Event data payload.
            tenant_id: Target tenant ID.

        Returns:
            str: Published message ID.
        """
        message = {
            "event_type": "telemetry",
            "event_name": event_name,
            "payload": payload,
        }
        return self.publish(
            topic_name=settings.pubsub_topic_telemetry,
            message=message,
            attributes={"event_type": "telemetry", "event_name": event_name},
            tenant_id=tenant_id,
        )

    def publish_governance_alert(
        self,
        alert_title: str,
        severity: str,
        details: Dict[str, Any],
        tenant_id: Optional[str] = None,
    ) -> str:
        """Publish governance redline or policy alert.

        Args:
            alert_title: Brief title of governance finding.
            severity: Severity tier ('INFO', 'WARNING', 'CRITICAL_REDLINE', 'APPROVAL_REQUIRED').
            details: Contextual metadata and violation lineage.
            tenant_id: Target tenant ID.

        Returns:
            str: Published message ID.
        """
        message = {
            "event_type": "governance_alert",
            "title": alert_title,
            "severity": severity,
            "details": details,
        }
        return self.publish(
            topic_name=settings.pubsub_topic_alerts,
            message=message,
            attributes={"event_type": "governance_alert", "severity": severity},
            tenant_id=tenant_id,
        )

    def publish_actuation_event(
        self,
        action_name: str,
        target_system: str,
        parameters: Dict[str, Any],
        tenant_id: Optional[str] = None,
    ) -> str:
        """Publish actuation dispatch event (e.g., Workday/SAP HCM integration).

        Args:
            action_name: Dispatched actuation action.
            target_system: Downstream system destination.
            parameters: Action execution parameters.
            tenant_id: Target tenant ID.

        Returns:
            str: Published message ID.
        """
        message = {
            "event_type": "actuation_event",
            "action_name": action_name,
            "target_system": target_system,
            "parameters": parameters,
        }
        return self.publish(
            topic_name=settings.pubsub_topic_actuation,
            message=message,
            attributes={"event_type": "actuation_event", "target_system": target_system},
            tenant_id=tenant_id,
        )

    def subscribe_in_memory(
        self,
        topic_name: str,
        callback: Callable[[Dict[str, Any]], None],
    ) -> None:
        """Register local callback subscriber for a topic.

        Args:
            topic_name: Name of topic to listen on.
            callback: Callable accepting payload envelope.
        """
        with self._lock:
            self._subscriptions[topic_name].append(callback)

    def get_messages(
        self,
        topic_name: str,
        tenant_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve stored in-memory messages for verification and testing.

        Args:
            topic_name: Topic identifier.
            tenant_id: Optional filter by tenant.

        Returns:
            List of message envelopes.
        """
        with self._lock:
            messages = list(self._in_memory_topics.get(topic_name, []))

        if tenant_id:
            return [m for m in messages if m.get("tenant_id") == tenant_id]
        return messages

    def clear_messages(self, topic_name: Optional[str] = None) -> None:
        """Clear in-memory topic queues.

        Args:
            topic_name: Optional topic to clear; if None clears all topics.
        """
        with self._lock:
            if topic_name:
                self._in_memory_topics[topic_name].clear()
            else:
                self._in_memory_topics.clear()


pubsub_adapter = PubSubAdapter()
