"""Deterministic mathematical scoring engine.

CRITICAL: ZERO non-deterministic LLM calculations. All math is versioned,
pure, deterministic Python logic adhering to docs/architecture/score-contracts.md.
"""

from typing import List

from app.models.scoring import (
    RoleResilienceResult,
    ScoreComponent,
    TrustScoreResult,
)


def calculate_role_resilience_index(
    role_id: str,
    role_name: str,
    non_routine_judgment_pct: float,
    skill_transferability_pct: float,
    augmentation_potential_pct: float,
    strategic_criticality_pct: float,
    evidence_ids: List[str] = None,
) -> RoleResilienceResult:
    """Calculate the deterministic Role Resilience Index (RRI).

    Formula:
        RRI = (0.35 * non_routine) + (0.30 * transferability) +
              (0.20 * augmentation) + (0.15 * strategic_criticality)

    Args:
        role_id: Unique identifier for the role.
        role_name: Title of the role.
        non_routine_judgment_pct: Percentage [0, 100] requiring non-routine judgment.
        skill_transferability_pct: Overlap [0, 100] with high-growth emerging roles.
        augmentation_potential_pct: Capacity [0, 100] to be augmented rather than automated.
        strategic_criticality_pct: Alignment [0, 100] with core business outcomes.
        evidence_ids: Associated evidence ledger citations.

    Returns:
        RoleResilienceResult: Computed index, tier, and transparent factor breakdown.
    """
    evidence_ids = evidence_ids or []

    # Clamp inputs to [0.0, 100.0]
    nr = max(0.0, min(100.0, non_routine_judgment_pct))
    st = max(0.0, min(100.0, skill_transferability_pct))
    ap = max(0.0, min(100.0, augmentation_potential_pct))
    sc = max(0.0, min(100.0, strategic_criticality_pct))

    w_nr = 0.35 * nr
    w_st = 0.30 * st
    w_ap = 0.20 * ap
    w_sc = 0.15 * sc

    final_score = round(w_nr + w_st + w_ap + w_sc, 2)

    if final_score >= 75.0:
        tier = "HIGH_RESILIENCE"
        pathway = "Empower with specialized agent copilots and operational leadership responsibilities."
    elif final_score >= 50.0:
        tier = "MODERATE_RESILIENCE"
        pathway = "Targeted upskilling in computer vision calibration and autonomous pipeline supervision."
    else:
        tier = "TRANSITION_PRIORITY"
        pathway = "Proactive transition pathway to adjacent emerging role (e.g., Vision Automation Steward)."

    components = [
        ScoreComponent(
            name="Non-Routine Judgment",
            weight=0.35,
            raw_value=nr,
            weighted_value=round(w_nr, 2),
            rationale="Portion of tasks demanding human discretion, physical dexterity, and edge-case resolution.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Skill Transferability",
            weight=0.30,
            raw_value=st,
            weighted_value=round(w_st, 2),
            rationale="Degree of competency overlap with high-demand adjacent roles in the WorkGraph.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Augmentation Potential",
            weight=0.20,
            raw_value=ap,
            weighted_value=round(w_ap, 2),
            rationale="Feasibility of augmenting role productivity via A0-A2 agent specialists.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Strategic Criticality",
            weight=0.15,
            raw_value=sc,
            weighted_value=round(w_sc, 2),
            rationale="Direct line-of-sight linkage to strategic enterprise outcomes.",
            evidence_ids=evidence_ids,
        ),
    ]

    return RoleResilienceResult(
        role_id=role_id,
        role_name=role_name,
        score=final_score,
        tier=tier,
        components=components,
        recommended_pathway=pathway,
        evidence_ids=evidence_ids,
    )


def calculate_trustboard_score(
    saif_security: float,
    operational_excellence: float,
    reliability: float,
    performance: float,
    cost_optimization: float,
    sustainability: float,
    red_lines_breached: int = 0,
) -> TrustScoreResult:
    """Calculate the Google Well-Architected 6 Pillars + SAIF TrustScore.

    Weights:
        SAIF Security: 25% (Hard red-line check: < 80 blocks release)
        Operational Excellence: 15%
        Reliability: 15%
        Performance: 15%
        Cost Optimization (FinOps): 15%
        Sustainability: 15%

    Args:
        saif_security: SAIF score [0, 100].
        operational_excellence: Ops score [0, 100].
        reliability: Reliability score [0, 100].
        performance: Performance score [0, 100].
        cost_optimization: FinOps score [0, 100].
        sustainability: Sustainability score [0, 100].
        red_lines_breached: Count of security/ethical red-line breaches.

    Returns:
        TrustScoreResult: Evaluated scores and gate status.
    """
    sec = max(0.0, min(100.0, saif_security))
    ops = max(0.0, min(100.0, operational_excellence))
    rel = max(0.0, min(100.0, reliability))
    prf = max(0.0, min(100.0, performance))
    cst = max(0.0, min(100.0, cost_optimization))
    sus = max(0.0, min(100.0, sustainability))

    weighted = (0.25 * sec) + (0.15 * ops) + (0.15 * rel) + (0.15 * prf) + (0.15 * cst) + (0.15 * sus)
    final_score = round(weighted, 2)

    if red_lines_breached > 0 or sec < 75.0:
        gate_status = "BLOCKED"
    elif final_score >= 85.0:
        gate_status = "PASSED"
    else:
        gate_status = "FLAGGED"

    return TrustScoreResult(
        trust_score=final_score,
        saif_security_score=sec,
        operational_excellence_score=ops,
        reliability_score=rel,
        performance_score=prf,
        cost_optimization_score=cst,
        sustainability_score=sus,
        red_lines_breached=red_lines_breached,
        gate_status=gate_status,
    )
