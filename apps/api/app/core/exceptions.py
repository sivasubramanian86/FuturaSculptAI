"""Enterprise domain exception hierarchy for FuturaSculptAI."""

from typing import Optional


class FuturaSculptException(Exception):
    """Base application exception with standardized HTTP status and error code."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        detail: Optional[str] = None,
    ):
        """Initialize FuturaSculptException with message, code, status, and detail."""
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.detail = detail or message


class ResourceNotFoundException(FuturaSculptException):
    """Exception raised when a requested resource does not exist."""

    def __init__(self, message: str, detail: Optional[str] = None):
        """Initialize ResourceNotFoundException with 404 status and error code."""
        super().__init__(
            message=message,
            error_code="RESOURCE_NOT_FOUND",
            status_code=404,
            detail=detail,
        )


class PolicyViolationException(FuturaSculptException):
    """Exception raised when an action violates Responsible AI red lines or governance gates."""

    def __init__(self, message: str, detail: Optional[str] = None):
        """Initialize PolicyViolationException with 403 status and error code."""
        super().__init__(
            message=message,
            error_code="POLICY_VIOLATION",
            status_code=403,
            detail=detail,
        )


class ValidationException(FuturaSculptException):
    """Exception raised when an input fails semantic or structural validation."""

    def __init__(self, message: str, detail: Optional[str] = None):
        """Initialize ValidationException with 422 status and error code."""
        super().__init__(
            message=message,
            error_code="VALIDATION_FAILED",
            status_code=422,
            detail=detail,
        )


class IntegrityTamperException(FuturaSculptException):
    """Exception raised when cryptographic hash verification detects evidence tampering."""

    def __init__(self, message: str, detail: Optional[str] = None):
        """Initialize IntegrityTamperException with 409 status and error code."""
        super().__init__(
            message=message,
            error_code="INTEGRITY_TAMPER_DETECTED",
            status_code=409,
            detail=detail,
        )
