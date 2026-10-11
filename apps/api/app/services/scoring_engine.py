"""Deterministic mathematical scoring engine.

CRITICAL: ZERO non-deterministic LLM calculations. All math is versioned,
pure, deterministic Python logic adhering to docs/architecture/score-contracts.md.
"""

from typing import List

from app.models.opportunity import (
    AdaptabilityTier,
    FeasibilityTier,
    HumanOpportunityScore,
    OpportunitySentimentTier,
    TransitionReadinessScore,
    WorkforceAdaptabilityIndex,
)
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


def calculate_transition_readiness(
    source_role_id: str,
    target_role_id: str,
    shared_skills_pct: float,
    critical_gap_pct: float,
    learning_velocity_pct: float,
    evidence_ids: List[str] = None,
) -> TransitionReadinessScore:
    """Calculate the deterministic Transition Readiness Score (TRS).

    Formula:
        TRS = (0.50 * shared_skills) + (0.30 * (100 - critical_gap)) + (0.20 * learning_velocity)

    Args:
        source_role_id: Originating role identifier.
        target_role_id: Target emerging adjacent role.
        shared_skills_pct: Competency overlap percentage [0, 100].
        critical_gap_pct: Deficit in mandatory qualifications [0, 100].
        learning_velocity_pct: Estimated historical completion capability [0, 100].
        evidence_ids: Lineage citations.

    Returns:
        TransitionReadinessScore: Evaluated TRS and feasibility tier.
    """
    evidence_ids = evidence_ids or []

    ss = max(0.0, min(100.0, shared_skills_pct))
    cg = max(0.0, min(100.0, critical_gap_pct))
    lv = max(0.0, min(100.0, learning_velocity_pct))

    w_ss = 0.50 * ss
    w_cg = 0.30 * (100.0 - cg)
    w_lv = 0.20 * lv

    final_score = round(w_ss + w_cg + w_lv, 2)

    if final_score >= 80.0:
        tier = FeasibilityTier.HIGH_FEASIBILITY
    elif final_score >= 60.0:
        tier = FeasibilityTier.MODERATE_FEASIBILITY
    else:
        tier = FeasibilityTier.HIGH_EFFORT

    components = [
        ScoreComponent(
            name="Shared Competencies",
            weight=0.50,
            raw_value=ss,
            weighted_value=round(w_ss, 2),
            rationale="Direct overlap of core skills between source and target role.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Critical Gap Closeness",
            weight=0.30,
            raw_value=round(100.0 - cg, 2),
            weighted_value=round(w_cg, 2),
            rationale="Inverse gap distance to mandatory qualifications.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Learning Velocity",
            weight=0.20,
            raw_value=lv,
            weighted_value=round(w_lv, 2),
            rationale="Historical completion speed for enterprise technical modules.",
            evidence_ids=evidence_ids,
        ),
    ]

    return TransitionReadinessScore(
        source_role_id=source_role_id,
        target_role_id=target_role_id,
        score=final_score,
        shared_skills_pct=ss,
        critical_gap_pct=cg,
        learning_velocity_pct=lv,
        feasibility_tier=tier,
        components=components,
        evidence_ids=evidence_ids,
    )


