"""Unit tests to reach 100% statement and branch coverage across tenant, health, and repository modules."""

import sys
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.core.rbac import UserRole, UserSession
from app.core.tenant import get_current_tenant_id
from app.repositories.worktwin_repository import (
    FirestoreBoardroomRunRepository,
    FirestoreConsentRepository,
    FirestoreWorkTwinRepository,
)
from app.routers.health import readiness_probe


def test_tenant_prod_mode_missing_token_tenant():
    """Verify HTTP 403 is raised in production mode when token lacks tenant claim."""
    user = UserSession(user_id="u1", email="u1@test.com", display_name="U1", role=UserRole.ENTERPRISE_ARCHITECT, tenant_id="")
    with patch.object(settings, "auth_dev_mode", False):
        with pytest.raises(HTTPException) as exc_info:
            get_current_tenant_id(x_tenant_id=None, current_user=user)
        assert exc_info.value.status_code == 403
        assert "ERR_MISSING_TENANT_CLAIM" in exc_info.value.detail


def test_tenant_prod_mode_tenant_mismatch():
    """Verify HTTP 403 is raised in production mode when header differs from token."""
    user = UserSession(user_id="u1", email="u1@test.com", display_name="U1", role=UserRole.ENTERPRISE_ARCHITECT, tenant_id="tenant-prod-a")
    with patch.object(settings, "auth_dev_mode", False):
        with pytest.raises(HTTPException) as exc_info:
            get_current_tenant_id(x_tenant_id="tenant-prod-b", current_user=user)
        assert exc_info.value.status_code == 403
        assert "ERR_TENANT_MISMATCH" in exc_info.value.detail


def test_tenant_prod_mode_success():
    """Verify valid token tenant is returned in production mode."""
    user = UserSession(user_id="u1", email="u1@test.com", display_name="U1", role=UserRole.ENTERPRISE_ARCHITECT, tenant_id="tenant-prod-a")
    with patch.object(settings, "auth_dev_mode", False):
        resolved = get_current_tenant_id(x_tenant_id="tenant-prod-a", current_user=user)
        assert resolved == "tenant-prod-a"


def test_tenant_dev_mode_mismatch_non_default():
    """Verify HTTP 403 in dev mode when header and token conflict on non-default tenant."""
    user = UserSession(user_id="u1", email="u1@test.com", display_name="U1", role=UserRole.ENTERPRISE_ARCHITECT, tenant_id="tenant-a")
    with patch.object(settings, "auth_dev_mode", True):
        with patch.object(settings, "default_tenant_id", "tenant-default"):
            with pytest.raises(HTTPException) as exc_info:
                get_current_tenant_id(x_tenant_id="tenant-b", current_user=user)
            assert exc_info.value.status_code == 403
            assert "ERR_TENANT_MISMATCH" in exc_info.value.detail


def test_tenant_empty_fallback():
    """Verify HTTP 400 when resolved tenant is completely empty."""
    user = UserSession(user_id="u1", email="u1@test.com", display_name="U1", role=UserRole.ENTERPRISE_ARCHITECT, tenant_id="   ")
    with patch.object(settings, "auth_dev_mode", True):
        with patch.object(settings, "default_tenant_id", "   "):
            with pytest.raises(HTTPException) as exc_info:
                get_current_tenant_id(x_tenant_id=None, current_user=user)
            assert exc_info.value.status_code == 400


def test_health_readiness_exceptions_and_production_fail_closed():
    """Verify readiness probe fails closed with HTTP 503 in production when dependencies are degraded."""
    with patch.object(settings, "environment", "production"):
        with pytest.raises(HTTPException) as exc_info:
            readiness_probe()
        assert exc_info.value.status_code == 503
        assert exc_info.value.detail["status"] == "UNHEALTHY"
        assert exc_info.value.detail["subsystems"]["firestore"] == "DEGRADED"


def test_firestore_worktwin_repo_init_exception():
    """Verify FirestoreWorkTwinRepository gracefully falls back when Client constructor raises."""
    mock_firestore = MagicMock()
    mock_firestore.Client.side_effect = RuntimeError("GCP connection timeout")

    with patch.dict(sys.modules, {"google.cloud.firestore": mock_firestore}), patch("google.cloud.firestore", mock_firestore, create=True):
        repo = FirestoreWorkTwinRepository()
        assert repo._client is None


def test_firestore_consent_repo_init_exception():
    """Verify FirestoreConsentRepository gracefully falls back when Client constructor raises."""
    mock_firestore = MagicMock()
    mock_firestore.Client.side_effect = RuntimeError("Consent connection failure")

    with patch.dict(sys.modules, {"google.cloud.firestore": mock_firestore}), patch("google.cloud.firestore", mock_firestore, create=True):
        repo = FirestoreConsentRepository()
        assert repo._client is None


def test_firestore_boardroom_repo_init_exception():
    """Verify FirestoreBoardroomRunRepository gracefully falls back when Client constructor raises."""
    mock_firestore = MagicMock()
    mock_firestore.Client.side_effect = RuntimeError("Boardroom connection failure")

    with patch.dict(sys.modules, {"google.cloud.firestore": mock_firestore}), patch("google.cloud.firestore", mock_firestore, create=True):
        repo = FirestoreBoardroomRunRepository()
        assert repo._client is None


def test_workgraph_vault_ledger_route():
    """Verify /api/v1/workgraph/vault/ledger endpoint returns BigQuery ledger."""
    from app.routers.workgraph import get_vault_ledger

    res = get_vault_ledger(horizon_year=0, tenant_id="tenant-food-mfg-01")
    assert "nodes" in res
    assert "source" in res


def test_bigquery_adapter_outcome_query_failure():
    """Verify BigQuery adapter graceful degradation when outcome query fails."""
    from app.adapters.bigquery_adapter import BigQueryAdapter

    adapter = BigQueryAdapter(project_id="test-proj", dataset_id="test_vault")
    adapter.mock_mode = False

    mock_client = MagicMock()
    mock_nodes_job = MagicMock()
    mock_nodes_job.result.return_value = [{"node_id": "TSK-001"}]

    def mock_query(q, job_config=None):
        if "outcome_ledger" in q:
            raise RuntimeError("Outcome table unavailable")
        return mock_nodes_job

    mock_client.query.side_effect = mock_query
    adapter._client = mock_client

    res = adapter.query_workgraph_ledger("tenant-x", horizon_year=0)
    assert res["source"] == "bigquery"
    assert res["outcomes"] == []
    assert len(res["nodes"]) == 1


def test_firestore_repos_mock_mode_active():
    """Verify Firestore repositories fast-path when mock_llm_mode is True and Client is unmocked."""
    class DummyClient:
        pass

    mock_fs = MagicMock()
    mock_fs.Client = DummyClient

    with patch.dict(sys.modules, {"google.cloud.firestore": mock_fs}), patch("google.cloud.firestore", mock_fs, create=True):
        with patch.object(settings, "mock_llm_mode", True):
            repo1 = FirestoreWorkTwinRepository()
            assert repo1._client is None

            repo2 = FirestoreConsentRepository()
            assert repo2._client is None

            repo3 = FirestoreBoardroomRunRepository()
            assert repo3._client is None




