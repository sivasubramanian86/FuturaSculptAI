"""Authentication and RBAC Persona Management API Router."""

from typing import Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.rbac import (
    ROLE_PERMISSIONS,
    UserRole,
    UserSession,
    get_current_user,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & RBAC"])


class RoleDescriptor(BaseModel):
    """Metadata describing an available IAM Persona Role."""

    role: UserRole
    title: str = Field(..., description="Display title for role.")
    description: str = Field(..., description="Scope of responsibility and permissions.")
    permissions: List[str] = Field(..., description="Granted operations.")


ROLE_DESCRIPTIONS: Dict[UserRole, Dict[str, str]] = {
    UserRole.CITIZEN_WORKER: {
        "title": "Citizen / Frontline Worker",
        "description": "Frontline workers exploring task augmentation, rights, RRI resilience, and filing appeals.",
    },
    UserRole.ENTERPRISE_ARCHITECT: {
        "title": "Enterprise Solution Architect",
        "description": "Technical architects modeling C4 workgraphs, temporal simulations, and multi-agent swarms.",
    },
    UserRole.INVESTOR: {
        "title": "Strategic Investor & Board Member",
        "description": "Financial analysts and PE/VC evaluating workforce yield, EBITDA impact, and Diligence Packs.",
    },
    UserRole.HR_EXECUTIVE: {
        "title": "Human Resources & Talent Executive",
        "description": "HR leaders monitoring skill mobilities, reskilling cohorts, k>=10 privacy, and worker appeals.",
    },
    UserRole.CUSTOMER_CARE: {
        "title": "Customer Care & Frontline Support",
        "description": "Service representatives tracking frontline automation impacts and service workflows.",
    },
    UserRole.GOVERNANCE_OFFICER: {
        "title": "Governance, Risk & Compliance Auditor",
        "description": "Auditors reviewing SAIF controls, Model Armor boundaries, cryptographic hashes, and red lines.",
    },
}


@router.get("/me", response_model=UserSession)
def get_authenticated_session(
    current_user: UserSession = Depends(get_current_user),
) -> UserSession:
    """Retrieve the current user identity, active role, and granted RBAC permissions.

    Args:
        current_user: Validated user session.

    Returns:
        UserSession: Active session information.
    """
    return current_user


@router.get("/roles", response_model=List[RoleDescriptor])
def list_available_roles() -> List[RoleDescriptor]:
    """List all supported IAM persona roles and their permission capabilities.

    Returns:
        List[RoleDescriptor]: All registered RBAC roles.
    """
    descriptors = []
    for role in UserRole:
        meta = ROLE_DESCRIPTIONS[role]
        descriptors.append(
            RoleDescriptor(
                role=role,
                title=meta["title"],
                description=meta["description"],
                permissions=ROLE_PERMISSIONS.get(role, []),
            )
        )
    return descriptors
