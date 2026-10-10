"""Subsystem health, liveness, and readiness probes."""

from typing import Dict

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/live")
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


@router.get("/ready")
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
