"""Google Cloud Storage (google.cloud.storage) adapter for multimodal evidence envelopes and audit artifacts."""

import logging
from typing import Dict, Optional

from google.cloud import storage

from app.core.config import settings

logger = logging.getLogger("futurasculpt.storage_adapter")


class StorageAdapter:
    """Manages object storage in Google Cloud Storage with fallback for local and mock execution."""

    def __init__(self, bucket_name: Optional[str] = None, project_id: Optional[str] = None):
        """Initialize the Cloud Storage adapter.

        Args:
            bucket_name: Target GCS bucket name.
            project_id: Target GCP project identifier.
        """
        self.bucket_name = bucket_name or settings.evidence_bucket
        self.project_id = project_id or settings.gcp_project_id
        self.mock_mode = settings.mock_llm_mode
        self._local_blob_store: Dict[str, bytes] = {}
        self._client: Optional[storage.Client] = None

    def _get_client(self) -> Optional[storage.Client]:
        """Lazy load and memoize the Google Cloud Storage client."""
        if self.mock_mode:
            return None
        if self._client is None:
            try:
                self._client = storage.Client(project=self.project_id)
            except Exception as exc:
                logger.warning("GCS client initialization failed; using local fallback: %s", exc)
                return None
        return self._client

    def upload_evidence_blob(
        self,
        tenant_id: str,
        file_name: str,
        file_bytes: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload an evidence file blob to GCS bucket under tenant path.

        Args:
            tenant_id: Tenant identifier for tenant isolation.
            file_name: Name of the uploaded artifact.
            file_bytes: Raw binary content.
            content_type: MIME content type.

        Returns:
            str: Canonical gs:// URI for the stored blob.
        """
        blob_path = f"{tenant_id}/{file_name}"
        canonical_uri = f"gs://{self.bucket_name}/{blob_path}"

        client = self._get_client()
        if client is not None:
            try:
                bucket = client.bucket(self.bucket_name)
                blob = bucket.blob(blob_path)
                blob.upload_from_string(file_bytes, content_type=content_type)
                logger.info("Uploaded evidence blob to %s", canonical_uri)
                return canonical_uri
            except Exception as exc:
                logger.warning("Failed GCS upload to %s; persisting to local fallback: %s", canonical_uri, exc)

        # Fallback to in-memory store
        self._local_blob_store[canonical_uri] = file_bytes
        return canonical_uri

    def get_evidence_blob(self, tenant_id: str, file_name: str) -> Optional[bytes]:
        """Retrieve evidence file blob bytes from GCS or local store.

        Args:
            tenant_id: Tenant identifier.
            file_name: File name to retrieve.

        Returns:
            Optional[bytes]: Raw binary content if found, else None.
        """
        blob_path = f"{tenant_id}/{file_name}"
        canonical_uri = f"gs://{self.bucket_name}/{blob_path}"

        client = self._get_client()
        if client is not None:
            try:
                bucket = client.bucket(self.bucket_name)
                blob = bucket.blob(blob_path)
                if blob.exists():
                    return blob.download_as_bytes()
            except Exception as exc:
                logger.warning("Failed GCS download from %s: %s", canonical_uri, exc)

        return self._local_blob_store.get(canonical_uri)

    def delete_evidence_blob(self, tenant_id: str, file_name: str) -> bool:
        """Delete an evidence artifact from GCS or local store.

        Args:
            tenant_id: Tenant identifier.
            file_name: File name to delete.

        Returns:
            bool: True if deleted or non-existent, False on error.
        """
        blob_path = f"{tenant_id}/{file_name}"
        canonical_uri = f"gs://{self.bucket_name}/{blob_path}"

        client = self._get_client()
        if client is not None:
            try:
                bucket = client.bucket(self.bucket_name)
                blob = bucket.blob(blob_path)
                if blob.exists():
                    blob.delete()
                return True
            except Exception as exc:
                logger.warning("Failed GCS deletion from %s: %s", canonical_uri, exc)
                return False

        self._local_blob_store.pop(canonical_uri, None)
        return True


storage_adapter = StorageAdapter()
