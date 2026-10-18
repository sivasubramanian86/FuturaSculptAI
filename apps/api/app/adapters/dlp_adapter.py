"""Google Cloud Sensitive Data Protection (google.cloud.dlp) adapter for automated PII masking."""

import logging
import re
from typing import Any, List, Optional, Pattern, Tuple

try:
    from google.cloud import dlp_v2
except (ImportError, AttributeError):  # pragma: no cover
    dlp_v2 = None  # type: ignore[assignment]

from app.core.config import settings
from app.models.evidence import DlpRedactionResult

logger = logging.getLogger("futurasculpt.dlp_adapter")

# Canonical regex patterns for Sensitive Data Protection fallback
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

    def __init__(self, project_id: Optional[str] = None):
        """Initialize the DLP adapter.

        Args:
            project_id: Target GCP project identifier.
        """
        self.project_id = project_id or settings.gcp_project_id
        self.mock_mode = settings.mock_llm_mode
        self._client: Optional[dlp_v2.DlpServiceClient] = None

    def _get_client(self) -> Optional[Any]:
        """Lazy load and memoize the Google Cloud DLP service client."""
        if self.mock_mode or dlp_v2 is None:
            return None
        if self._client is None:
            try:
                self._client = dlp_v2.DlpServiceClient()
            except Exception as exc:
                logger.warning("Cloud DLP client initialization failed; using local regex: %s", exc)
                return None
        return self._client

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

        client = self._get_client()
        if client is not None:
            try:
                parent = f"projects/{self.project_id}/locations/{settings.gcp_region}"
                inspect_config = {
                    "info_types": [
                        {"name": "EMAIL_ADDRESS"},
                        {"name": "PHONE_NUMBER"},
                        {"name": "US_SOCIAL_SECURITY_NUMBER"},
                        {"name": "CREDIT_CARD_NUMBER"},
                    ],
                    "min_likelihood": dlp_v2.Likelihood.LIKELY,
                }
                item = {"value": text}
                deidentify_config = {
                    "info_type_transformations": {
                        "transformations": [
                            {
                                "primitive_transformation": {
                                    "replace_config": {
                                        "new_value": {"string_value": "[REDACTED_PII]"}
                                    }
                                }
                            }
                        ]
                    }
                }
                response = client.deidentify_content(
                    request={
                        "parent": parent,
                        "deidentify_config": deidentify_config,
                        "inspect_config": inspect_config,
                        "item": item,
                    }
                )
                detected = [
                    t["name"] for t in inspect_config["info_types"]
                    if "[REDACTED_PII]" in response.item.value
                ]
                return DlpRedactionResult(
                    sanitized_text=response.item.value,
                    redacted_items_count=len(detected),
                    detected_info_types=detected,
                )
            except Exception as exc:
                logger.warning("Live Cloud DLP invocation fallback triggered: %s", exc)

        # Deterministic local fallback
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
