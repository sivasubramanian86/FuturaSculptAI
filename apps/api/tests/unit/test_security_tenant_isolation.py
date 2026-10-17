"""Tests for Phase 2: Authentication, Server-Side Tenant Boundary, and WorkTwin Security."""

from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch

from app.core.config import Settings, settings
from app.core.exceptions import PolicyViolationException, ResourceNotFoundException
from app.core.rbac import (
    UserRole,
    get_current_user,
    verify_firebase_id_token,
)
from app.main import app
from app.models.worktwin import (
    BoardroomSimulationRequest,
    PersonalWorkTwinConsent,
    TwinStatus,
)
from app.services.worktwin_service import WorkTwinService, worktwin_service

client = TestClient(app)


def test_verify_firebase_id_token_test_tokens():
    """Verify test-token parsing with embedded user_id, role, and tenant."""
    with patch("app.core.rbac.settings.auth_dev_mode", True):
        claims = verify_firebase_id_token("test-token:alice:ENTERPRISE_ARCHITECT:tenant-alpha")
        default_claims = verify_firebase_id_token("test-token")
    assert claims["user_id"] == "alice"
    assert claims["role"] == "ENTERPRISE_ARCHITECT"
    assert claims["tenant_id"] == "tenant-alpha"

    # Default fallback in test-token
    assert default_claims["user_id"] == "usr-test-01"
    assert default_claims["role"] == "CITIZEN_WORKER"


def test_verify_firebase_id_token_errors():
    """Verify expired, revoked, and invalid signature tokens raise HTTP 401."""
    with pytest.raises(HTTPException) as exc1:
        verify_firebase_id_token("expired-token")
    assert exc1.value.status_code == 401
    assert "ERR_EXPIRED_TOKEN" in exc1.value.detail

    with pytest.raises(HTTPException) as exc2:
        verify_firebase_id_token("revoked-token")
    assert exc2.value.status_code == 401
    assert "ERR_REVOKED_TOKEN" in exc2.value.detail

    with pytest.raises(HTTPException) as exc3:
        verify_firebase_id_token("invalid-token")
    assert exc3.value.status_code == 401
    assert "ERR_INVALID_TOKEN" in exc3.value.detail


def test_verify_firebase_id_token_google_oauth():
    """Verify real Google OAuth id_token path and exception handling."""
    with patch("google.oauth2.id_token.verify_firebase_token") as mock_verify:
        mock_verify.return_value = {
            "sub": "uid-google-999",
            "email": "lead@artisan.corp",
            "name": "Lead Architect",
            "role": "ENTERPRISE_ARCHITECT",
            "tenant_id": "tenant-google-01",
        }
        claims = verify_firebase_id_token("real.jwt.token.here")
        assert claims["sub"] == "uid-google-999"
        assert claims["role"] == "ENTERPRISE_ARCHITECT"

    # Failed Google token verification raises 401
    with patch("google.oauth2.id_token.verify_firebase_token", side_effect=ValueError("Invalid crypto signature")):
        with pytest.raises(HTTPException) as exc:
            verify_firebase_id_token("corrupted.jwt.token")
        assert exc.value.status_code == 401
        assert "Invalid crypto signature" in exc.value.detail


