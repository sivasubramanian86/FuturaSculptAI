"""Observation and Monitoring layer for FuturaSculptAI.

Provides OpenTelemetry metrics instrumentation, Prometheus exposition endpoint generation,
and runtime telemetry aggregations.
"""

from collections import defaultdict
from datetime import datetime, timezone
import threading
from typing import Any, Dict

from opentelemetry import metrics

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("futurasculpt.monitoring")

# OpenTelemetry meter initialization
meter = metrics.get_meter("futurasculpt.telemetry", settings.app_version)


class TelemetryRegistry:
    """Thread-safe metric registry and Prometheus-compatible exporter."""

    def __init__(self):
        """Initialize telemetry counters and OpenTelemetry instruments."""
        self._lock = threading.Lock()
        self._request_counts: Dict[str, int] = defaultdict(int)
        self._agent_invocations: Dict[str, int] = defaultdict(int)
        self._governance_redlines: Dict[str, int] = defaultdict(int)
        self._token_usage: Dict[str, int] = defaultdict(int)
        self._operation_latencies: Dict[str, list[float]] = defaultdict(list)
        self._active_workflows: int = 0

        # OpenTelemetry instruments
        self._otel_request_counter = meter.create_counter(
            name="futurasculpt_http_requests_total",
            description="Total HTTP requests processed by endpoint and status",
            unit="1",
        )
        self._otel_agent_counter = meter.create_counter(
            name="futurasculpt_agent_invocations_total",
            description="Total multi-agent deliberation invocations by agent and outcome",
            unit="1",
        )
        self._otel_redline_counter = meter.create_counter(
            name="futurasculpt_governance_redlines_total",
            description="Total governance redlines and boundary breaches encountered",
            unit="1",
        )
        self._otel_token_counter = meter.create_counter(
            name="futurasculpt_token_usage_total",
            description="Total LLM prompt and response tokens consumed",
            unit="1",
        )
        self._otel_latency_histogram = meter.create_histogram(
            name="futurasculpt_operation_latency_seconds",
            description="Duration of backend calculations and agent reasoning",
            unit="s",
        )

    def record_request(self, method: str, path: str, status_code: int) -> None:
        """Record an incoming HTTP request.

        Args:
            method: HTTP method (GET, POST, etc.).
            path: Normalized request URL path.
            status_code: HTTP response status code.
        """
        key = f"{method}:{path}:{status_code}"
        with self._lock:
            self._request_counts[key] += 1

        self._otel_request_counter.add(
            1,
            {"http.method": method, "http.route": path, "http.status_code": status_code},
        )

    def record_agent_invocation(self, agent_name: str, status: str = "success") -> None:
        """Record an autonomous subagent deliberation turn.

        Args:
            agent_name: Name of agent (e.g., 'WorkgraphArchitectAgent').
            status: Outcome ('success', 'redline_breach', 'error').
        """
        key = f"{agent_name}:{status}"
        with self._lock:
            self._agent_invocations[key] += 1

        self._otel_agent_counter.add(
            1,
            {"agent.name": agent_name, "status": status},
        )

    def record_governance_redline(self, redline_type: str, severity: str = "CRITICAL") -> None:
        """Record a triggered governance redline.

        Args:
            redline_type: Category of redline (e.g., 'adverse_employment_decision').
            severity: Severity tier.
        """
        key = f"{redline_type}:{severity}"
        with self._lock:
            self._governance_redlines[key] += 1

        self._otel_redline_counter.add(
            1,
            {"redline.type": redline_type, "severity": severity},
        )

    def record_token_usage(self, model: str, prompt_tokens: int, completion_tokens: int) -> None:
        """Record LLM token consumption for FinOps attribution.

        Args:
            model: Model name/identifier.
            prompt_tokens: Number of input tokens.
            completion_tokens: Number of generated tokens.
        """
        with self._lock:
            self._token_usage[f"{model}:input"] += prompt_tokens
            self._token_usage[f"{model}:output"] += completion_tokens

        self._otel_token_counter.add(prompt_tokens, {"model": model, "direction": "input"})
        self._otel_token_counter.add(completion_tokens, {"model": model, "direction": "output"})

    def record_latency(self, operation: str, duration_seconds: float) -> None:
        """Record operation duration latency.

        Args:
            operation: Operation name (e.g., 'vertex_inference', 'temporal_graph_traverse').
            duration_seconds: Duration in seconds.
        """
        with self._lock:
            self._operation_latencies[operation].append(duration_seconds)
            # Keep sample window bounded to last 1000 measurements
            if len(self._operation_latencies[operation]) > 1000:
                self._operation_latencies[operation].pop(0)

        self._otel_latency_histogram.record(duration_seconds, {"operation": operation})

    def adjust_active_workflows(self, delta: int) -> int:
        """Adjust gauge of currently active multi-agent workflows.

        Args:
            delta: Increment (+1) or decrement (-1).

        Returns:
            Updated count of active workflows.
        """
        with self._lock:
            self._active_workflows = max(0, self._active_workflows + delta)
            return self._active_workflows

    def get_telemetry_summary(self) -> Dict[str, Any]:
        """Generate structured snapshot of runtime telemetry.

        Returns:
            Dictionary containing metrics snapshot.
        """
        with self._lock:
            total_reqs = sum(self._request_counts.values())
            total_invocations = sum(self._agent_invocations.values())
            total_redlines = sum(self._governance_redlines.values())
            total_tokens = sum(self._token_usage.values())
            active = self._active_workflows

            avg_latencies = {}
            for op, samples in self._operation_latencies.items():
                avg_latencies[op] = sum(samples) / len(samples) if samples else 0.0

            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "service": settings.app_name,
                "version": settings.app_version,
                "environment": settings.environment,
                "active_workflows": active,
                "total_http_requests": total_reqs,
                "total_agent_invocations": total_invocations,
                "total_governance_redlines": total_redlines,
                "total_tokens_consumed": total_tokens,
                "average_latencies_seconds": avg_latencies,
            }

    def export_prometheus_metrics(self) -> str:
        """Generate standard Prometheus-compatible text exposition format.

        Returns:
            Plaintext Prometheus metrics payload.
        """
        lines = [
            "# HELP futurasculpt_http_requests_total Total HTTP requests processed",
            "# TYPE futurasculpt_http_requests_total counter",
        ]
        with self._lock:
            for key, val in self._request_counts.items():
                parts = key.split(":")
                method, path, status = parts[0], parts[1], parts[2]
                lines.append(f'futurasculpt_http_requests_total{{method="{method}",path="{path}",status="{status}"}} {val}')

            lines.extend([
                "# HELP futurasculpt_agent_invocations_total Total multi-agent deliberations",
                "# TYPE futurasculpt_agent_invocations_total counter",
            ])
            for key, val in self._agent_invocations.items():
                agent, st = key.split(":")
                lines.append(f'futurasculpt_agent_invocations_total{{agent="{agent}",status="{st}"}} {val}')

            lines.extend([
                "# HELP futurasculpt_governance_redlines_total Total governance redlines triggered",
                "# TYPE futurasculpt_governance_redlines_total counter",
            ])
            for key, val in self._governance_redlines.items():
                rtype, sev = key.split(":")
                lines.append(f'futurasculpt_governance_redlines_total{{redline_type="{rtype}",severity="{sev}"}} {val}')

            lines.extend([
                "# HELP futurasculpt_token_usage_total Total LLM tokens consumed",
                "# TYPE futurasculpt_token_usage_total counter",
            ])
            for key, val in self._token_usage.items():
                model, ttype = key.split(":")
                lines.append(f'futurasculpt_token_usage_total{{model="{model}",type="{ttype}"}} {val}')

            lines.extend([
                "# HELP futurasculpt_active_workflows Current active multi-agent workflows",
                "# TYPE futurasculpt_active_workflows gauge",
                f"futurasculpt_active_workflows {self._active_workflows}",
            ])

        return "\n".join(lines) + "\n"

    def reset_metrics(self) -> None:
        """Reset internal metrics storage (primarily for testing isolation)."""
        with self._lock:
            self._request_counts.clear()
            self._agent_invocations.clear()
            self._governance_redlines.clear()
            self._token_usage.clear()
            self._operation_latencies.clear()
            self._active_workflows = 0


telemetry_registry = TelemetryRegistry()
