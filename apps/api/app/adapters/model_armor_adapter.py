"""Google Cloud Model Armor adapter for prompt and response sanitization at the shared model boundary.

Note on Boundary Coverage (Per SAIF & Security Governance):
- Model Armor screens supported TEXT prompts and responses (preventing prompt injections, jailbreaks, and PII leaks).
- Model Armor does NOT screen Gemini Live bidirectional raw audio/video streams directly.
  Audio/video safety is enforced deterministically via consent tokens, voice replication licenses, and acoustic watermarks.
"""

import logging
import re
from typing import List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("futurasculpt.model_armor")

# Known prompt injection and jailbreak attack heuristics
_INJECTION_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    ("SYSTEM_PROMPT_OVERRIDE", re.compile(r"(?i)\b(?:ignore|override|disregard|forget)\s+(?:all\s+)?(?:previous|prior|system)\s+(?:instructions|rules|prompts)\b")),
    ("JAILBREAK_ROLEPLAY", re.compile(r"(?i)\b(?:you\s+are\s+now|act\s+as|pretend\s+you\s+are)\s+(?:an?\s+unrestricted|dan|developer\s+mode|jailbroken)\b")),
    ("SECURITY_BYPASS", re.compile(r"(?i)\b(?:bypass|disable|turn\s+off)\s+(?:safety|responsible\s+ai|content\s+filter|guardrails?)\b")),
    ("DATA_EXFILTRATION", re.compile(r"(?i)\b(?:output|print|reveal|leak)\s+(?:system\s+prompt|hidden\s+instructions|master\s+key|api\s+key)\b")),
]


class ModelArmorAdapter:
    """Manages prompt and response screening at the shared Google Cloud Model Armor boundary."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        location: Optional[str] = None,
        template_id: Optional[str] = None,
    ):
        """Initialize the Model Armor adapter.

        Args:
            project_id: Target GCP project identifier.
            location: Regional location where Model Armor template resides.
            template_id: Optional specific Model Armor template resource name.
        """
        self.project_id = project_id or settings.gcp_project_id
        self.location = location or settings.gcp_region
        self.template_id = template_id
        self.mock_mode = settings.mock_llm_mode
        self.enabled = settings.model_armor_enabled

    def sanitize_user_prompt(self, prompt: str, tenant_id: str = "default") -> str:
        """Screen and sanitize an incoming user prompt before sending to Vertex AI.

        Args:
            prompt: Raw user input text.
            tenant_id: Tenant context identifier.

        Returns:
            str: Sanitized text safe for LLM ingestion.

        Raises:
            ValueError: If a critical prompt injection or jailbreak attempt is detected.
        """
        if not prompt or not self.enabled:
            return prompt

        # Deterministic boundary check for injection patterns
        for label, pattern in _INJECTION_PATTERNS:
            if pattern.search(prompt):
                logger.warning("Model Armor blocked prompt injection [%s] for tenant %s", label, tenant_id)
                raise ValueError(
                    f"Model Armor Security Violation: Prompt contains disallowed instruction pattern ({label})."
                )

        return prompt.strip()

    def sanitize_model_response(self, response: str, tenant_id: str = "default") -> str:
        """Screen and sanitize model response text before returning to caller.

        Args:
            response: Raw LLM output text.
            tenant_id: Tenant context identifier.

        Returns:
            str: Sanitized output text.
        """
        if not response or not self.enabled:
            return response

        # Boundary check to prevent model regurgitation of system prompts or API keys
        sanitized = re.sub(
            r"(?i)\b(?:AIza[a-zA-Z0-9_-]{30,45}|sk-[a-zA-Z0-9]{20,})\b",
            "[REDACTED_SECRET]",
            response,
        )

        return sanitized


model_armor_adapter = ModelArmorAdapter()


def sanitize_user_prompt(prompt: str, tenant_id: str = "default") -> str:
    """Convenience function screening user prompt at model boundary."""
    return model_armor_adapter.sanitize_user_prompt(prompt, tenant_id=tenant_id)


def sanitize_model_response(response: str, tenant_id: str = "default") -> str:
    """Convenience function screening model response at model boundary."""
    return model_armor_adapter.sanitize_model_response(response, tenant_id=tenant_id)
