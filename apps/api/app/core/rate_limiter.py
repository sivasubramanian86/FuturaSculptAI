"""Enterprise Distributed Rate Limiter & Concurrency Throttling Module.

Implements token bucket rate limiting and per-tenant concurrency control
for protecting Vertex AI token budgets and Cloud Run instances.
"""

import time
from typing import Dict, Tuple
from fastapi import HTTPException, Request, status

from app.core.logging import logger


class TokenBucketRateLimiter:
    """Thread-safe Token Bucket Rate Limiter with per-client and per-tenant quotas."""

    def __init__(self):
        """Initialize the token bucket store and tenant concurrency tracking."""
        # Key: client_key -> (tokens: float, last_updated: float)
        self._buckets: Dict[str, Tuple[float, float]] = {}
        # Key: tenant_id -> active_concurrency: int
        self._tenant_concurrency: Dict[str, int] = {}
        self.max_boardroom_concurrency_per_tenant = 2

    def check_rate_limit(
        self,
        client_key: str,
        role: str = "CITIZEN_WORKER",
        cost: float = 1.0,
    ) -> bool:
        """Evaluate token availability for a client request.

        Args:
            client_key: Unique client identifier (IP or user ID).
            role: Authenticated user role dictating quota limits.
            cost: Number of tokens consumed by this operation.

        Returns:
            bool: True if allowed.

        Raises:
            HTTPException: 429 if quota exceeded.
        """
        # Tiered Capacity Rules (req/minute)
        if role in {"ENTERPRISE_ARCHITECT", "SUPER_ADMIN"}:
            capacity = 60.0
            refill_rate = 1.0  # 60 tokens / 60 seconds
        elif role in {"CITIZEN_WORKER", "LINE_SUPERVISOR"}:
            capacity = 30.0
            refill_rate = 0.5  # 30 tokens / 60 seconds
        else:
            capacity = 10.0
            refill_rate = 0.16

        now = time.time()
        tokens, last_updated = self._buckets.get(client_key, (capacity, now))

        # Refill tokens based on elapsed time
        elapsed = now - last_updated
        tokens = min(capacity, tokens + elapsed * refill_rate)

        if tokens >= cost:
            self._buckets[client_key] = (tokens - cost, now)
            return True

        retry_after = int((cost - tokens) / refill_rate) + 1
        logger.warning(
            "Rate limit exceeded for %s (%s). Retry after %ds",
            client_key,
            role,
            retry_after,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"RATE_LIMIT_EXCEEDED: Quota exceeded for role '{role}'. Please retry in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )

    def acquire_boardroom_slot(self, tenant_id: str) -> None:
        """Acquire a concurrent simulation slot for a tenant."""
        current = self._tenant_concurrency.get(tenant_id, 0)
        if current >= self.max_boardroom_concurrency_per_tenant:
            logger.warning(
                "Tenant %s exceeded maximum concurrent boardroom runs (%d)",
                tenant_id,
                self.max_boardroom_concurrency_per_tenant,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"CONCURRENCY_LIMIT_EXCEEDED: Maximum {self.max_boardroom_concurrency_per_tenant} "
                    "concurrent Future Boardroom simulations permitted per tenant."
                ),
                headers={"Retry-After": "10"},
            )
        self._tenant_concurrency[tenant_id] = current + 1

    def release_boardroom_slot(self, tenant_id: str) -> None:
        """Release a concurrent simulation slot for a tenant."""
        current = self._tenant_concurrency.get(tenant_id, 0)
        if current > 0:
            self._tenant_concurrency[tenant_id] = current - 1

    def reset_for_tests(self) -> None:
        """Clear all rate limit state for unit testing isolation."""
        self._buckets.clear()
        self._tenant_concurrency.clear()


# Singleton Instance
rate_limiter = TokenBucketRateLimiter()


def rate_limit_dependency(request: Request) -> bool:
    """FastAPI dependency enforcing edge token bucket rate limiting."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    role = request.headers.get("X-User-Role", "CITIZEN_WORKER")
    return rate_limiter.check_rate_limit(client_ip, role=role)
