"""Subsystem health, liveness, readiness, and telemetry probes."""

from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.core.config import settings
from app.core.monitoring import telemetry_registry

router = APIRouter(tags=["Health"])


@router.get("/health/live")
def liveness_probe() -> Dict[str, str]:
    """Basic liveness check verifying the HTTP server is responsive.

    Returns:
        Dict[str, str]: Service status and version.
    """
    return {
        "status": "UP",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/health/ready")
def readiness_probe() -> Dict[str, str]:
    """Readiness check confirming dependencies and environment readiness.

    Returns:
        Dict[str, str]: Readiness status and active cloud configuration.
    """
    return {
        "status": "READY",
        "environment": settings.environment,
        "gcp_project": settings.gcp_project_id,
        "default_tenant": settings.default_tenant_id,
    }


@router.get("/healthz")
def healthz_probe() -> Dict[str, str]:
    """Kubernetes / Cloud Run liveness probe.

    Returns:
        Dict[str, str]: Health status and version.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/api/v1/health")
def api_v1_health_probe() -> Dict[str, str]:
    """Versioned API v1 health probe.

    Returns:
        Dict[str, str]: Health status and version.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/metrics", response_class=PlainTextResponse, summary="Prometheus metrics exposition endpoint")
def metrics_endpoint() -> PlainTextResponse:
    """Expose application metrics in standard Prometheus text format."""
    return PlainTextResponse(content=telemetry_registry.export_prometheus_metrics())


@router.get("/telemetry", summary="Structured telemetry snapshot")
def telemetry_endpoint() -> Dict[str, Any]:
    """Return JSON snapshot of runtime telemetry and system load."""
    return telemetry_registry.get_telemetry_summary()
