"""Unit tests for structured logging and centralized exception handling."""

from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.core.exceptions import (
    FuturaSculptException,
    IntegrityTamperException,
    PolicyViolationException,
    ResourceNotFoundException,
    ValidationException,
)
from app.core.logging import (
    LogLevel,
    configure_logging,
    get_log_tenant,
    get_logger,
    set_log_tenant,
)
from app.main import app

client = TestClient(app)
client_no_raise = TestClient(app, raise_server_exceptions=False)

# Create an exception router with endpoints designed to trigger exception handlers
exception_router = APIRouter(prefix="/api/test-exceptions")


@exception_router.get("/custom-domain-error")
def trigger_domain_error():
    """Trigger domain resource not found error."""
    raise ResourceNotFoundException("Resource not found", detail="Artifact entity missing.")


@exception_router.get("/policy-error")
def trigger_policy_error():
    """Trigger policy violation error."""
    raise PolicyViolationException("Red line violation", detail="Autonomous layoff rejected.")


@exception_router.get("/validation-error")
def trigger_validation_error():
    """Trigger validation error."""
    raise ValidationException("Field invalid", detail="Parameter out of bounds.")


@exception_router.get("/tamper-error")
def trigger_tamper_error():
    """Trigger cryptographic tamper error."""
    raise IntegrityTamperException("Hash mismatch", detail="Digest altered.")


@exception_router.get("/unhandled-error")
def trigger_unhandled_error():
    """Trigger unhandled runtime error."""
    raise RuntimeError("Unexpected arithmetic crash!")


app.include_router(exception_router)


def test_logger_and_tenant_context():
    """Verify logger configuration and tenant context propagation."""
    assert issubclass(ResourceNotFoundException, FuturaSculptException)
    configure_logging("DEBUG")
    logger = get_logger("test.module")
    assert logger is not None

    set_log_tenant("tenant-custom-xyz")
    assert get_log_tenant() == "tenant-custom-xyz"

    # Test log levels enum
    assert LogLevel.DEBUG == "DEBUG"
    assert LogLevel.INFO == "INFO"
    assert LogLevel.WARNING == "WARNING"
    assert LogLevel.ERROR == "ERROR"
    assert LogLevel.CRITICAL == "CRITICAL"


def test_domain_exception_handling():
    """Verify custom domain exceptions return structured JSON error envelopes."""
    resp = client.get(
        "/api/test-exceptions/custom-domain-error",
        headers={"X-Tenant-ID": "tenant-corp-42"},
    )
    assert resp.status_code == 404
    data = resp.json()
    assert data["error_code"] == "RESOURCE_NOT_FOUND"
    assert data["message"] == "Resource not found"
    assert data["detail"] == "Artifact entity missing."
    assert data["tenant_id"] == "tenant-corp-42"
    assert "timestamp" in data

    resp_policy = client.get("/api/test-exceptions/policy-error")
    assert resp_policy.status_code == 403
    assert resp_policy.json()["error_code"] == "POLICY_VIOLATION"

    resp_val = client.get("/api/test-exceptions/validation-error")
    assert resp_val.status_code == 422
    assert resp_val.json()["error_code"] == "VALIDATION_FAILED"

    resp_tamper = client.get("/api/test-exceptions/tamper-error")
    assert resp_tamper.status_code == 409
    assert resp_tamper.json()["error_code"] == "INTEGRITY_TAMPER_DETECTED"


def test_schema_validation_error_handler():
    """Verify Pydantic schema validation failures trigger structured 422 envelope."""
    # Send invalid type for horizon_years (string instead of int)
    resp = client.post(
        "/api/v1/agents/swarm/run",
        json={"scenario_prompt": "Valid prompt", "horizon_years": "not-a-number"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp.status_code == 422
    data = resp.json()
    assert data["error_code"] == "VALIDATION_ERROR"
    assert "detail" in data


def test_unhandled_exception_handler():
    """Verify unhandled internal errors return safe 500 error envelope without crashing."""
    resp = client_no_raise.get("/api/test-exceptions/unhandled-error")
    assert resp.status_code == 500
    data = resp.json()
    assert data["error_code"] == "INTERNAL_SERVER_ERROR"
    assert "timestamp" in data
