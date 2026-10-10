"""Tenant isolation context and request dependency."""

from typing import Optional

from fastapi import Header, HTTPException, status

from app.core.config import settings


def get_current_tenant_id(x_tenant_id: Optional[str] = Header(None)) -> str:
    """Extract and validate the tenant identifier from the request header.

    Args:
        x_tenant_id: Optional tenant header passed by the client or API gateway.

    Returns:
        str: Validated tenant identifier.

    Raises:
        HTTPException: If an explicitly provided tenant_id is malformed or invalid.
    """
    tenant_id = x_tenant_id or settings.default_tenant_id
    if not tenant_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header X-Tenant-ID must not be empty.",
        )
    return tenant_id.strip()
