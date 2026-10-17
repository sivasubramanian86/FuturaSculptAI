"""Tests for RBAC, Firebase IAM persona sessions, and Cloud DLP inspection."""

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.rbac import (
    UserRole,
    UserSession,
    get_current_user,
    parse_bearer_token,
    require_roles,
)
from app.main import app

client = TestClient(app)


def test_parse_bearer_token():
    """Verify bearer token parsing handles nulls, malformed, and valid strings."""
    assert parse_bearer_token(None) is None
    assert parse_bearer_token("") is None
    assert parse_bearer_token("Basic dXNlcjpwYXNz") is None
    assert parse_bearer_token("Bearer abc.123.xyz") == "abc.123.xyz"
    assert parse_bearer_token("bearer token-val") == "token-val"


def test_get_current_user_default():
    """Verify default persona is Citizen Worker when no role header is sent."""
    session = get_current_user()
    assert session.role == UserRole.CITIZEN_WORKER
    assert "appeals:create" in session.permissions
    assert session.auth_provider == "mock_iam"


def test_get_current_user_with_role_and_bearer():
    """Verify explicit role header and Bearer token parsing."""
    session = get_current_user(
        authorization="Bearer firebase-jwt-mock",
        x_user_role="ENTERPRISE_ARCHITECT",
        x_user_id="arch-007",
        x_tenant_id="tenant-corp-01",
    )
    assert session.role == UserRole.ENTERPRISE_ARCHITECT
    assert session.user_id == "arch-007"
    assert session.tenant_id == "tenant-corp-01"
    assert session.auth_provider == "firebase_token"
    assert "workgraph:write" in session.permissions


def test_get_current_user_invalid_role():
    """Verify invalid role header raises HTTP 400 Bad Request."""
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(x_user_role="SUPER_ADMIN_INVALID")
    assert exc_info.value.status_code == 400
    assert "Invalid IAM role" in exc_info.value.detail


def test_require_roles_dependency():
    """Verify require_roles dependency permits authorized roles and blocks others."""
    architect_user = UserSession(
        user_id="usr-1",
        email="usr-1@test.local",
        display_name="Architect",
        role=UserRole.ENTERPRISE_ARCHITECT,
        tenant_id="tenant-1",
        permissions=[],
    )
    citizen_user = UserSession(
        user_id="usr-2",
        email="usr-2@test.local",
        display_name="Citizen",
        role=UserRole.CITIZEN_WORKER,
        tenant_id="tenant-1",
        permissions=[],
    )

    check_architect = require_roles(UserRole.ENTERPRISE_ARCHITECT)
    # Permitted
    assert check_architect(architect_user) == architect_user

    # Forbidden
    with pytest.raises(HTTPException) as exc_info:
        check_architect(citizen_user)
    assert exc_info.value.status_code == 403
    assert "FORBIDDEN_INSUFFICIENT_ROLE" in exc_info.value.detail


def test_api_auth_me():
    """Verify /api/v1/auth/me returns active session."""
    res = client.get("/api/v1/auth/me", headers={"X-User-Role": "INVESTOR"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "INVESTOR"
    assert "investor:simulate" in data["permissions"]


def test_api_auth_roles():
    """Verify /api/v1/auth/roles returns all 6 supported IAM roles."""
    res = client.get("/api/v1/auth/roles")
    assert res.status_code == 200
    roles = res.json()
    assert len(roles) == 6
    role_names = [r["role"] for r in roles]
    assert "CITIZEN_WORKER" in role_names
    assert "ENTERPRISE_ARCHITECT" in role_names
    assert "INVESTOR" in role_names
    assert "HR_EXECUTIVE" in role_names
    assert "CUSTOMER_CARE" in role_names
    assert "GOVERNANCE_OFFICER" in role_names


def test_api_evidence_inspect_dlp():
    """Verify /api/v1/evidence/inspect-dlp masks sensitive PII and returns telemetry."""
    payload = {
        "text": "Contact john.doe@example.com at 415-555-2671 with SSN 000-12-3456 and base pay $120,000/yr."
    }
    res = client.post("/api/v1/evidence/inspect-dlp", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "[REDACTED_EMAIL]" in data["sanitized_text"]
    assert "[REDACTED_PHONE]" in data["sanitized_text"]
    assert "[REDACTED_SSN]" in data["sanitized_text"]
    assert "[REDACTED_COMPENSATION]" in data["sanitized_text"]
    assert data["redacted_items_count"] == 4
    assert "EMAIL_ADDRESS" in data["detected_info_types"]


def test_simulated_fb_jwt_token_claims():
    """Verify verify_firebase_id_token resolves roles from simulated fb-jwt tokens."""
    from app.core.rbac import verify_firebase_id_token

    claims_ea = verify_firebase_id_token("fb-jwt-enterprise_architect-17921988")
    assert claims_ea["role"] == "ENTERPRISE_ARCHITECT"

    claims_default = verify_firebase_id_token("mock-token-xyz")
    assert claims_default["role"] == "CITIZEN_WORKER"
