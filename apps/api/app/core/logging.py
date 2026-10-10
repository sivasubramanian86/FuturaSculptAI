"""Enterprise structured logging and log-level configuration for FuturaSculptAI."""

import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

# Context variable tracking current request tenant
_log_tenant_ctx: ContextVar[str] = ContextVar("log_tenant_ctx", default="system")


class LogLevel(str, Enum):
    """Supported logging severity levels."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


def set_log_tenant(tenant_id: str) -> None:
    """Set the active tenant context for log attribution.

    Args:
        tenant_id: Tenant identifier.
    """
    _log_tenant_ctx.set(tenant_id)


def get_log_tenant() -> str:
    """Get the active tenant context.

    Returns:
        str: Active tenant ID or 'system'.
    """
    return _log_tenant_ctx.get()


class TenantContextFilter(logging.Filter):
    """Filter injecting tenant context and ISO timestamp into log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Enrich log record with tenant metadata and UTC timestamp.

        Args:
            record: Log record being emitted.

        Returns:
            bool: Always True to allow emission.
        """
        record.tenant_id = get_log_tenant()
        record.utc_time = datetime.now(timezone.utc).isoformat()
        return True


def configure_logging(level: str = "INFO") -> None:
    """Configure root logger with structured formatting and log level.

    Args:
        level: Desired log severity string (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    root = logging.getLogger()
    root.setLevel(numeric_level)

    # Remove existing handlers to prevent duplicate lines
    for handler in list(root.handlers):
        root.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.addFilter(TenantContextFilter())

    formatter = logging.Formatter("[%(utc_time)s] [%(levelname)s] [tenant:%(tenant_id)s] [%(name)s]: %(message)s")
    console_handler.setFormatter(formatter)
    root.addHandler(console_handler)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Obtain a structured logger for a module.

    Args:
        name: Name of the logger or module.

    Returns:
        logging.Logger: Configured logger instance.
    """
    return logging.getLogger(name or "futurasculpt")
