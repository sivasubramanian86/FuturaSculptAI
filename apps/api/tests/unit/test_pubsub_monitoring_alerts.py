"""Comprehensive unit tests for Google Cloud Pub/Sub, Observation/Monitoring, and Alert Service.

Enforces 100% statement and branch coverage across adapters and services.
"""

import asyncio
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
import pytest

from app.adapters.pubsub_adapter import PubSubAdapter, pubsub_adapter
from app.core.config import settings
from app.core.monitoring import telemetry_registry
from app.main import app
from app.services.alert_service import AlertSeverity, AlertService, alert_service


@pytest.fixture
def clean_registry():
    """Reset telemetry registry before and after test."""
    telemetry_registry.reset_metrics()
    yield telemetry_registry
    telemetry_registry.reset_metrics()


@pytest.fixture
def clean_alerts():
    """Clear alerts and in-memory pubsub before and after test."""
    alert_service.clear_alerts()
    pubsub_adapter.clear_messages()
    yield alert_service
    alert_service.clear_alerts()
    pubsub_adapter.clear_messages()


def test_pubsub_adapter_topic_path_and_in_memory():
    """Test PubSub topic path resolution and in-memory queue operations."""
    adapter = PubSubAdapter(project_id="test-proj-2026")

    # Short name resolution
    assert adapter._resolve_topic_path("test-topic") == "projects/test-proj-2026/topics/test-topic"
    # Already qualified path
    assert adapter._resolve_topic_path("projects/other/topics/custom") == "projects/other/topics/custom"

    # Subscriber callback verification
    received = []

    def on_msg(envelope):
        received.append(envelope)

    adapter.subscribe_in_memory("topic-alpha", on_msg)

    # Publish message
    msg_id = adapter.publish(
        topic_name="topic-alpha",
        message={"event": "ping"},
        attributes={"env": "test"},
        tenant_id="tenant-x",
    )
    assert msg_id.startswith("pubsub-msg-")
    assert len(received) == 1
    assert received[0]["data"]["event"] == "ping"
    assert received[0]["attributes"]["env"] == "test"
    assert received[0]["tenant_id"] == "tenant-x"

    # Query messages
    msgs_all = adapter.get_messages("topic-alpha")
    assert len(msgs_all) == 1

    msgs_tenant_x = adapter.get_messages("topic-alpha", tenant_id="tenant-x")
    assert len(msgs_tenant_x) == 1

    msgs_tenant_y = adapter.get_messages("topic-alpha", tenant_id="tenant-y")
    assert len(msgs_tenant_y) == 0

    # Clear specific topic
    adapter.clear_messages("topic-alpha")
    assert len(adapter.get_messages("topic-alpha")) == 0

    # Clear all
    adapter.publish("topic-beta", {"foo": "bar"})
    adapter.clear_messages()
    assert len(adapter.get_messages("topic-beta")) == 0


def test_pubsub_adapter_high_level_methods():
    """Test publish_telemetry, publish_governance_alert, and publish_actuation_event."""
    adapter = PubSubAdapter()

    # Telemetry
    t_id = adapter.publish_telemetry("evidence_ingested", {"hash": "abc1234"}, tenant_id="t-1")
    assert t_id.startswith("pubsub-msg-")
    t_msgs = adapter.get_messages(settings.pubsub_topic_telemetry)
    assert len(t_msgs) == 1
    assert t_msgs[0]["data"]["payload"]["hash"] == "abc1234"

    # Alert
    a_id = adapter.publish_governance_alert(
        alert_title="Redline Warning",
        severity="WARNING",
        details={"rule": "no_bias"},
        tenant_id="t-1",
    )
    assert a_id.startswith("pubsub-msg-")
    a_msgs = adapter.get_messages(settings.pubsub_topic_alerts)
    assert len(a_msgs) == 1
    assert a_msgs[0]["data"]["severity"] == "WARNING"

    # Actuation
    act_id = adapter.publish_actuation_event(
        action_name="update_skills_matrix",
        target_system="WORKDAY",
        parameters={"worker_id": "W-101"},
        tenant_id="t-1",
    )
    assert act_id.startswith("pubsub-msg-")
    act_msgs = adapter.get_messages(settings.pubsub_topic_actuation)
    assert len(act_msgs) == 1
    assert act_msgs[0]["data"]["action_name"] == "update_skills_matrix"


