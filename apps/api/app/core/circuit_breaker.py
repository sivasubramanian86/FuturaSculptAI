"""Enterprise Circuit Breaker & Fault-Tolerance Pattern.

Guards external model providers (Vertex AI, Anthropic on Vertex, Local LLMs)
against cascading failures, network partitions, and 429/5xx storms.
"""

from enum import Enum
import time
from typing import Any, Callable, Dict, Optional

from app.core.logging import logger


class CircuitState(str, Enum):
    """Circuit breaker operational state."""

    CLOSED = "CLOSED"      # Normal operation: requests pass through
    OPEN = "OPEN"          # Tripped: requests fail immediately or route to fallback
    HALF_OPEN = "HALF_OPEN"  # Probe: testing if upstream has recovered


class CircuitBreakerOpenException(Exception):
    """Raised when an operation is attempted while the circuit is OPEN."""

    pass


class CircuitBreaker:
    """State machine governing upstream provider resilience."""

    def __init__(
        self,
        name: str = "VertexAICircuitBreaker",
        failure_threshold: int = 3,
        recovery_timeout_seconds: float = 30.0,
    ):
        """Initialize circuit breaker parameters."""
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds

        self._state: CircuitState = CircuitState.CLOSED
        self._consecutive_failures: int = 0
        self._last_failure_time: float = 0.0
        self._total_successes: int = 0
        self._total_failures: int = 0

    @property
    def state(self) -> CircuitState:
        """Get current circuit breaker state with auto-transition from OPEN to HALF_OPEN."""
        if self._state == CircuitState.OPEN:
            elapsed = time.time() - self._last_failure_time
            if elapsed >= self.recovery_timeout_seconds:
                self._state = CircuitState.HALF_OPEN
                logger.info(
                    "Circuit Breaker '%s' transitioned OPEN -> HALF_OPEN (probe window)",
                    self.name,
                )
        return self._state

    def record_success(self) -> None:
        """Record successful invocation and reset failure counters."""
        self._total_successes += 1
        if self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.CLOSED
            logger.info("Circuit Breaker '%s' recovered to CLOSED state", self.name)
        self._consecutive_failures = 0

    def record_failure(self, error: Optional[Exception] = None) -> None:
        """Record upstream failure and evaluate threshold for tripping to OPEN."""
        self._total_failures += 1
        self._consecutive_failures += 1
        self._last_failure_time = time.time()

        logger.warning(
            "Circuit Breaker '%s' recorded failure #%d: %s",
            self.name,
            self._consecutive_failures,
            error or "Unknown error",
        )

        if self._consecutive_failures >= self.failure_threshold:
            self._state = CircuitState.OPEN
            logger.error(
                "Circuit Breaker '%s' TRIPPED to OPEN after %d consecutive failures",
                self.name,
                self._consecutive_failures,
            )

    async def call_with_fallback(
        self,
        primary_fn: Callable[..., Any],
        fallback_fn: Callable[..., Any],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """Execute primary function with automatic fallback routing if circuit is OPEN or fails.

        Args:
            primary_fn: Primary async callable (e.g. Gemini 2.5 Pro).
            fallback_fn: Fallback async callable (e.g. Gemini 2.5 Flash / Local).
            *args: Positional arguments.
            **kwargs: Keyword arguments.

        Returns:
            Any: Result from primary or fallback execution.
        """
        if self.state == CircuitState.OPEN:
            logger.warning(
                "Circuit '%s' is OPEN. Routing directly to secondary fallback provider.",
                self.name,
            )
            return await fallback_fn(*args, **kwargs)

        try:
            res = await primary_fn(*args, **kwargs)
            self.record_success()
            return res
        except Exception as exc:
            self.record_failure(exc)
            logger.warning(
                "Primary call failed in circuit '%s'. Executing secondary fallback.",
                self.name,
            )
            return await fallback_fn(*args, **kwargs)

    def get_metrics(self) -> Dict[str, Any]:
        """Export circuit breaker health metrics."""
        return {
            "name": self.name,
            "state": self.state.value,
            "consecutive_failures": self._consecutive_failures,
            "failure_threshold": self.failure_threshold,
            "total_successes": self._total_successes,
            "total_failures": self._total_failures,
            "recovery_timeout_seconds": self.recovery_timeout_seconds,
        }

    def reset_for_tests(self) -> None:
        """Reset state for clean unit test isolation."""
        self._state = CircuitState.CLOSED
        self._consecutive_failures = 0
        self._last_failure_time = 0.0
        self._total_successes = 0
        self._total_failures = 0


# Singleton Circuit Breaker for Model Gateway
model_circuit_breaker = CircuitBreaker("VertexAI_ModelGateway")
