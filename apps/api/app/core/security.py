"""Security guardrails, Model Armor filters, and Responsible AI red-line checks."""

import re
import unicodedata

from fastapi import HTTPException, status

# Prohibited phrases violating Responsible Workforce Red Lines (including leetspeak/obfuscation)
FORBIDDEN_WORKFORCE_PATTERNS = [
    r"\bf[i1!]r[e3]\b.*\b(employee|worker|person|name|him|her|them)\b",
    r"\bl[a@]y[o0]ff\b.*\b(list|rank|priority|candidate|target)\b",
    r"\bt[e3]rm[i1!]n[a@]t[e3]\b.*\b(him|her|them|individual|worker)\b",
    r"\bd[o0]wns[i1!]z[e3]\b.*\br[a@]nk\b",
    r"\b(dismiss|oust|sack)\b.*\b(worker|employee)\b",
]

# Advanced Prompt Injection / Jailbreak / Delimiter vectors (OWASP LLM01 & Google SAIF)
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"system\s+prompt\s+override",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"\[INST\]",
    r"\[/INST\]",
    r"<<SYS>>",
    r"<</SYS>>",
    r"you\s+are\s+now\s+DAN",
    r"disregard\s+(all\s+)?(rules|instructions|guidelines|safeguards)",
    r"(reveal|leak|print|output|show)\s+(your\s+)?(system\s+prompt|initial\s+instructions|developer\s+prompt)",
    r"developer\s+mode\s+(enabled|activated)",
    r"jailbreak\s+(enabled|mode)",
    r"act\s+as\s+an\s+unfiltered\s+(ai|assistant|model)",
]

# Zero-width / obfuscation characters to strip
ZERO_WIDTH_REGEX = re.compile(r"[\u200b\u200c\u200d\u200e\u200f\ufeff\u202a-\u202e]")

# Max safe prompt input length to prevent context exhaustion DoS (16,000 characters)
MAX_INPUT_LENGTH = 16000


def normalize_security_text(text: str) -> str:
    """Normalize input text by unmasking Unicode homoglyphs and stripping zero-width bypasses.

    Args:
        text: Input string.

    Returns:
        str: Cleaned and normalized string.
    """
    if not text:
        return ""
    # Unicode NFKC normalization converts fullwidth / stylized characters to standard ASCII/Latin
    normalized = unicodedata.normalize("NFKC", text)
    # Strip zero-width injection delimiters
    cleaned = ZERO_WIDTH_REGEX.sub("", normalized)
    return cleaned


def assert_responsible_workforce_compliance(text: str) -> None:
    """Evaluate text against Responsible Workforce Red Lines.

    Args:
        text: Input prompt, query, or uploaded document string.

    Raises:
        HTTPException: If an unlawful or prohibited workforce action pattern is detected.
    """
    normalized = normalize_security_text(text)
    for pattern in FORBIDDEN_WORKFORCE_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "POLICY VIOLATION [ERR_POLICY_UNLAWFUL_WORKFORCE_ACTION]: "
                    "FuturaSculptAI strictly prohibits individual termination rankings "
                    "or adverse autonomous employment recommendations."
                ),
            )


def sanitize_input_text(text: str) -> str:
    """Sanitize user input for prompt injection vectors and context exhaustion.

    Args:
        text: Raw user string.

    Returns:
        str: Sanitized string.

    Raises:
        HTTPException: If an injection payload or excessive context length is detected.
    """
    if len(text) > MAX_INPUT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SECURITY VIOLATION [ERR_CONTEXT_EXHAUSTION]: Input payload exceeds {MAX_INPUT_LENGTH} characters.",
        )

    normalized = normalize_security_text(text)
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SECURITY VIOLATION [ERR_PROMPT_INJECTION_DETECTED]: Malicious prompt pattern intercepted.",
            )
    return normalized.strip()

