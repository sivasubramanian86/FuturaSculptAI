"""Durable WorkTwin, Consent, and Boardroom simulation repositories.

Supports InMemory storage for unit testing and local development, and
Google Cloud Firestore for multi-instance production scale.
"""

from abc import ABC, abstractmethod
import logging
from typing import Any, Dict, List, Optional

from app.models.worktwin import (
    BoardroomSimulationResult,
    PersonalWorkTwinConsent,
    WorkTwinManifest,
)

logger = logging.getLogger("futurasculpt.repositories.worktwin")


class WorkTwinRepository(ABC):
    """Abstract repository for persisting and retrieving WorkTwin manifests."""

    @abstractmethod
    def get(self, twin_id: str, tenant_id: str) -> Optional[WorkTwinManifest]:
        """Retrieve a twin manifest within tenant boundary."""

    @abstractmethod
    def list(self, tenant_id: str) -> List[WorkTwinManifest]:
        """List all twins belonging to a tenant."""

    @abstractmethod
    def save(self, manifest: WorkTwinManifest) -> WorkTwinManifest:
        """Upsert a twin manifest."""

    @abstractmethod
    def delete(self, twin_id: str, tenant_id: str) -> bool:
        """Delete a twin manifest."""


class ConsentRepository(ABC):
    """Abstract repository for persisting and querying employee PersonalWorkTwin consent."""

    @abstractmethod
    def get(self, employee_id: str, tenant_id: str) -> Optional[PersonalWorkTwinConsent]:
        """Retrieve consent contract by employee and tenant."""

    @abstractmethod
    def save(self, consent: PersonalWorkTwinConsent) -> PersonalWorkTwinConsent:
        """Upsert employee consent record."""


class BoardroomRunRepository(ABC):
    """Abstract repository for storing audit trails of Future Boardroom multi-agent runs."""

    @abstractmethod
    def save_simulation(self, result: BoardroomSimulationResult) -> BoardroomSimulationResult:
        """Store simulation output envelope."""

    @abstractmethod
    def get_simulation(self, simulation_id: str) -> Optional[BoardroomSimulationResult]:
        """Retrieve historical simulation output."""


# =====================================================================
# IN-MEMORY ADAPTERS (Local Dev & Unit Tests)
# =====================================================================


class InMemoryWorkTwinRepository(WorkTwinRepository):
    """Thread-safe in-memory manifest store for development and testing."""

    def __init__(self) -> None:
        """Initialize empty in-memory store."""
        self._store: Dict[str, WorkTwinManifest] = {}

    def get(self, twin_id: str, tenant_id: str) -> Optional[WorkTwinManifest]:
        """Retrieve manifest if matching tenant."""
        manifest = self._store.get(twin_id)
        if manifest and manifest.tenant_id == tenant_id:
            return manifest
        return None

    def list(self, tenant_id: str) -> List[WorkTwinManifest]:
        """List all manifests for tenant."""
        return [m for m in self._store.values() if m.tenant_id == tenant_id]

    def save(self, manifest: WorkTwinManifest) -> WorkTwinManifest:
        """Upsert manifest in store."""
        self._store[manifest.twin_id] = manifest
        return manifest

    def delete(self, twin_id: str, tenant_id: str) -> bool:
        """Delete manifest if matching tenant."""
        manifest = self._store.get(twin_id)
        if manifest and manifest.tenant_id == tenant_id:
            del self._store[twin_id]
            return True
        return False


class InMemoryConsentRepository(ConsentRepository):
    """Thread-safe in-memory employee consent repository."""

    def __init__(self) -> None:
        """Initialize empty consent store."""
        self._store: Dict[str, PersonalWorkTwinConsent] = {}

    def get(self, employee_id: str, tenant_id: str) -> Optional[PersonalWorkTwinConsent]:
        """Retrieve consent by tenant and employee ID."""
        key = f"{tenant_id}:{employee_id}"
        return self._store.get(key)

    def save(self, consent: PersonalWorkTwinConsent) -> PersonalWorkTwinConsent:
        """Upsert consent record."""
        tenant = consent.tenant_id or "default"
        key = f"{tenant}:{consent.employee_id}"
        self._store[key] = consent
        return consent


