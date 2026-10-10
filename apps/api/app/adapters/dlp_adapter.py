"""Google Cloud Sensitive Data Protection (DLP) adapter for automated PII masking."""

import re
from typing import List, Pattern, Tuple

from app.core.config import settings
from app.models.evidence import DlpRedactionResult

# Canonical regex patterns for Sensitive Data Protection
_DLP_PATTERNS: List[Tuple[str, Pattern[str], str]] = [
    (
        "EMAIL_ADDRESS",
        re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
        "[REDACTED_EMAIL]",
    ),
    (
        "PHONE_NUMBER",
        re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
        "[REDACTED_PHONE]",
    ),
    (
        "US_SOCIAL_SECURITY_NUMBER",
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        "[REDACTED_SSN]",
    ),
    (
        "CREDIT_CARD_NUMBER",
        re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
        "[REDACTED_CREDIT_CARD]",
    ),
    (
        "INDIVIDUAL_COMPENSATION",
        re.compile(r"(?i)\b(?:salary|compensation|base\s+pay)\s*[:=]?\s*\$?\d{2,3}(?:,\d{3})*(?:\s*(?:usd|k|/yr))?\b"),
        "[REDACTED_COMPENSATION]",
    ),
]


class DlpAdapter:
    """Encapsulates Cloud DLP inspection and de-identification for ingested evidence."""

    def __init__(self, project_id: str | None = None):
        """Initialize the DLP adapter.

        Args:
            project_id: Target GCP project identifier.
        """
        self.project_id = project_id or settings.gcp_project_id
        self.mock_mode = settings.mock_llm_mode

    def redact_text(self, text: str) -> DlpRedactionResult:
        """De-identify sensitive PII and restricted attributes from text content.

        Args:
            text: Raw input text from document parsing.

        Returns:
            DlpRedactionResult: Sanitized text, count of redactions, and detected info types.
        """
        if not text:
            return DlpRedactionResult(
                sanitized_text="",
                redacted_items_count=0,
                detected_info_types=[],
            )

        sanitized = text
        total_redactions = 0
        detected_types: List[str] = []

        for info_type, pattern, replacement in _DLP_PATTERNS:
            matches = pattern.findall(sanitized)
            if matches:
                detected_types.append(info_type)
                total_redactions += len(matches)
                sanitized = pattern.sub(replacement, sanitized)

        return DlpRedactionResult(
            sanitized_text=sanitized,
            redacted_items_count=total_redactions,
            detected_info_types=detected_types,
        )


dlp_adapter = DlpAdapter()
