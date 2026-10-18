"""Google Cloud Secret Manager (google.cloud.secretmanager) adapter for enterprise runtime credentials."""

import logging
import os
from typing import Any, Dict, Optional

try:
    from google.cloud import secretmanager
except (ImportError, AttributeError):
    secretmanager = None  # type: ignore[assignment]

from app.core.config import settings

logger = logging.getLogger("futurasculpt.secret_manager_adapter")


class SecretManagerAdapter:
    """Manages secret retrieval and rotation from Google Cloud Secret Manager."""

    def __init__(self, project_id: Optional[str] = None):
        """Initialize the Secret Manager adapter.

        Args:
            project_id: Target GCP project identifier.
        """
        self.project_id = project_id or settings.gcp_project_id
        self.mock_mode = settings.mock_llm_mode
        self._local_secrets: Dict[str, str] = {}
        self._client: Optional[Any] = None

    def _get_client(self) -> Optional[Any]:
        """Lazy load and memoize the Secret Manager service client."""
        if self.mock_mode or secretmanager is None:
            return None
        if self._client is None:
            try:
                self._client = secretmanager.SecretManagerServiceClient()
            except Exception as exc:
                logger.warning("Secret Manager client initialization failed; using env fallback: %s", exc)
                return None
        return self._client

    def get_secret(self, secret_id: str, default: Optional[str] = None) -> Optional[str]:
        """Retrieve latest secret payload by secret_id.

        Args:
            secret_id: Secret name identifier (e.g., 'futurasculpt-session-secret').
            default: Fallback value if secret cannot be retrieved.

        Returns:
            Optional[str]: Decoded secret string value or default.
        """
        # 1. Check local cache
        if secret_id in self._local_secrets:
            return self._local_secrets[secret_id]

        # 2. Check environment variable alias (e.g. FUTURASCULPT_SESSION_SECRET)
        env_alias = secret_id.replace("-", "_").upper()
        if env_alias in os.environ:
            return os.environ[env_alias]

        # 3. Fetch from GCP Secret Manager
        client = self._get_client()
        if client is not None:
            try:
                name = f"projects/{self.project_id}/secrets/{secret_id}/versions/latest"
                response = client.access_secret_version(request={"name": name})
                payload = response.payload.data.decode("utf-8")
                self._local_secrets[secret_id] = payload
                return payload
            except Exception as exc:
                logger.warning("Failed to access secret %s from Secret Manager: %s", secret_id, exc)

        return default

    def set_secret(self, secret_id: str, secret_value: str) -> bool:
        """Store or update a secret version in Secret Manager or local store.

        Args:
            secret_id: Secret name identifier.
            secret_value: Secret payload string.

        Returns:
            bool: True if created/added, False otherwise.
        """
        self._local_secrets[secret_id] = secret_value

        client = self._get_client()
        if client is not None:
            try:
                parent = f"projects/{self.project_id}/secrets/{secret_id}"
                client.add_secret_version(
                    request={
                        "parent": parent,
                        "payload": {"data": secret_value.encode("utf-8")},
                    }
                )
                return True
            except Exception as exc:
                logger.warning("Failed to add secret version to Secret Manager for %s: %s", secret_id, exc)
                return False

        return True


secret_manager_adapter = SecretManagerAdapter()