class InMemoryBoardroomRunRepository(BoardroomRunRepository):
    """Thread-safe in-memory boardroom simulation run store."""

    def __init__(self) -> None:
        """Initialize empty simulation store."""
        self._store: Dict[str, BoardroomSimulationResult] = {}

    def save_simulation(self, result: BoardroomSimulationResult) -> BoardroomSimulationResult:
        """Save simulation result to store."""
        self._store[result.simulation_id] = result
        return result

    def get_simulation(self, simulation_id: str) -> Optional[BoardroomSimulationResult]:
        """Retrieve simulation result by ID."""
        return self._store.get(simulation_id)


# =====================================================================
# FIRESTORE ADAPTERS (Multi-Instance Enterprise Scale)
# =====================================================================


class FirestoreWorkTwinRepository(WorkTwinRepository):
    """Google Cloud Firestore persistent repository for multi-instance Cloud Run."""

    def __init__(self, project_id: str = "genai-apac-2026-491004", collection_name: str = "worktwins") -> None:
        """Initialize Firestore repository with in-memory fallback."""
        self.project_id = project_id
        self.collection_name = collection_name
        self._fallback = InMemoryWorkTwinRepository()
        self._client: Optional[Any] = None
        self._init_client()

    def _init_client(self) -> None:
        """Attempt connection to Google Cloud Firestore Client."""
        try:
            import google.cloud.firestore as firestore  # type: ignore

            self._client = firestore.Client(project=self.project_id)
            logger.info("FirestoreWorkTwinRepository connected to Cloud Firestore: %s", self.project_id)
        except Exception as exc:
            logger.warning("Firestore client unavailable (%s); falling back to in-memory store.", exc)
            self._client = None

    def get(self, twin_id: str, tenant_id: str) -> Optional[WorkTwinManifest]:
        """Retrieve manifest from Firestore or fallback."""
        if not self._client:
            return self._fallback.get(twin_id, tenant_id)
        try:
            doc_ref = self._client.collection(self.collection_name).document(twin_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                if data.get("tenant_id") == tenant_id:
                    return WorkTwinManifest.model_validate(data)
        except Exception as exc:
            logger.error("Firestore get error: %s", exc)
        return self._fallback.get(twin_id, tenant_id)

    def list(self, tenant_id: str) -> List[WorkTwinManifest]:
        """List manifests from Firestore or fallback."""
        if not self._client:
            return self._fallback.list(tenant_id)
        try:
            query = (
                self._client.collection(self.collection_name)
                .where("tenant_id", "==", tenant_id)
                .stream()
            )
            return [WorkTwinManifest.model_validate(doc.to_dict()) for doc in query]
        except Exception as exc:
            logger.error("Firestore list error: %s", exc)
            return self._fallback.list(tenant_id)

    def save(self, manifest: WorkTwinManifest) -> WorkTwinManifest:
        """Persist manifest to Firestore and fallback."""
        self._fallback.save(manifest)
        if self._client:
            try:
                self._client.collection(self.collection_name).document(manifest.twin_id).set(
                    manifest.model_dump()
                )
            except Exception as exc:
                logger.error("Firestore save error: %s", exc)
        return manifest

    def delete(self, twin_id: str, tenant_id: str) -> bool:
        """Delete manifest from Firestore and fallback."""
        deleted = self._fallback.delete(twin_id, tenant_id)
        if self._client:
            try:
                doc_ref = self._client.collection(self.collection_name).document(twin_id)
                doc = doc_ref.get()
                if doc.exists and doc.to_dict().get("tenant_id") == tenant_id:
                    doc_ref.delete()
                    return True
            except Exception as exc:
                logger.error("Firestore delete error: %s", exc)
        return deleted


class FirestoreConsentRepository(ConsentRepository):
    """Google Cloud Firestore persistent repository for employee consents."""

    def __init__(self, project_id: str = "genai-apac-2026-491004", collection_name: str = "consents") -> None:
        """Initialize Firestore consent repository with in-memory fallback."""
        self.project_id = project_id
        self.collection_name = collection_name
        self._fallback = InMemoryConsentRepository()
        self._client: Optional[Any] = None
        self._init_client()

    def _init_client(self) -> None:
        """Attempt connection to Firestore client for consents."""
        try:
            import google.cloud.firestore as firestore  # type: ignore

            self._client = firestore.Client(project=self.project_id)
        except Exception as exc:
            logger.warning("Firestore client unavailable for consents (%s); falling back.", exc)
            self._client = None

    def get(self, employee_id: str, tenant_id: str) -> Optional[PersonalWorkTwinConsent]:
        """Retrieve employee consent contract."""
        if not self._client:
            return self._fallback.get(employee_id, tenant_id)
        try:
            doc_id = f"{tenant_id}_{employee_id}"
            doc = self._client.collection(self.collection_name).document(doc_id).get()
            if doc.exists:
                return PersonalWorkTwinConsent.model_validate(doc.to_dict())
        except Exception as exc:
            logger.error("Firestore consent get error: %s", exc)
        return self._fallback.get(employee_id, tenant_id)

    def save(self, consent: PersonalWorkTwinConsent) -> PersonalWorkTwinConsent:
        """Save employee consent contract."""
        self._fallback.save(consent)
        if self._client:
            try:
                tenant = consent.tenant_id or "default"
                doc_id = f"{tenant}_{consent.employee_id}"
                self._client.collection(self.collection_name).document(doc_id).set(
                    consent.model_dump()
                )
            except Exception as exc:
                logger.error("Firestore consent save error: %s", exc)
        return consent


class FirestoreBoardroomRunRepository(BoardroomRunRepository):
    """Google Cloud Firestore persistent repository for boardroom simulations."""

    def __init__(self, project_id: str = "genai-apac-2026-491004", collection_name: str = "boardroom_runs") -> None:
        """Initialize Firestore boardroom run repository with in-memory fallback."""
        self.project_id = project_id
        self.collection_name = collection_name
        self._fallback = InMemoryBoardroomRunRepository()
        self._client: Optional[Any] = None
        self._init_client()

    def _init_client(self) -> None:
        """Attempt connection to Firestore client for boardroom runs."""
        try:
            import google.cloud.firestore as firestore  # type: ignore

            self._client = firestore.Client(project=self.project_id)
        except Exception as exc:
            logger.warning("Firestore client unavailable for boardroom runs (%s); falling back.", exc)
            self._client = None

    def save_simulation(self, result: BoardroomSimulationResult) -> BoardroomSimulationResult:
        """Save boardroom simulation result to Firestore and fallback."""
        self._fallback.save_simulation(result)
        if self._client:
            try:
                self._client.collection(self.collection_name).document(result.simulation_id).set(
                    result.model_dump()
                )
            except Exception as exc:
                logger.error("Firestore boardroom save error: %s", exc)
        return result

    def get_simulation(self, simulation_id: str) -> Optional[BoardroomSimulationResult]:
        """Retrieve boardroom simulation result from Firestore or fallback."""
        if not self._client:
            return self._fallback.get_simulation(simulation_id)
        try:
            doc = self._client.collection(self.collection_name).document(simulation_id).get()
            if doc.exists:
                return BoardroomSimulationResult.model_validate(doc.to_dict())
        except Exception as exc:
            logger.error("Firestore boardroom get error: %s", exc)
        return self._fallback.get_simulation(simulation_id)


def get_worktwin_repository() -> WorkTwinRepository:
    """Factory creating appropriate WorkTwinRepository based on environment."""
    return FirestoreWorkTwinRepository()


def get_consent_repository() -> ConsentRepository:
    """Factory creating appropriate ConsentRepository."""
    return FirestoreConsentRepository()


def get_boardroom_run_repository() -> BoardroomRunRepository:
    """Factory creating appropriate BoardroomRunRepository."""
    return FirestoreBoardroomRunRepository()
