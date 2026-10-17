"""Unit tests for WorkTwin, Consent, and Boardroom persistence repositories."""

import sys
from unittest.mock import MagicMock, patch

from app.models.worktwin import (
    AutonomyLevel,
    BoardroomSimulationResult,
    ConflictResolution,
    PersonalWorkTwinConsent,
    TwinStatus,
    TwinType,
    WorkTwinManifest,
)
from app.repositories.worktwin_repository import (
    FirestoreBoardroomRunRepository,
    FirestoreConsentRepository,
    FirestoreWorkTwinRepository,
    InMemoryBoardroomRunRepository,
    InMemoryConsentRepository,
    InMemoryWorkTwinRepository,
    get_boardroom_run_repository,
    get_consent_repository,
    get_worktwin_repository,
)


def _sample_manifest(twin_id: str = "twin-test-01", tenant_id: str = "tenant-test") -> WorkTwinManifest:
    return WorkTwinManifest(
        twin_id=twin_id,
        tenant_id=tenant_id,
        twin_type=TwinType.ROLE_TWIN,
        role_archetype="Test Specialist",
        declared_purpose="For testing repositories",
        autonomy_level=AutonomyLevel.WT1_ASSIST,
        status=TwinStatus.ACTIVE,
        skills=["Skill A"],
        allowed_tools=["tool_a"],
        created_at="2026-10-16T12:00:00Z",
    )


def _sample_consent(employee_id: str = "EMP-9001", tenant_id: str = "tenant-test") -> PersonalWorkTwinConsent:
    return PersonalWorkTwinConsent(
        employee_id=employee_id,
        tenant_id=tenant_id,
        knowledge_consent=True,
        writing_style_consent=True,
        delegated_task_consent=True,
        voice_avatar_consent=False,
        revoked=False,
        consent_timestamp="2026-10-16T12:00:00Z",
    )


def _sample_simulation(sim_id: str = "sim-9001") -> BoardroomSimulationResult:
    return BoardroomSimulationResult(
        simulation_id=sim_id,
        proposal_title="Test Transformation Proposal",
        proposal_description="Evaluating simulation persistence",
        sector="food_manufacturing",
        target_enterprise="Test Org",
        perspectives=[],
        conflict_resolution=ConflictResolution(
            consensus_points=["Agreement on safety"],
            unresolved_disagreements=["Disagreement on rollout"],
            disagreements=["Disagreement on rollout"],
            value_risk_tradeoffs=["Speed vs safety"],
            blocking_controls=["Worker council veto"],
            alternative_transformation_paths=["Option A"],
            recommended_human_decision_makers=["Plant Manager"],
            governed_recommendation="Approve pilot",
        ),
        trace_id="trace-test-1234",
        model_route="gemini-3.8-pro",
        total_cost_usd=0.002,
        audit_verdict="PASSED",
    )


def test_in_memory_worktwin_repository():
    """Verify in-memory repository handles get, list, save, delete within tenant boundaries."""
    repo = InMemoryWorkTwinRepository()
    manifest_a = _sample_manifest("twin-a", "tenant-alpha")
    manifest_b = _sample_manifest("twin-b", "tenant-beta")

    repo.save(manifest_a)
    repo.save(manifest_b)

    # Tenant alpha can get twin-a
    assert repo.get("twin-a", "tenant-alpha") == manifest_a

    # Tenant beta cannot get twin-a (cross-tenant isolation)
    assert repo.get("twin-a", "tenant-beta") is None

    # Listing by tenant
    assert repo.list("tenant-alpha") == [manifest_a]
    assert repo.list("tenant-beta") == [manifest_b]
    assert repo.list("tenant-gamma") == []

    # Deleting twin-a by tenant-beta fails
    assert repo.delete("twin-a", "tenant-beta") is False
    assert repo.get("twin-a", "tenant-alpha") is not None

    # Deleting twin-a by tenant-alpha succeeds
    assert repo.delete("twin-a", "tenant-alpha") is True
    assert repo.get("twin-a", "tenant-alpha") is None


def test_in_memory_consent_repository():
    """Verify in-memory consent repository saves and retrieves employee consent contracts."""
    repo = InMemoryConsentRepository()
    consent = _sample_consent("EMP-100", "tenant-alpha")

    repo.save(consent)
    retrieved = repo.get("EMP-100", "tenant-alpha")
    assert retrieved is not None
    assert retrieved.employee_id == "EMP-100"
    assert repo.get("EMP-100", "tenant-beta") is None


def test_in_memory_boardroom_run_repository():
    """Verify in-memory boardroom run repository records and retrieves simulation results."""
    repo = InMemoryBoardroomRunRepository()
    sim = _sample_simulation("sim-alpha")

    repo.save_simulation(sim)
    retrieved = repo.get_simulation("sim-alpha")
    assert retrieved is not None
    assert retrieved.simulation_id == "sim-alpha"
    assert repo.get_simulation("sim-nonexistent") is None