def test_pubsub_adapter_live_client_mock():
    """Test live publisher execution path and exception handling fallback."""
    adapter = PubSubAdapter()
    mock_client = MagicMock()
    mock_future = MagicMock()
    mock_future.result.return_value = "live-pubsub-id-999"
    mock_client.publish.return_value = mock_future
    adapter._publisher_client = mock_client

    # Successful live publish
    result_id = adapter.publish("my-topic", {"data": 123}, tenant_id="tenant-live")
    assert result_id == "live-pubsub-id-999"

    # Simulated exception during live publish
    mock_client.publish.side_effect = RuntimeError("PubSub service unavailable")
    fallback_id = adapter.publish("my-topic", {"data": 456}, tenant_id="tenant-live")
    assert fallback_id.startswith("pubsub-msg-")


def test_telemetry_registry_metrics_lifecycle(clean_registry):
    """Verify TelemetryRegistry recording, windowing, and Prometheus export."""
    registry = clean_registry

    # Record requests
    registry.record_request("GET", "/health/live", 200)
    registry.record_request("POST", "/api/v1/governance/alerts", 201)

    # Record agent deliberations
    registry.record_agent_invocation("WorkgraphArchitectAgent", "success")
    registry.record_agent_invocation("AdversarialCriticAgent", "redline_breach")

    # Record governance redlines
    registry.record_governance_redline("adverse_employment_decision", "CRITICAL")
    registry.record_governance_redline("bias_variance", "WARNING")

    # Record tokens
    registry.record_token_usage("gemini-3.8-flash-001", prompt_tokens=100, completion_tokens=50)

    # Record latency with window truncation
    for i in range(1005):
        registry.record_latency("vertex_inference", 0.05 + (i * 0.0001))

    # Adjust active workflows
    assert registry.adjust_active_workflows(1) == 1
    assert registry.adjust_active_workflows(2) == 3
    assert registry.adjust_active_workflows(-5) == 0  # Bounded to zero

    # Telemetry snapshot
    summary = registry.get_telemetry_summary()
    assert summary["total_http_requests"] == 2
    assert summary["total_agent_invocations"] == 2
    assert summary["total_governance_redlines"] == 2
    assert summary["total_tokens_consumed"] == 150
    assert "vertex_inference" in summary["average_latencies_seconds"]

    # Prometheus export
    prom_text = registry.export_prometheus_metrics()
    assert "futurasculpt_http_requests_total" in prom_text
    assert "futurasculpt_agent_invocations_total" in prom_text
    assert "futurasculpt_governance_redlines_total" in prom_text
    assert "futurasculpt_token_usage_total" in prom_text
    assert "futurasculpt_active_workflows 0" in prom_text


def test_alert_service_operations(clean_alerts):
    """Test AlertService emit, query, filter, and acknowledge."""
    svc = clean_alerts

    # Emit alerts
    a1 = svc.emit_alert(
        tenant_id="tenant-1",
        severity=AlertSeverity.INFO,
        title="Ingestion complete",
        message="5 documents parsed",
        source="IngestionService",
    )
    a2 = svc.emit_alert(
        tenant_id="tenant-1",
        severity=AlertSeverity.WARNING,
        title="Potential Bias Detected",
        message="Demographic variance exceeds 5%",
        source="BiasAudit",
    )
    a3 = svc.emit_alert(
        tenant_id="tenant-1",
        severity=AlertSeverity.CRITICAL_REDLINE,
        title="Autonomous Downsizing Blocked",
        message="Redline Rule: No automated worker termination",
        source="Gatekeeper",
    )
    assert a1.title == "Ingestion complete"
    assert a2.title == "Potential Bias Detected"
    assert a3.title == "Autonomous Downsizing Blocked"

    # Query all
    all_alerts = svc.list_alerts("tenant-1")
    assert len(all_alerts) == 3

    # Query by severity
    criticals = svc.list_alerts("tenant-1", severity=AlertSeverity.CRITICAL_REDLINE)
    assert len(criticals) == 1
    assert criticals[0].title == "Autonomous Downsizing Blocked"

    # Query unacknowledged only
    unacks = svc.list_alerts("tenant-1", unacknowledged_only=True)
    assert len(unacks) == 3

    # Acknowledge alert
    ack_res = svc.acknowledge_alert("tenant-1", a1.alert_id)
    assert ack_res is not None
    assert ack_res.acknowledged is True

    # Acknowledge nonexistent alert
    assert svc.acknowledge_alert("tenant-1", "non-existent-id") is None

    # Filter unacknowledged
    unacks_after = svc.list_alerts("tenant-1", unacknowledged_only=True)
    assert len(unacks_after) == 2

    # Clear alerts
    svc.clear_alerts("tenant-1")
    assert len(svc.list_alerts("tenant-1")) == 0


