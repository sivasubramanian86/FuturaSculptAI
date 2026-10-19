"""Unit tests for Futura WorkTwin Fabric service and domain models."""

import pytest

from app.core.exceptions import PolicyViolationException, ResourceNotFoundException
from app.models.worktwin import (
    AutonomyLevel,
    BoardroomSimulationRequest,
    ExecutivePersona,
    PersonalWorkTwinConsent,
    TwinStatus,
    TwinType,
    WorkTwinManifest,
)
from app.services.worktwin_service import WorkTwinService


def test_worktwin_manifest_defaults_and_validation():
    """Verify default values and validation of WorkTwinManifest contract."""
    manifest = WorkTwinManifest(
        twin_id="twin-test-01",
        tenant_id="tenant-food-mfg-01",
        role_archetype="Plant Electrician",
        declared_purpose="High-voltage maintenance simulation and telemetry checks.",
        created_at="2026-10-16T00:00:00Z",
    )
    assert manifest.twin_type == TwinType.ROLE_TWIN
    assert manifest.autonomy_level == AutonomyLevel.WT2_SIMULATE
    assert manifest.status == TwinStatus.ACTIVE
    assert "Synthetic Role Archetype" in manifest.disclosure_text
    assert manifest.owner_id is None


def test_worktwin_service_seeding_and_retrieval():
    """Verify WorkTwinService seeds canonical archetypes and retrieves manifests."""
    svc = WorkTwinService()
    manifests = svc.list_manifests("tenant-food-mfg-01")
    assert len(manifests) == 8

    roles = {m.role_archetype for m in manifests}
    assert "Quality Inspector Role Twin" in roles
    assert "Plant Manager Role Twin" in roles
    assert "AI Quality Supervisor Future-Role Twin" in roles
    assert "CTO Role Twin" in roles
    assert "CFO Role Twin" in roles
    assert "CHRO Role Twin" in roles
    assert "CISO Role Twin" in roles
    assert "Employee Advocate Twin" in roles

    # Specific retrieval
    cto_twin = svc.get_manifest("twin-role-cto")
    assert cto_twin.role_archetype == "CTO Role Twin"
    assert cto_twin.model_tier == "deep_reasoning"

    # Non-existent ID raises ResourceNotFoundException 404
    with pytest.raises(ResourceNotFoundException) as exc_info:
        svc.get_manifest("twin-unknown-xyz")
    assert exc_info.value.status_code == 404


def test_worktwin_create_custom_role_twin():
    """Verify custom RoleTwin creation and guardrails."""
    svc = WorkTwinService()
    new_twin = svc.create_role_twin(
        tenant_id="tenant-food-mfg-01",
        role_archetype="Cobotics Calibration Specialist",
        declared_purpose="Calibrate packaging robotic arms and inspect safety barriers.",
        skills=["Robotic Joint Calibration", "Light Curtain Safety", "Emergency Stop Audit"],
        autonomy_level=AutonomyLevel.WT3_PREPARE,
    )
    assert new_twin.twin_id.startswith("twin-role-")
    assert new_twin.autonomy_level == AutonomyLevel.WT3_PREPARE
    assert len(new_twin.skills) == 3

    # Guardrail: WT5 Consequential is strictly prohibited
    with pytest.raises(PolicyViolationException) as exc_info:
        svc.create_role_twin(
            tenant_id="tenant-food-mfg-01",
            role_archetype="Disciplinary Bot",
            declared_purpose="Enforce punitive measures.",
            skills=["Firing"],
            autonomy_level=AutonomyLevel.WT5_CONSEQUENTIAL,
        )
    assert exc_info.value.status_code == 403
    assert "WT5_CONSEQUENTIAL is strictly prohibited" in str(exc_info.value)


