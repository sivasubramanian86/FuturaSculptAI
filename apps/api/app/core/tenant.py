"""Tenant isolation context and request dependency."""

from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings
from app.core.rbac import UserSession, get_current_user


def get_current_tenant_id(
    x_tenant_id: Optional[str] = Header(None),
    current_user: UserSession = Depends(get_current_user),
) -> str:
    """Extract and validate the tenant identifier bound to verified user identity.

    In production mode (`not settings.auth_dev_mode`):
    - Tenant ID is derived strictly from the authenticated UserSession.
    - If the client also passes an `X-Tenant-ID` header, it must strictly match
      the token's tenant claim, else an HTTP 403 Forbidden is raised.

    In dev/test mode:
    - If current_user has a tenant_id, verifies compatibility with any provided header.
    - Falls back to settings.default_tenant_id only in dev mode if unspecified.
    """
    if x_tenant_id is not None and not x_tenant_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header X-Tenant-ID must not be empty.",
        )

    token_tenant = current_user.tenant_id.strip() if current_user.tenant_id else ""
    header_tenant = x_tenant_id.strip() if x_tenant_id else ""

    if not settings.auth_dev_mode:
        if not token_tenant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="FORBIDDEN [ERR_MISSING_TENANT_CLAIM]: Verified token does not contain a valid tenant claim.",
            )
        if header_tenant and header_tenant != token_tenant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"FORBIDDEN [ERR_TENANT_MISMATCH]: Header X-Tenant-ID '{header_tenant}' does not match authenticated token tenant '{token_tenant}'.",
            )
        return token_tenant

    if header_tenant and token_tenant and header_tenant != token_tenant and token_tenant != settings.default_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"FORBIDDEN [ERR_TENANT_MISMATCH]: Header X-Tenant-ID '{header_tenant}' does not match session tenant '{token_tenant}'.",
        )

    resolved_tenant = header_tenant or token_tenant or settings.default_tenant_id
    if not resolved_tenant.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header X-Tenant-ID must not be empty.",
        )
    return resolved_tenant.strip()


def get_optional_tenant_id(
    authorization: Optional[str] = Header(None),
    x_tenant_id: Optional[str] = Header(None),
) -> str:
    """Extract tenant identifier for open ambassador endpoints, verifying token if supplied.

    Allows unauthenticated visitors and hackathon evaluators to interact with the
    Aura Hologram Assistant and Gemini Live Native Audio while binding authenticated
    sessions strictly to verified tenant claims.
    """
    if x_tenant_id is not None and not x_tenant_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header X-Tenant-ID must not be empty.",
        )

    header_tenant = x_tenant_id.strip() if x_tenant_id else ""
    if authorization:
        current_user = get_current_user(authorization=authorization, x_tenant_id=x_tenant_id)
        if current_user.tenant_id:
            if header_tenant and header_tenant != current_user.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"FORBIDDEN [ERR_TENANT_MISMATCH]: Header X-Tenant-ID '{header_tenant}' does not match authenticated token tenant '{current_user.tenant_id}'.",
                )
            return current_user.tenant_id

    resolved_tenant = header_tenant or settings.default_tenant_id
    if not resolved_tenant.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header X-Tenant-ID must not be empty.",
        )
    return resolved_tenant.strip()

