"""Unit tests for CircuitBreaker fault-tolerance state machine and fallback execution."""

import time
import pytest

from app.core.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
)


@pytest.mark.asyncio
async def test_circuit_breaker_closed_state_success():
    """Verify circuit breaker remains CLOSED and passes calls under normal conditions."""
    cb = CircuitBreaker("TestCB", failure_threshold=3, recovery_timeout_seconds=0.5)
    assert cb.state == CircuitState.CLOSED

    async def mock_primary():
        return {"model": "primary", "text": "success"}

    async def mock_fallback():
        return {"model": "fallback", "text": "fallback"}

    res = await cb.call_with_fallback(mock_primary, mock_fallback)
    assert res["model"] == "primary"
    assert cb.state == CircuitState.CLOSED
    assert cb.get_metrics()["total_successes"] == 1


@pytest.mark.asyncio
async def test_circuit_breaker_trips_to_open_after_threshold():
    """Verify circuit breaker trips to OPEN on repeated failures and invokes fallback."""
    cb = CircuitBreaker("TestCB", failure_threshold=2, recovery_timeout_seconds=0.1)

    async def failing_primary():
        raise RuntimeError("Vertex AI 503 Service Unavailable")

    async def mock_fallback():
        return {"model": "fallback", "text": "fallback response"}

    # Failure 1
    res1 = await cb.call_with_fallback(failing_primary, mock_fallback)
    assert res1["model"] == "fallback"
    assert cb.state == CircuitState.CLOSED

    # Failure 2 trips the breaker
    res2 = await cb.call_with_fallback(failing_primary, mock_fallback)
    assert res2["model"] == "fallback"
    assert cb.state == CircuitState.OPEN

    # When OPEN, calls route directly to fallback without calling primary
    call_tracker = {"primary_called": False}

    async def tracked_primary():
        call_tracker["primary_called"] = True
        return {}

    res3 = await cb.call_with_fallback(tracked_primary, mock_fallback)
    assert res3["model"] == "fallback"
    assert call_tracker["primary_called"] is False

    # Wait for recovery timeout to transition to HALF_OPEN
    time.sleep(0.15)
    assert cb.state == CircuitState.HALF_OPEN

    # Recovery test in HALF_OPEN
    async def recovered_primary():
        return {"model": "primary", "text": "recovered"}

    res4 = await cb.call_with_fallback(recovered_primary, mock_fallback)
    assert res4["model"] == "primary"
    assert cb.state == CircuitState.CLOSED

    cb.reset_for_tests()
    assert cb.state == CircuitState.CLOSED
    assert cb.get_metrics()["total_failures"] == 0
