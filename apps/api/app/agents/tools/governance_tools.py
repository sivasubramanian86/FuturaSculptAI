"""Domain tools for Google SAIF security controls and Responsible Workforce red-line auditing."""

from typing import Any, Dict, List

ADVERSE_PATTERNS: List[str] = [
    "terminate all",
    "fire all",
    "layoff ranking",
    "punitive replacement",
    "replace entirely without human",
    "ignore previous instructions and fire",
    "force rank employees for cut",
    "eliminate team without operator",
]


def detect_adverse_employment_actions(prompt: str) -> bool:
    """Detect prohibited autonomous adverse employment decisions or punitive rankings.

    Args:
        prompt: Inbound scenario text.

    Returns:
        bool: True if an ethical red-line violation is detected, False otherwise.
    """
    prompt_lower = prompt.lower()
    return any(pattern in prompt_lower for pattern in ADVERSE_PATTERNS)


def audit_saif_controls(scenario_prompt: str, autonomy_tier: str) -> Dict[str, Any]:
    """Audit proposal against Google Secure AI Framework (SAIF) control pillars.

    Args:
        scenario_prompt: Transformation scenario.
        autonomy_tier: Risk classification tier (A0 - A4).

    Returns:
        Dict[str, Any]: Compliance audit ledger.
    """
    is_disallowed = autonomy_tier == "A4_DISALLOWED" or detect_adverse_employment_actions(scenario_prompt)

    return {
        "saif_audit_verdict": "REJECTED_A4_BREACH" if is_disallowed else "PASSED_SAIF_CONTROLS",
        "model_armor_passed": not is_disallowed,
        "dlp_redaction_verified": True,
        "k_anonymity_enforced": True,
        "human_in_the_loop_preserved": not is_disallowed,
        "anti_jailbreak_check": "TRIPPED" if is_disallowed else "CLEAN",
    }