def test_production_mode_auth_enforcement():
    """Verify production mode rejects missing tokens and ignores client-forged headers."""
    orig_mode = settings.auth_dev_mode
    try:
        settings.auth_dev_mode = False

        # Missing token in production -> 401
        with pytest.raises(HTTPException) as exc_missing:
            get_current_user(authorization=None)
        assert exc_missing.value.status_code == 401
        assert "ERR_AUTH_REQUIRED" in exc_missing.value.detail

        with patch("google.oauth2.id_token.verify_firebase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": "bob", "email": "bob@example.com", "role": "INVESTOR", "tenant_id": "tenant-beta"
            }
            # Production accepts verified claims and ignores forged client headers.
            session = get_current_user(
                authorization="Bearer real.jwt.token",
                x_user_role="ENTERPRISE_ARCHITECT",
                x_user_id="evil-attacker",
                x_tenant_id="tenant-forged-99",
            )
        assert session.user_id == "bob"                     # Derived from token, not forged header
        assert session.role == UserRole.INVESTOR            # Derived from token, not forged header
        assert session.tenant_id == "tenant-beta"           # Derived from token, not forged header

        # Token with invalid role falls back to CITIZEN_WORKER
        with patch("google.oauth2.id_token.verify_firebase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": "carol", "email": "carol@example.com", "role": "UNKNOWN_SUPER_ROLE", "tenant_id": "tenant-gamma"
            }
            session_invalid_role = get_current_user(authorization="Bearer real.jwt.token")
        assert session_invalid_role.role == UserRole.CITIZEN_WORKER

        with pytest.raises(HTTPException) as exc_mock:
            get_current_user(authorization="Bearer fb-jwt-enterprise_architect-demo")
        assert exc_mock.value.status_code == 401
        assert "Synthetic tokens are disabled" in exc_mock.value.detail

    finally:
        settings.auth_dev_mode = orig_mode


def test_production_auth_invariant_raises_runtime_error():
    """Verify Settings model validator strictly enforces auth_dev_mode=False in production."""
    with pytest.raises(RuntimeError) as exc_info:
        Settings(environment="production", auth_dev_mode=True)
    assert "AUTH_DEV_MODE must be false in production" in str(exc_info.value)

    # When auth_dev_mode is explicitly set to False, production settings instantiate cleanly
    prod_settings = Settings(environment="production", auth_dev_mode=False)
    assert prod_settings.environment == "production"
    assert prod_settings.auth_dev_mode is False


def test_worktwin_cross_tenant_isolation_in_service():
    """Verify WorkTwinService hides cross-tenant resources with ResourceNotFoundException."""
    svc = WorkTwinService()

    # Create twin for Tenant A
    twin_a = svc.create_role_twin(
        tenant_id="tenant-alpha",
        role_archetype="Alpha Inspector",
        declared_purpose="Inspection for tenant alpha",
        skills=["Skill A"],
    )

    # Tenant A can read
    manifest = svc.get_manifest(twin_a.twin_id, tenant_id="tenant-alpha")
    assert manifest.twin_id == twin_a.twin_id

    # Tenant B attempting to read Tenant A's twin -> 404 ResourceNotFoundException
    with pytest.raises(ResourceNotFoundException) as exc_info:
        svc.get_manifest(twin_a.twin_id, tenant_id="tenant-beta")
    assert "not found" in str(exc_info.value)

    # Lifecycle methods enforce tenant isolation
    with pytest.raises(ResourceNotFoundException):
        svc.suspend_twin(twin_a.twin_id, tenant_id="tenant-beta")
    with pytest.raises(ResourceNotFoundException):
        svc.reactivate_twin(twin_a.twin_id, tenant_id="tenant-beta")
    with pytest.raises(ResourceNotFoundException):
        svc.revoke_twin(twin_a.twin_id, tenant_id="tenant-beta")
    with pytest.raises(ResourceNotFoundException):
        svc.delete_twin(twin_a.twin_id, tenant_id="tenant-beta")
    with pytest.raises(ResourceNotFoundException):
        svc.export_manifest(twin_a.twin_id, tenant_id="tenant-beta")

    # Legitimate Tenant A lifecycle transitions
    suspended = svc.suspend_twin(twin_a.twin_id, tenant_id="tenant-alpha")
    assert suspended.status == TwinStatus.SUSPENDED

    reactivated = svc.reactivate_twin(twin_a.twin_id, tenant_id="tenant-alpha")
    assert reactivated.status == TwinStatus.ACTIVE

    revoked = svc.revoke_twin(twin_a.twin_id, tenant_id="tenant-alpha")
    assert revoked.status == TwinStatus.REVOKED

    export_data = svc.export_manifest(twin_a.twin_id, tenant_id="tenant-alpha")
    assert "sha256_hash" in export_data
    assert export_data["governance_status"] == "VERIFIED_TAMPER_EVIDENT_EXPORT"

    delete_res = svc.delete_twin(twin_a.twin_id, tenant_id="tenant-alpha")
    assert delete_res["status"] == "DELETED"