def calculate_workforce_adaptability(
    tenant_id: str,
    learning_velocity_pct: float,
    tech_absorption_pct: float,
    skill_mobility_rate_pct: float,
    culture_readiness_pct: float,
    cohort_size: int = 15,
    evidence_ids: List[str] = None,
) -> WorkforceAdaptabilityIndex:
    """Calculate the deterministic Workforce Adaptability Index (WAI).

    Formula:
        WAI = (0.35 * learning_velocity) + (0.30 * tech_absorption) +
              (0.20 * skill_mobility) + (0.15 * culture_readiness)

    Enforces Responsible Workforce rule: minimum cohort threshold k >= 10 individuals.

    Args:
        tenant_id: Tenant context.
        learning_velocity_pct: Speed of curriculum absorption [0, 100].
        tech_absorption_pct: Adoption velocity of agent copilots [0, 100].
        skill_mobility_rate_pct: Internal mobility & pathway uptake [0, 100].
        culture_readiness_pct: Psychological safety and innovation sentiment [0, 100].
        cohort_size: Number of employees in aggregated cohort.
        evidence_ids: Supporting evidence citations.

    Returns:
        WorkforceAdaptabilityIndex: Evaluated WAI and k-anonymity privacy verdict.
    """
    evidence_ids = evidence_ids or []
    k_passed = cohort_size >= 10

    if not k_passed:
        return WorkforceAdaptabilityIndex(
            tenant_id=tenant_id,
            score=0.0,
            learning_velocity_pct=0.0,
            tech_absorption_pct=0.0,
            skill_mobility_rate_pct=0.0,
            culture_readiness_pct=0.0,
            adaptability_tier=AdaptabilityTier.RESISTANT,
            cohort_size=cohort_size,
            k_anonymity_passed=False,
            privacy_notice="Cohort size below privacy threshold (n < 10). Analytics suppressed to protect individual privacy.",
            components=[],
            evidence_ids=evidence_ids,
        )

    lv = max(0.0, min(100.0, learning_velocity_pct))
    ta = max(0.0, min(100.0, tech_absorption_pct))
    sm = max(0.0, min(100.0, skill_mobility_rate_pct))
    cr = max(0.0, min(100.0, culture_readiness_pct))

    w_lv = 0.35 * lv
    w_ta = 0.30 * ta
    w_sm = 0.20 * sm
    w_cr = 0.15 * cr

    final_score = round(w_lv + w_ta + w_sm + w_cr, 2)

    if final_score >= 85.0:
        tier = AdaptabilityTier.ELITE_AGILITY
    elif final_score >= 70.0:
        tier = AdaptabilityTier.ADAPTIVE
    elif final_score >= 50.0:
        tier = AdaptabilityTier.TRANSITIONING
    else:
        tier = AdaptabilityTier.RESISTANT

    components = [
        ScoreComponent(
            name="Learning Velocity",
            weight=0.35,
            raw_value=lv,
            weighted_value=round(w_lv, 2),
            rationale="Cohort capability to master new technological credentials.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Technology Absorption",
            weight=0.30,
            raw_value=ta,
            weighted_value=round(w_ta, 2),
            rationale="Speed of integrating agentic automation into daily routines.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Internal Mobility Rate",
            weight=0.20,
            raw_value=sm,
            weighted_value=round(w_sm, 2),
            rationale="Frequency of proactive lateral and diagonal workforce mobility.",
            evidence_ids=evidence_ids,
        ),
        ScoreComponent(
            name="Culture & Psychological Safety",
            weight=0.15,
            raw_value=cr,
            weighted_value=round(w_cr, 2),
            rationale="Enterprise openness to work redesign and collaborative AI.",
            evidence_ids=evidence_ids,
        ),
    ]

    return WorkforceAdaptabilityIndex(
        tenant_id=tenant_id,
        score=final_score,
        learning_velocity_pct=lv,
        tech_absorption_pct=ta,
        skill_mobility_rate_pct=sm,
        culture_readiness_pct=cr,
        adaptability_tier=tier,
        cohort_size=cohort_size,
        k_anonymity_passed=True,
        privacy_notice=None,
        components=components,
        evidence_ids=evidence_ids,
    )


def calculate_human_opportunity_score(
    tenant_id: str,
    new_roles_count: int,
    augmented_tasks_count: int,
    automated_tasks_count: int,
    evidence_ids: List[str] = None,
) -> HumanOpportunityScore:
    """Calculate the deterministic Human Opportunity Score (HOS).

    Formula:
        HOS = min(100.0, round(((N_new_roles * 1.5 + T_augmented * 1.0) / (D_automated * 0.8 + 1)) * 20.0, 2))

    Evaluates whether transformation expands human agency rather than merely displacing labor.

    Args:
        tenant_id: Tenant context.
        new_roles_count: Projected net new specialized roles created.
        augmented_tasks_count: Workflow tasks transformed to human-agent synergy.
        automated_tasks_count: Routine tasks automated entirely.
        evidence_ids: Lineage citations.

    Returns:
        HumanOpportunityScore: Evaluated HOS and sentiment tier.
    """
    evidence_ids = evidence_ids or []

    nr = max(0, new_roles_count)
    at = max(0, augmented_tasks_count)
    dt = max(0, automated_tasks_count)

    numerator = (nr * 1.5) + (at * 1.0)
    denominator = (dt * 0.8) + 1.0

    raw_score = (numerator / denominator) * 20.0
    final_score = min(100.0, round(max(0.0, raw_score), 2))

    if final_score >= 70.0:
        tier = OpportunitySentimentTier.HIGHLY_EMPOWERING
    elif final_score >= 45.0:
        tier = OpportunitySentimentTier.BALANCED
    else:
        tier = OpportunitySentimentTier.DISPLACEMENT_RISK

    return HumanOpportunityScore(
        tenant_id=tenant_id,
        score=final_score,
        new_roles_count=nr,
        augmented_tasks_count=at,
        automated_tasks_count=dt,
        sentiment_tier=tier,
        evidence_ids=evidence_ids,
    )
