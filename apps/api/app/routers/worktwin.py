"""FastAPI router for Futura WorkTwin Fabric endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.models.worktwin import (
    BoardroomSimulationRequest,
    BoardroomSimulationResult,
    PersonalWorkTwinConsent,
    WorkTwinManifest,
)
from app.services.worktwin_service import worktwin_service

router = APIRouter(prefix="/worktwins", tags=["WorkTwin Fabric"])


def get_current_tenant(x_tenant_id: Optional[str] = Header(None)) -> str:
    """Extract or default tenant boundary."""
    return x_tenant_id or "tenant-food-mfg-01"


@router.get("/manifests", response_model=List[WorkTwinManifest])
async def list_worktwin_manifests(
    tenant_id: str = Depends(get_current_tenant),
) -> List[WorkTwinManifest]:
    """Retrieve all governed WorkTwin manifests for the current tenant."""
    return worktwin_service.list_manifests(tenant_id)


@router.get("/manifests/{twin_id}", response_model=WorkTwinManifest)
async def get_worktwin_manifest(
    twin_id: str,
) -> WorkTwinManifest:
    """Retrieve specific WorkTwin manifest by twin_id."""
    return worktwin_service.get_manifest(twin_id)


@router.post("/manifests", response_model=WorkTwinManifest, status_code=status.HTTP_201_CREATED)
async def create_role_twin(
    payload: dict,
    tenant_id: str = Depends(get_current_tenant),
) -> WorkTwinManifest:
    """Register a new synthetic RoleTwin archetype."""
    role = payload.get("role_archetype")
    purpose = payload.get("declared_purpose")
    skills = payload.get("skills", [])
    if not role or not purpose:
        raise HTTPException(status_code=400, detail="role_archetype and declared_purpose are required.")
    return worktwin_service.create_role_twin(
        tenant_id=tenant_id,
        role_archetype=role,
        declared_purpose=purpose,
        skills=skills,
    )


@router.post("/boardroom/simulate", response_model=BoardroomSimulationResult)
async def simulate_future_boardroom(
    request: BoardroomSimulationRequest,
    tenant_id: str = Depends(get_current_tenant),
) -> BoardroomSimulationResult:
    """Run a multi-twin Future Boardroom simulation evaluating a proposed transformation."""
    if not request.tenant_id:
        request.tenant_id = tenant_id
    return worktwin_service.simulate_future_boardroom(request)


@router.post("/personal/consent", response_model=WorkTwinManifest)
async def register_personal_twin_consent(
    consent: PersonalWorkTwinConsent,
    tenant_id: str = Depends(get_current_tenant),
) -> WorkTwinManifest:
    """Register or update employee consent for a PersonalWorkTwin (Opt-in Demo)."""
    if not consent.tenant_id:
        consent.tenant_id = tenant_id
    return worktwin_service.register_personal_twin_consent(consent)
