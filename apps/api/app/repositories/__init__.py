"""Repository interfaces and adapters for FuturaSculptAI persistence layer."""

from app.repositories.worktwin_repository import (
    BoardroomRunRepository,
    ConsentRepository,
    FirestoreBoardroomRunRepository,
    FirestoreConsentRepository,
    FirestoreWorkTwinRepository,
    InMemoryBoardroomRunRepository,
    InMemoryConsentRepository,
    InMemoryWorkTwinRepository,
    WorkTwinRepository,
    get_boardroom_run_repository,
    get_consent_repository,
    get_worktwin_repository,
)

__all__ = [
    "WorkTwinRepository",
    "ConsentRepository",
    "BoardroomRunRepository",
    "InMemoryWorkTwinRepository",
    "InMemoryConsentRepository",
    "InMemoryBoardroomRunRepository",
    "FirestoreWorkTwinRepository",
    "FirestoreConsentRepository",
    "FirestoreBoardroomRunRepository",
    "get_worktwin_repository",
    "get_consent_repository",
    "get_boardroom_run_repository",
]