def test_firestore_client_initialization_mocked():
    """Verify Firestore repositories connect when google.cloud.firestore is available."""
    mock_firestore = MagicMock()
    mock_firestore.Client.return_value = MagicMock()

    with patch.dict(sys.modules, {"google.cloud.firestore": mock_firestore}), patch("google.cloud.firestore", mock_firestore, create=True):
        r1 = FirestoreWorkTwinRepository()
        assert r1._client is not None

        r2 = FirestoreConsentRepository()
        assert r2._client is not None

        r3 = FirestoreBoardroomRunRepository()
        assert r3._client is not None


def test_firestore_worktwin_repository_operations():
    """Verify Firestore repository methods with mocked client and fallbacks."""
    repo = FirestoreWorkTwinRepository(project_id="genai-apac-2026-491004")
    manifest = _sample_manifest("twin-fs-1", "tenant-alpha")

    # When client is None (fallback mode)
    repo._client = None
    saved = repo.save(manifest)
    assert saved.twin_id == "twin-fs-1"
    assert repo.get("twin-fs-1", "tenant-alpha") is not None
    assert len(repo.list("tenant-alpha")) == 1
    assert repo.delete("twin-fs-1", "tenant-alpha") is True

    # When client is mocked
    mock_client = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = manifest.model_dump()
    mock_coll = MagicMock()
    mock_coll.document.return_value.get.return_value = mock_doc
    mock_coll.where.return_value.stream.return_value = [mock_doc]
    mock_client.collection.return_value = mock_coll
    repo._client = mock_client

    assert repo.get("twin-fs-1", "tenant-alpha") is not None
    assert len(repo.list("tenant-alpha")) == 1
    assert repo.save(manifest) == manifest
    assert repo.delete("twin-fs-1", "tenant-alpha") is True

    # Unknown ID error handling paths
    mock_coll.document.return_value.get.side_effect = Exception("Firestore read error")
    assert repo.get("twin-fs-unknown", "tenant-alpha") is None

    mock_coll.where.side_effect = Exception("Firestore query error")
    assert repo.list("tenant-alpha") == []

    mock_coll.document.return_value.set.side_effect = Exception("Firestore write error")
    assert repo.save(manifest) == manifest

    mock_coll.document.return_value.get.side_effect = Exception("Firestore delete error")
    assert repo.delete("twin-fs-unknown", "tenant-alpha") is False


def test_firestore_consent_repository_operations():
    """Verify Firestore consent repository methods with mocked client."""
    repo = FirestoreConsentRepository(project_id="genai-apac-2026-491004")
    consent = _sample_consent("EMP-888", "tenant-alpha")

    # Fallback mode
    repo._client = None
    repo.save(consent)
    assert repo.get("EMP-888", "tenant-alpha") is not None

    # Mock client mode
    mock_client = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = consent.model_dump()
    mock_client.collection.return_value.document.return_value.get.return_value = mock_doc
    repo._client = mock_client

    assert repo.get("EMP-888", "tenant-alpha") is not None
    assert repo.save(consent) == consent

    # Error handling paths
    mock_client.collection.return_value.document.return_value.get.side_effect = Exception("Read error")
    assert repo.get("EMP-888", "tenant-alpha") is not None

    mock_client.collection.return_value.document.return_value.set.side_effect = Exception("Write error")
    assert repo.save(consent) == consent


def test_firestore_boardroom_run_repository_operations():
    """Verify Firestore boardroom run repository methods with mocked client."""
    repo = FirestoreBoardroomRunRepository(project_id="genai-apac-2026-491004")
    sim = _sample_simulation("sim-fs-1")

    # Fallback mode
    repo._client = None
    repo.save_simulation(sim)
    assert repo.get_simulation("sim-fs-1") is not None

    # Mock client mode
    mock_client = MagicMock()
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = sim.model_dump()
    mock_client.collection.return_value.document.return_value.get.return_value = mock_doc
    repo._client = mock_client

    assert repo.get_simulation("sim-fs-1") is not None
    assert repo.save_simulation(sim) == sim

    # Error handling paths
    mock_client.collection.return_value.document.return_value.get.side_effect = Exception("Get error")
    assert repo.get_simulation("sim-fs-1") is not None

    mock_client.collection.return_value.document.return_value.set.side_effect = Exception("Set error")
    assert repo.save_simulation(sim) == sim


def test_repository_factories():
    """Verify repository factory functions return valid repository instances."""
    twin_repo = get_worktwin_repository()
    assert isinstance(twin_repo, FirestoreWorkTwinRepository)

    consent_repo = get_consent_repository()
    assert isinstance(consent_repo, FirestoreConsentRepository)

    boardroom_repo = get_boardroom_run_repository()
    assert isinstance(boardroom_repo, FirestoreBoardroomRunRepository)