def test_personal_worktwin_consent_and_voice_clone_prohibition():
    """Verify PersonalWorkTwin consent boundaries and mandatory voice/avatar clone denial."""
    svc = WorkTwinService()

    # Employee attempts to enable voice/avatar replication
    consent = PersonalWorkTwinConsent(
        employee_id="EMP-9021",
        tenant_id="tenant-food-mfg-01",
        knowledge_consent=True,
        writing_style_consent=True,
        delegated_task_consent=True,
        voice_avatar_consent=True,  # Attempting prohibited capability
        consent_timestamp="2026-10-16T10:00:00Z",
    )
    manifest = svc.register_personal_twin_consent(consent)
    assert manifest.twin_type == TwinType.PERSONAL_WORKTWIN
    assert manifest.owner_id == "EMP-9021"
    assert manifest.status == TwinStatus.ACTIVE
    # Voice avatar consent must be overridden to False per EU AI Act & policy
    assert consent.voice_avatar_consent is False

    # Revocation test
    revoked_consent = PersonalWorkTwinConsent(
        employee_id="EMP-9021",
        tenant_id="tenant-food-mfg-01",
        knowledge_consent=False,
        writing_style_consent=False,
        delegated_task_consent=False,
        voice_avatar_consent=False,
        revoked=True,
        consent_timestamp="2026-10-16T11:00:00Z",
    )
    revoked_manifest = svc.register_personal_twin_consent(revoked_consent)
    assert revoked_manifest.status == TwinStatus.REVOKED


def test_future_boardroom_simulation_and_conflict_resolution():
    """Verify multi-twin Future Boardroom simulation execution and consensus synthesis."""
    svc = WorkTwinService()
    req = BoardroomSimulationRequest(
        proposal_title="Autonomous Computer Vision & Cobotics Deployment",
        proposal_description="Deploy edge TPU cameras and robotic arm sorters to inspect food packaging containers.",
        sector="food_manufacturing",
        target_enterprise="Artisan Food Processing Group",
    )
    result = svc.simulate_future_boardroom(req)
    assert result.simulation_id.startswith("sim-boardroom-")
    assert len(result.perspectives) >= 6

    # Verify key perspectives present
    roles = {p.role for p in result.perspectives}
    assert ExecutivePersona.CEO in roles
    assert ExecutivePersona.CTO in roles
    assert ExecutivePersona.CFO in roles
    assert ExecutivePersona.CHRO in roles
    assert ExecutivePersona.CISO in roles
    assert ExecutivePersona.EMPLOYEE_ADVOCATE in roles

    # Verify conflict resolution details
    cr = result.conflict_resolution
    assert len(cr.consensus_points) >= 3
    assert len(cr.unresolved_disagreements) >= 2
    assert len(cr.blocking_controls) >= 2
    assert len(cr.alternative_transformation_paths) >= 2
    assert "APPROVE WITH CONDITIONS" in cr.governed_recommendation

    # Filtered participants
    filtered_req = BoardroomSimulationRequest(
        proposal_title="Edge Camera Pilot",
        proposal_description="Pilot edge cameras on Line 3 only.",
        participating_twins=[ExecutivePersona.CTO, ExecutivePersona.CISO],
    )
    filtered_res = svc.simulate_future_boardroom(filtered_req)
    assert len(filtered_res.perspectives) == 2
    assert {p.role for p in filtered_res.perspectives} == {ExecutivePersona.CTO, ExecutivePersona.CISO}


def test_future_boardroom_red_line_prohibition():
    """Verify attempt to simulate termination or mass firing is rejected."""
    svc = WorkTwinService()
    bad_req = BoardroomSimulationRequest(
        proposal_title="Headcount Reduction Strategy",
        proposal_description="Rank and terminate workers based on automation readiness scores.",
    )
    with pytest.raises(PolicyViolationException) as exc_info:
        svc.simulate_future_boardroom(bad_req)
    assert exc_info.value.status_code == 403
    assert "Red-line violation" in str(exc_info.value)


def test_worktwin_service_repository_properties():
    """Verify _manifests and _consents property accessors on in-memory and non-in-memory repos."""
    svc = WorkTwinService()
    assert len(svc._manifests) >= 8
    assert svc._consents == {}

    from unittest.mock import MagicMock
    from app.repositories.worktwin_repository import (
        FirestoreConsentRepository,
        FirestoreWorkTwinRepository,
        InMemoryConsentRepository,
        InMemoryWorkTwinRepository,
    )

    custom_svc = WorkTwinService(twin_repo=MagicMock(), consent_repo=MagicMock())
    assert custom_svc._manifests == {}
    assert custom_svc._consents == {}

    fs_twin_repo = FirestoreWorkTwinRepository(project_id="genai-apac-2026-491004")
    fs_consent_repo = FirestoreConsentRepository(project_id="genai-apac-2026-491004")
    fs_svc = WorkTwinService(twin_repo=fs_twin_repo, consent_repo=fs_consent_repo)
    assert len(fs_svc._manifests) >= 8
    assert fs_svc._consents == {}

