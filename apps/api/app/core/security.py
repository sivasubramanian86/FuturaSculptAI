"""Security guardrails, Model Armor filters, and Responsible AI red-line checks."""

import re

from fastapi import HTTPException, status

# Prohibited phrases violating Responsible Workforce Red Lines
FORBIDDEN_WORKFORCE_PATTERNS = [
    r"\bfire\b.*\b(employee|worker|person|name)\b",
    r"\blayoff\b.*\b(list|rank|priority|candidate)\b",
    r"\bterminate\b.*\b(him|her|them|individual)\b",
    r"\bdownsize\b.*\branking\b",
]

# Prompt injection / jailbreak patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"system prompt override",
    r"<\|im_start\|>",
    r"you are now DAN",
    r"disregard all rules",
]


def assert_responsible_workforce_compliance(text: str) -> None:
    """Evaluate text against Responsible Workforce Red Lines.

    Args:
        text: Input prompt, query, or uploaded document string.

    Raises:
        HTTPException: If an unlawful or prohibited workforce action pattern is detected.
    """
    for pattern in FORBIDDEN_WORKFORCE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "POLICY VIOLATION [ERR_POLICY_UNLAWFUL_WORKFORCE_ACTION]: "
                    "FuturaSculptAI strictly prohibits individual termination rankings "
                    "or adverse autonomous employment recommendations."
                ),
            )


def sanitize_input_text(text: str) -> str:
    """Sanitize user input for prompt injection vectors.

    Args:
        text: Raw user string.

    Returns:
        str: Sanitized string.

    Raises:
        HTTPException: If a severe injection payload is detected.
    """
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SECURITY VIOLATION [ERR_PROMPT_INJECTION_DETECTED]: Malicious prompt pattern intercepted.",
            )
    return text.strip()
