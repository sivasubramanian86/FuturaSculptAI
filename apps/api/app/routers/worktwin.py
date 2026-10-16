"""FastAPI router for Futura WorkTwin Fabric endpoints."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.rbac import UserRole, UserSession, get_current_user, require_roles
from app.models.worktwin import (
    BoardroomSimulationRequest,
    BoardroomSimulationResult,
    PersonalWorkTwinConsent,
    WorkTwinManifest,
)
from app.agents.adk_boardroom import get_adk_boardroom_agent
from app.services.worktwin_service import worktwin_service

router = APIRouter(prefix="/worktwins", tags=["WorkTwin Fabric"])


@router.get("/manifests", response_model=List[WorkTwinManifest])
async def list_worktwin_manifests(
    current_user: UserSession = Depends(get_current_user),
) -> List[WorkTwinManifest]:
    """Retrieve all governed WorkTwin manifests strictly isolated for the authenticated tenant."""
    return worktwin_service.list_manifests(current_user.tenant_id)


@router.get("/manifests/{twin_id}", response_model=WorkTwinManifest)
async def get_worktwin_manifest(
    twin_id: str,
    current_user: UserSession = Depends(get_current_user),
) -> WorkTwinManifest:
    """Retrieve specific WorkTwin manifest by twin_id, enforcing tenant isolation boundaries."""
    return worktwin_service.get_manifest(twin_id, tenant_id=current_user.tenant_id)


@router.post("/manifests", response_model=WorkTwinManifest, status_code=status.HTTP_201_CREATED)
async def create_role_twin(
    payload: dict,
    current_user: UserSession = Depends(get_current_user),
) -> WorkTwinManifest:
    """Register a new synthetic RoleTwin archetype (Requires Enterprise Architect or Governance Officer in production)."""
    if not settings.auth_dev_mode and current_user.role not in [UserRole.ENTERPRISE_ARCHITECT, UserRole.GOVERNANCE_OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORBIDDEN_INSUFFICIENT_ROLE: Only Enterprise Architects or Governance Officers can register RoleTwins.",
        )

    role = payload.get("role_archetype")
    purpose = payload.get("declared_purpose")
    skills = payload.get("skills", [])
    if not role or not purpose:
        raise HTTPException(status_code=400, detail="role_archetype and declared_purpose are required.")
    return worktwin_service.create_role_twin(
        tenant_id=current_user.tenant_id,
        role_archetype=role,
        declared_purpose=purpose,
        skills=skills,
    )


@router.post("/manifests/{twin_id}/suspend", response_model=WorkTwinManifest)
async def suspend_worktwin(
    twin_id: str,
    current_user: UserSession = Depends(require_roles(UserRole.ENTERPRISE_ARCHITECT, UserRole.GOVERNANCE_OFFICER)),
) -> WorkTwinManifest:
    """Suspend an operational WorkTwin manifest."""
    return worktwin_service.suspend_twin(twin_id, tenant_id=current_user.tenant_id)


@router.post("/manifests/{twin_id}/reactivate", response_model=WorkTwinManifest)
async def reactivate_worktwin(
    twin_id: str,
    current_user: UserSession = Depends(require_roles(UserRole.ENTERPRISE_ARCHITECT, UserRole.GOVERNANCE_OFFICER)),
) -> WorkTwinManifest:
    """Reactivate a suspended WorkTwin manifest."""
    return worktwin_service.reactivate_twin(twin_id, tenant_id=current_user.tenant_id)


@router.post("/manifests/{twin_id}/revoke", response_model=WorkTwinManifest)
async def revoke_worktwin(
    twin_id: str,
    current_user: UserSession = Depends(require_roles(UserRole.ENTERPRISE_ARCHITECT, UserRole.GOVERNANCE_OFFICER)),
) -> WorkTwinManifest:
    """Revoke a WorkTwin manifest and terminate active permissions."""
    return worktwin_service.revoke_twin(twin_id, tenant_id=current_user.tenant_id)


@router.delete("/manifests/{twin_id}", response_model=Dict[str, Any])
async def delete_worktwin(
    twin_id: str,
    current_user: UserSession = Depends(require_roles(UserRole.ENTERPRISE_ARCHITECT, UserRole.GOVERNANCE_OFFICER)),
) -> Dict[str, Any]:
    """Delete a WorkTwin manifest from tenant scope."""
    return worktwin_service.delete_twin(twin_id, tenant_id=current_user.tenant_id)


@router.get("/manifests/{twin_id}/export", response_model=Dict[str, Any])
async def export_worktwin_manifest(
    twin_id: str,
    current_user: UserSession = Depends(get_current_user),
) -> Dict[str, Any]:
    """Export cryptographically verifiable WorkTwin manifest with SHA-256 integrity hash."""
    return worktwin_service.export_manifest(twin_id, tenant_id=current_user.tenant_id)


@router.post("/boardroom/simulate", response_model=BoardroomSimulationResult)
async def simulate_future_boardroom(
    request: BoardroomSimulationRequest,
    current_user: UserSession = Depends(get_current_user),
) -> BoardroomSimulationResult:
    """Run a multi-twin Future Boardroom simulation evaluating a proposed transformation."""
    # Never trust tenant_id from request body; enforce authenticated user's tenant scope
    request.tenant_id = current_user.tenant_id
    adk_coordinator = get_adk_boardroom_agent()
    return await adk_coordinator.simulate_boardroom(request)


@router.post("/personal/consent", response_model=WorkTwinManifest)
async def register_personal_twin_consent(
    consent: PersonalWorkTwinConsent,
    current_user: UserSession = Depends(get_current_user),
) -> WorkTwinManifest:
    """Register or update employee consent for a PersonalWorkTwin (Opt-in Demo)."""
    # Enforce authenticated tenant scope
    consent.tenant_id = current_user.tenant_id

    # Enforce consent ownership: Employees may only consent for their own identity
    if not settings.auth_dev_mode:
        if current_user.user_id != consent.employee_id and current_user.role != UserRole.ENTERPRISE_ARCHITECT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="FORBIDDEN_OWNERSHIP_MISMATCH: Employees can only manage their own PersonalWorkTwin consent.",
            )

    # Reject voice/avatar cloning explicitly
    if consent.voice_avatar_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "POLICY VIOLATION [ERR_VOICE_AVATAR_PROHIBITED]: Voice and avatar cloning are strictly "
                "prohibited under EU AI Act Article 52 and FuturaSculptAI Responsible Workforce Rules."
            ),
        )

    return worktwin_service.register_personal_twin_consent(consent)