@pytest.mark.asyncio
async def test_alert_service_streaming(clean_alerts):
    """Test SSE alert generator streaming."""
    svc = clean_alerts

    gen = svc.stream_alerts("tenant-sse")
    # First item is connection handshake
    handshake = await anext(gen)
    assert handshake["event"] == "connected"
    assert handshake["data"]["status"] == "connected"

    # Emit alert in background
    svc.emit_alert(
        tenant_id="tenant-sse",
        severity=AlertSeverity.APPROVAL_REQUIRED,
        title="Human Approval Required",
        message="Approve Workday shift reorganization",
        source="Orchestrator",
    )

    alert_event = await anext(gen)
    assert alert_event["event"] == "alert"
    assert alert_event["data"]["severity"] == "APPROVAL_REQUIRED"

    # Close generator
    await gen.aclose()


def test_api_metrics_and_alerts_endpoints(clean_alerts, clean_registry):
    """Test FastAPI HTTP endpoints for /metrics, /telemetry, and /api/v1/governance/alerts."""
    client = TestClient(app)

    # Test /metrics endpoint
    res_metrics = client.get("/metrics")
    assert res_metrics.status_code == 200
    assert "futurasculpt_http_requests_total" in res_metrics.text

    # Test /telemetry endpoint
    res_telemetry = client.get("/telemetry")
    assert res_telemetry.status_code == 200
    assert res_telemetry.json()["service"] == "FuturaSculptAI API"

    # Test POST /api/v1/governance/alerts
    alert_payload = {
        "severity": "WARNING",
        "title": "API Policy Alert",
        "message": "Testing alert endpoint",
        "source": "TEST_RUNNER",
        "metadata": {"test_key": "val"},
    }
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}
    res_post = client.post("/api/v1/governance/alerts", json=alert_payload, headers=headers)
    assert res_post.status_code == 201
    created_alert = res_post.json()
    assert created_alert["title"] == "API Policy Alert"
    alert_id = created_alert["alert_id"]

    # Test GET /api/v1/governance/alerts
    res_list = client.get("/api/v1/governance/alerts", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    # Test POST /api/v1/governance/alerts/{alert_id}/acknowledge
    res_ack = client.post(f"/api/v1/governance/alerts/{alert_id}/acknowledge", headers=headers)
    assert res_ack.status_code == 200
    assert res_ack.json()["acknowledged"] is True

    # Test 404 acknowledge
    res_ack_404 = client.post("/api/v1/governance/alerts/missing-id/acknowledge", headers=headers)
    assert res_ack_404.status_code == 404


def test_pubsub_adapter_live_initialization(monkeypatch):
    """Test PubSubAdapter initialization when mock_llm_mode is False."""
    import sys

    psa_module = sys.modules["app.adapters.pubsub_adapter"]
    monkeypatch.setattr(psa_module.settings, "mock_llm_mode", False)
    mock_pub_cls = MagicMock()
    monkeypatch.setattr(psa_module.pubsub_v1, "PublisherClient", mock_pub_cls)

    adapter = psa_module.PubSubAdapter()
    assert adapter._publisher_client is not None
    mock_pub_cls.assert_called_once()


def test_gatekeeper_edge_cases_and_error_handling():
    """Test Gatekeeper blank IDs, invalid autonomy tiers, turn count, unmapped tools, and execution exceptions."""
    from pydantic import ValidationError
    from app.agents.tools.gatekeeper import (
        AuditSaifControlsInput,
        RetrieveEvidenceCitationsInput,
        gatekeeper,
    )

    # 1. Blank string in evidence_ids and valid evidence_ids
    with pytest.raises(ValidationError):
        RetrieveEvidenceCitationsInput(evidence_ids=[" "])
    valid_ev = RetrieveEvidenceCitationsInput(evidence_ids=["EVID-101"])
    assert valid_ev.evidence_ids == ["EVID-101"]

    # 2. Invalid and valid autonomy tier in AuditSaifControlsInput
    with pytest.raises(ValidationError):
        AuditSaifControlsInput(scenario_prompt="test", autonomy_tier="INVALID_TIER")
    valid_saif = AuditSaifControlsInput(scenario_prompt="test", autonomy_tier="A0_READ_ONLY")
    assert valid_saif.autonomy_tier == "A0_READ_ONLY"

    # 3. get_turn_count
    assert gatekeeper.get_turn_count("nonexistent-run") == 0

    # 4. validate_invariants for unmapped tool name
    unmapped = gatekeeper.validate_invariants("custom_tool_unknown", {"any": 123})
    assert unmapped is not None

    # 5. intercept_and_execute when tool_fn raises an exception
    def failing_tool(**kwargs):
        raise ValueError("Simulated underlying tool failure")

    run_id = "test-fail-run-1"
    gatekeeper.reset_session(run_id)
    envelope = gatekeeper.intercept_and_execute(
        run_id=run_id,
        tool_name="inspect_workgraph_node",
        tool_fn=failing_tool,
        kwargs={"tenant_id": "tenant-test", "node_id": "ROL-01"},
    )
    assert envelope.status == "EXECUTION_ERROR"
    assert "Simulated underlying tool failure" in (envelope.error_message or "")
    assert envelope.provenance_hash is not None


@pytest.mark.asyncio
async def test_vertex_adapter_error_and_schema_branches(monkeypatch):
    """Test VertexAIAdapter primary failure, schema parsing success and failure on primary and fallback."""
    from pydantic import BaseModel
    from app.adapters.vertex_adapter import vertex_adapter

    class SimpleSchema(BaseModel):
        summary: str

    # 1. Primary succeeds with valid schema
    async def mock_primary_valid(*args, **kwargs):
        return {"content": '{"summary": "success payload"}', "model": "gemini-3.8-flash-001"}

    monkeypatch.setattr(vertex_adapter, "generate_text", mock_primary_valid)
    res_valid = await vertex_adapter.generate_with_dynamic_fallback(
        "test prompt", primary_model="gemini-3.8-pro-001", schema=SimpleSchema
    )
    assert "parsed" in res_valid
    assert res_valid["parsed"].summary == "success payload"

    # 2. Primary succeeds but schema parse fails
    async def mock_primary_invalid_json(*args, **kwargs):
        return {"content": "not json", "model": "gemini-3.8-flash-001"}

    monkeypatch.setattr(vertex_adapter, "generate_text", mock_primary_invalid_json)
    res_invalid = await vertex_adapter.generate_with_dynamic_fallback(
        "test prompt", primary_model="gemini-3.8-pro-001", schema=SimpleSchema
    )
    assert "parsed" not in res_invalid

    # 3. Primary fails after retry, triggering fallback with invalid json
    call_count = 0

    async def mock_primary_fail_then_fallback(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise RuntimeError("Primary API 503 error")
        return {"content": "fallback not json", "model": "gemini-3.8-flash-001"}

    monkeypatch.setattr(vertex_adapter, "generate_text", mock_primary_fail_then_fallback)
    res_fallback = await vertex_adapter.generate_with_dynamic_fallback(
        "test prompt", primary_model="gemini-3.8-pro-001", schema=SimpleSchema
    )
    assert res_fallback.get("fallback_applied") is True


@pytest.mark.asyncio
async def test_alert_service_buffer_overflow_and_timeout():
    """Test AlertService buffer pop on max_buffer reached, limit break, and timeout heartbeat."""
    svc = AlertService(max_buffer_per_tenant=2)

    # Emit 3 alerts to trigger buffer.pop()
    svc.emit_alert("tenant-buf", "INFO", "A1", "M1")
    svc.emit_alert("tenant-buf", "INFO", "A2", "M2")
    svc.emit_alert("tenant-buf", "INFO", "A3", "M3")
    alerts = svc.list_alerts("tenant-buf")
    assert len(alerts) == 2
    assert alerts[0].title == "A3"

    # Test limit break in list_alerts
    limited = svc.list_alerts("tenant-buf", limit=1)
    assert len(limited) == 1

    # Test timeout heartbeat in stream_alerts
    original_wait_for = asyncio.wait_for
    called_once = False

    async def mock_wait_for(fut, timeout):
        nonlocal called_once
        if not called_once:
            called_once = True
            raise asyncio.TimeoutError()
        return await original_wait_for(fut, timeout)

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(asyncio, "wait_for", mock_wait_for)
        gen = svc.stream_alerts("tenant-timeout")
        # Handshake
        await anext(gen)
        # Timeout ping
        ping = await anext(gen)
        assert ping["event"] == "ping"
        await gen.aclose()


@pytest.mark.asyncio
async def test_governance_router_stream_endpoint():
    """Test governance router stream_alerts endpoint function."""
    from app.routers.governance import stream_alerts

    response = await stream_alerts(tenant_id="tenant-stream-test")
    assert response is not None