def test_worktwin_router_lifecycle_endpoints():
    """Verify HTTP endpoints for WorkTwin lifecycle operations."""
    headers = {"X-User-Role": "ENTERPRISE_ARCHITECT"}
    # List manifests
    res = client.get("/api/worktwins/manifests")
    assert res.status_code == 200
    twin_id = res.json()[0]["twin_id"]

    # Suspend
    sus_res = client.post(f"/api/worktwins/manifests/{twin_id}/suspend", headers=headers)
    assert sus_res.status_code == 200
    assert sus_res.json()["status"] == "SUSPENDED"

    # Reactivate
    react_res = client.post(f"/api/worktwins/manifests/{twin_id}/reactivate", headers=headers)
    assert react_res.status_code == 200
    assert react_res.json()["status"] == "ACTIVE"

    # Export
    exp_res = client.get(f"/api/worktwins/manifests/{twin_id}/export")
    assert exp_res.status_code == 200
    assert "sha256_hash" in exp_res.json()

    # Revoke
    rev_res = client.post(f"/api/worktwins/manifests/{twin_id}/revoke", headers=headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVOKED"

    # Create temporary twin to delete
    create_res = client.post(
        "/api/worktwins/manifests",
        json={"role_archetype": "Temp Role", "declared_purpose": "Testing deletion", "skills": ["Temp"]},
        headers=headers,
    )
    assert create_res.status_code == 201
    temp_id = create_res.json()["twin_id"]

    # Delete
    del_res = client.delete(f"/api/worktwins/manifests/{temp_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "DELETED"


def test_production_mode_worktwin_security_gates():
    """Verify production security gates for RoleTwin creation and consent ownership."""
    orig_mode = settings.auth_dev_mode
    try:
        settings.auth_dev_mode = False

        # Citizen worker cannot create RoleTwin in production -> 403
        bad_create = client.post(
            "/api/worktwins/manifests",
            json={"role_archetype": "Unauthorized Role", "declared_purpose": "Test", "skills": []},
            headers={"Authorization": "Bearer test-token:citizen-01:CITIZEN_WORKER:tenant-food-mfg-01"},
        )
        assert bad_create.status_code == 403
        assert "FORBIDDEN_INSUFFICIENT_ROLE" in bad_create.json()["detail"]

        # Enterprise Architect can create RoleTwin in production
        good_create = client.post(
            "/api/worktwins/manifests",
            json={"role_archetype": "Architect Approved Twin", "declared_purpose": "Approved role", "skills": ["Architecture"]},
            headers={"Authorization": "Bearer test-token:arch-01:ENTERPRISE_ARCHITECT:tenant-food-mfg-01"},
        )
        assert good_create.status_code == 201

        # Employee A cannot modify Employee B consent in production -> 403
        bad_consent = client.post(
            "/api/worktwins/personal/consent",
            json={
                "employee_id": "EMP-VICTIM-99",
                "knowledge_consent": True,
                "writing_style_consent": True,
                "delegated_task_consent": True,
                "voice_avatar_consent": False,
                "revoked": False,
                "consent_timestamp": "2026-10-16T12:00:00Z",
            },
            headers={"Authorization": "Bearer test-token:emp-attacker-01:CITIZEN_WORKER:tenant-food-mfg-01"},
        )
        assert bad_consent.status_code == 403
        assert "FORBIDDEN_OWNERSHIP_MISMATCH" in bad_consent.json()["detail"]

        # Attempting voice_avatar_consent=True in production -> 400
        voice_consent = client.post(
            "/api/worktwins/personal/consent",
            json={
                "employee_id": "emp-valid-01",
                "knowledge_consent": True,
                "writing_style_consent": True,
                "delegated_task_consent": True,
                "voice_avatar_consent": True,  # Prohibited
                "revoked": False,
                "consent_timestamp": "2026-10-16T12:00:00Z",
            },
            headers={"Authorization": "Bearer test-token:emp-valid-01:CITIZEN_WORKER:tenant-food-mfg-01"},
        )
        assert voice_consent.status_code == 400
        assert "ERR_VOICE_AVATAR_PROHIBITED" in voice_consent.json()["detail"]

    finally:
        settings.auth_dev_mode = orig_mode


def test_boardroom_proposal_differentiation_and_evidence_spans():
    """Verify that different proposals produce materially different deliberations and citation spans."""
    req_food = BoardroomSimulationRequest(
        proposal_title="Autonomous Packaging Quality Corridors",
        proposal_description="Install computer vision edge sensors on Line 3 conveyor to inspect sealed packages.",
        sector="food_manufacturing",
        target_enterprise="Nestle Processing Facility",
    )
    result_food = worktwin_service.simulate_future_boardroom(req_food)
    assert result_food.perspectives[0].role.value == "CEO"
    assert "EVD-FOOD-001" in result_food.perspectives[0].cited_evidence_ids
    assert result_food.perspectives[0].support_status == "SUPPORTED"
    assert len(result_food.perspectives[0].source_spans) > 0

    # Ungrounded proposal with absurd claims
    req_ungrounded = BoardroomSimulationRequest(
        proposal_title="Magical Full Replacement",
        proposal_description="Unsupported magic AI to replace all humans instantly.",
        sector="general",
        target_enterprise="Fantasy Corp",
    )
    result_ungrounded = worktwin_service.simulate_future_boardroom(req_ungrounded)
    ceo_ungrounded = result_ungrounded.perspectives[0]
    assert ceo_ungrounded.stance == "CAUTIOUS"
    assert ceo_ungrounded.support_status == "INSUFFICIENT_EVIDENCE"
    assert ceo_ungrounded.confidence_score < 0.80

    # Red-line violation (terminating employees) raises 400 PolicyViolationException
    req_redline = BoardroomSimulationRequest(
        proposal_title="Automated Termination Swarm",
        proposal_description="Rank workers to fire employees automatically.",
        sector="general",
    )
    with pytest.raises(PolicyViolationException):
        worktwin_service.simulate_future_boardroom(req_redline)


def test_rbac_token_without_role_in_production():
    """Verify fallback to CITIZEN_WORKER when token has no role claim in production."""
    orig_mode = settings.auth_dev_mode
    try:
        settings.auth_dev_mode = False
        with patch("google.oauth2.id_token.verify_firebase_token") as mock_verify:
            mock_verify.return_value = {
                "sub": "uid-norole-01",
                "email": "norole@tenant.local",
                "tenant_id": "tenant-food-mfg-01",
            }
            user = get_current_user(authorization="Bearer valid.token.norole")
            assert user.role == UserRole.CITIZEN_WORKER
    finally:
        settings.auth_dev_mode = orig_mode


def test_worktwin_revoke_cascades_to_owner_consent():
    """Verify revoking a WorkTwin also revokes any associated personal consent."""
    svc = WorkTwinService()
    manifest = svc.register_personal_twin_consent(
        PersonalWorkTwinConsent(
            employee_id="emp-cascade-01",
            knowledge_consent=True,
            writing_style_consent=True,
            delegated_task_consent=True,
            voice_avatar_consent=False,
            revoked=False,
            consent_timestamp="2026-10-16T12:00:00Z",
        )
    )
    assert manifest.status == TwinStatus.ACTIVE

    # Revoke twin
    revoked_twin = svc.revoke_twin(manifest.twin_id, tenant_id=manifest.tenant_id)
    assert revoked_twin.status == TwinStatus.REVOKED
    # Assert owner's consent in _consents is now revoked
    assert svc._consents["emp-cascade-01"].revoked is True

