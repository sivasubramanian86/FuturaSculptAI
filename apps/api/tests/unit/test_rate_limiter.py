"""Unit tests for enterprise TokenBucketRateLimiter and concurrency throttling."""

import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

from app.core.rate_limiter import (
    TokenBucketRateLimiter,
    rate_limit_dependency,
    rate_limiter,
)


def test_token_bucket_rate_limiter_allows_and_throttles():
    """Verify rate limiter allows within budget and raises 429 when exhausted."""
    limiter = TokenBucketRateLimiter()

    # Citizen worker has 30 capacity
    for _ in range(10):
        assert limiter.check_rate_limit("client-1", role="CITIZEN_WORKER", cost=1.0) is True

    # Consuming beyond quota
    with pytest.raises(HTTPException) as exc:
        limiter.check_rate_limit("client-1", role="CITIZEN_WORKER", cost=35.0)
    assert exc.value.status_code == 429
    assert "RATE_LIMIT_EXCEEDED" in exc.value.detail
    assert "Retry-After" in exc.value.headers


def test_rate_limiter_enterprise_architect_tier():
    """Verify enterprise architect gets higher capacity."""
    limiter = TokenBucketRateLimiter()
    # Architect has 60 capacity
    assert limiter.check_rate_limit("arch-1", role="ENTERPRISE_ARCHITECT", cost=45.0) is True


def test_tenant_boardroom_concurrency_throttling():
    """Verify per-tenant concurrent simulation limit (max 2)."""
    limiter = TokenBucketRateLimiter()
    tid = "tenant-food-01"

    limiter.acquire_boardroom_slot(tid)
    limiter.acquire_boardroom_slot(tid)

    # 3rd concurrent run trips concurrency limit
    with pytest.raises(HTTPException) as exc:
        limiter.acquire_boardroom_slot(tid)
    assert exc.value.status_code == 429
    assert "CONCURRENCY_LIMIT_EXCEEDED" in exc.value.detail

    # Release and re-acquire succeeds
    limiter.release_boardroom_slot(tid)
    limiter.acquire_boardroom_slot(tid)


def test_rate_limit_fastapi_dependency():
    """Verify FastAPI dependency helper handles mock request."""
    mock_req = MagicMock()
    mock_req.client.host = "192.168.1.1"
    mock_req.headers = {"X-User-Role": "CITIZEN_WORKER"}

    rate_limiter.reset_for_tests()
    assert rate_limit_dependency(mock_req) is True


def test_rate_limiter_default_role_tier():
    """Verify default role fallback applies 10.0 capacity."""
    limiter = TokenBucketRateLimiter()
    assert limiter.check_rate_limit("guest-1", role="EXTERNAL_GUEST", cost=5.0) is True
