"""Future Scenario Foundry domain service and counterfactual simulation engine."""

from datetime import datetime, timezone
from typing import List, Optional

from app.models.scenario import (
    CounterfactualImpact,
    FutureScenario,
    ScenarioClass,
    ScenarioComparisonResponse,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
)


def get_scenarios_for_tenant(tenant_id: str, sector: str = "food_manufacturing") -> ScenarioComparisonResponse:
    """Generate the four canonical future scenarios for the selected enterprise tenant.

    Generates Conservative, Accelerated, Disruptive, and Human-First scenario models
    complete with 3-year EBITDA forecasts, transition costs, and explicit invalidation triggers.

    Args:
        tenant_id: Tenant identifier.
        sector: Enterprise sector (defaults to food_manufacturing).

    Returns:
        ScenarioComparisonResponse: 4 simulated scenarios with side-by-side metrics.
    """
    scenarios: List[FutureScenario] = [
        FutureScenario(
            scenario_id="SCEN-001",
            tenant_id=tenant_id,
            scenario_class=ScenarioClass.CONSERVATIVE,
            title="Assisted Line Optimization (Retrieval & Assistive Copilots)",
            horizon_years=3,
            narrative_summary=(
                "Augments manual QA inspectors with on-screen tablets displaying real-time SOP retrieval "
                "and defect image classification. Minimal process restructuring."
            ),
            ebitda_impact_usd=420000.0,
            transition_cost_usd=85000.0,
            net_new_roles=1,
            augmented_roles=4,
            displaced_tasks_pct=14.0,
            confidence_score=0.91,
            uncertainty_range_pct=10.0,
            assumptions=[
                "Manual inspectors adopt tablet assistance within 4 weeks.",
                "Line throughput remains capped at 450 units/min.",
                "False-positive reject rate improves by 25%.",
            ],
            invalidation_triggers=[
                "Operator resistance leads to < 50% copilot usage.",
                "Packaging line speed increases beyond human physical sampling capacity.",
            ],
            counterfactuals=[
                "Without copilot assistance, annual packaging defect recall risk remains at $1.8M expected loss.",
                "If frontline tablet adoption is delayed by 6 months, competitor line throughput advantage increases by 12%.",
                "Maintaining 100% manual visual inspection incurs $240,000 in continuous overtime expenditure.",
            ],
            primary_technologies=["Vertex AI Search", "Gemini 2.5 Flash Multimodal"],
            evidence_ids=["EVD-STRAT-01", "EVD-SOP-01"],
        ),
        FutureScenario(
            scenario_id="SCEN-002",
            tenant_id=tenant_id,
            scenario_class=ScenarioClass.ACCELERATED,
            title="Autonomous Vision Triage & Multi-Agent Divert Loop",
            horizon_years=3,
            narrative_summary=(
                "Deploys autonomous high-speed camera arrays linked to Google ADK specialist agents. "
                "Automates 80% of visual inspection tasks, transitioning human operators to line exception managers."
            ),
            ebitda_impact_usd=1280000.0,
            transition_cost_usd=240000.0,
            net_new_roles=3,
            augmented_roles=6,
            displaced_tasks_pct=42.0,
            confidence_score=0.84,
            uncertainty_range_pct=15.0,
            assumptions=[
                "Edge inference camera latency stays under 15ms per unit.",
                "Automated pneumatic divert arm maintains 99.9% reliability.",
                "Human inspectors transition to Vision System Stewards.",
            ],
            invalidation_triggers=[
                "Severe packaging glare or uncalibrated lighting corrupts image embeddings.",
                "Network jitter causes divert arm timing drift.",
            ],
            counterfactuals=[
                "If multi-agent integration is delayed, competitor automation lowers regional unit cost by 18%.",
                "Without pneumatic divert arm automation, line speed remains artificially throttled at 420 units/min.",
                "Failing to upskill inspectors to Vision Stewards creates a critical skill bottleneck during camera recalibration cycles.",
            ],
            primary_technologies=["Google ADK", "Edge TPU Vision Array", "BigQuery ML"],
            evidence_ids=["EVD-SOP-01", "EVD-ROLE-01"],
        ),
        FutureScenario(
            scenario_id="SCEN-003",
            tenant_id=tenant_id,
            scenario_class=ScenarioClass.DISRUPTIVE,
            title="Lights-Out Cobotic Packaging & Autonomous Self-Healing Cells",
            horizon_years=3,
            narrative_summary=(
                "Integrates physical collaborative robotics (cobotics) and autonomous quality self-healing cells. "
                "Conveyor autonomously adjusts thermal parameters to eliminate seal defects in real-time."
            ),
            ebitda_impact_usd=2450000.0,
            transition_cost_usd=680000.0,
            net_new_roles=5,
            augmented_roles=8,
            displaced_tasks_pct=68.0,
            confidence_score=0.72,
            uncertainty_range_pct=25.0,
            assumptions=[
                "Cobotics vendor achieves safety certification for human-shared plant floors.",
                "Real-time IoT feedback loop adjusts heat-sealer temperatures within 100ms.",
            ],
            invalidation_triggers=[
                "Supply chain delays on specialized high-speed cobotic arms exceed 9 months.",
                "Regulatory freeze on autonomous packaging line certification.",
            ],
            counterfactuals=[
                "Without cobotic transformation, facility capacity maxes out by Q4 2027, forcing $4.5M in greenfield plant expansion.",
                "If thermal self-healing loops fail to deploy, micro-fissure leakage causes 3.2% scrap waste annually.",
                "Delaying cobotic cell deployment allows regional competitors to capture tier-1 retail packaging contracts.",
            ],
            primary_technologies=["Industrial Cobotics", "Spatial Vision", "Eventarc / Pub/Sub"],
            evidence_ids=["EVD-STRAT-01"],
        ),
        FutureScenario(
            scenario_id="SCEN-004",
            tenant_id=tenant_id,
            scenario_class=ScenarioClass.HUMAN_FIRST,
            title="Augmented Operator Mastery & Proactive Workforce Mobility",
            horizon_years=3,
            narrative_summary=(
                "Focuses investments on frontline operator augmentation, ergonomic enhancements, "
                "and company-sponsored apprenticeships turning all packaging line workers into certified AI stewards."
            ),
            ebitda_impact_usd=1150000.0,
            transition_cost_usd=310000.0,
            net_new_roles=6,
            augmented_roles=12,
            displaced_tasks_pct=28.0,
            confidence_score=0.88,
            uncertainty_range_pct=12.0,
            assumptions=[
                "Zero involuntary workforce reductions during technology deployment.",
                "Upskilling completion rate exceeds 90% via paid micro-learning shifts.",
                "Quality defect rate drops by 80% through human-agent symbiosis.",
            ],
            invalidation_triggers=[
                "Training budget cuts or plant management prioritization of short-term volume over skilling.",
            ],
            counterfactuals=[
                "A purely automated approach creates 40% staff turnover and costly union grievances.",
                "Without dedicated micro-learning shifts, operator transition readiness remains under 45%.",
                "Eliminating operator inspection roles triggers institutional knowledge loss regarding edge-case packaging variances.",
            ],
            primary_technologies=["Personalized Pathways", "Google ADK Copilots", "TrustBoard"],
            evidence_ids=["EVD-ROLE-01", "EVD-ROLE-02"],
        ),
    ]

    return ScenarioComparisonResponse(
        tenant_id=tenant_id,
        sector=sector,
        baseline_year=2026,
        scenarios=scenarios,
    )


def get_scenario_by_id(
    tenant_id: str, scenario_id: str, sector: str = "food_manufacturing"
) -> Optional[FutureScenario]:
    """Retrieve a single future scenario by its identifier.

    Args:
        tenant_id: Tenant identifier.
        scenario_id: Target scenario identifier (e.g. SCEN-001).
        sector: Enterprise sector.

    Returns:
        Optional[FutureScenario]: Resolved scenario or None if not found.
    """
    comparison = get_scenarios_for_tenant(tenant_id, sector)
    for scen in comparison.scenarios:
        if scen.scenario_id == scenario_id:
            return scen
    return None


def simulate_counterfactual(
    tenant_id: str, request: ScenarioSimulationRequest, sector: str = "food_manufacturing"
) -> Optional[ScenarioSimulationResponse]:
    """Simulate scenario outcome under custom What-If counterfactual parameters.

    Args:
        tenant_id: Tenant identifier.
        request: Simulation request containing parameter deltas.
        sector: Enterprise sector.

    Returns:
        Optional[ScenarioSimulationResponse]: Simulated outcome or None if scenario not found.
    """
    scenario = get_scenario_by_id(tenant_id, request.scenario_id, sector)
    if not scenario:
        return None

    # Base financial and operational metrics
    base_ebitda = scenario.ebitda_impact_usd
    base_cost = scenario.transition_cost_usd
    base_displaced = scenario.displaced_tasks_pct

    # Sensitivity calculation formulas
    speed_factor = request.adoption_speed_multiplier
    wage_factor = 1.0 + (request.wage_inflation_pct / 100.0) * 0.4
    aggression_factor = request.automation_aggression**0.8
    cost_factor = (1.0 + request.capital_cost_delta_pct / 100.0) * (speed_factor**0.5)

    simulated_ebitda = round(base_ebitda * speed_factor * wage_factor * aggression_factor, 2)
    delta_ebitda = round(simulated_ebitda - base_ebitda, 2)
    simulated_cost = round(base_cost * cost_factor, 2)

    # Net roles created delta calculation
    roles_delta = round((speed_factor - 1.0) * 2.0 + (1.0 - request.automation_aggression) * 1.5)
    simulated_displaced = round(min(95.0, max(5.0, base_displaced * request.automation_aggression)), 1)

    # Invalidation triggers evaluation
    tripped_triggers: List[str] = []
    if request.adoption_speed_multiplier < 0.6:
        tripped_triggers.append("Operator resistance leads to < 50% copilot usage.")
    if request.automation_aggression > 1.8:
        tripped_triggers.append(
            "Packaging line speed or friction increases beyond human physical sampling capacity."
        )
    if request.capital_cost_delta_pct > 35.0:
        tripped_triggers.append(
            "Training budget cuts or equipment supply chain cost inflation exceeds capital limits."
        )

    # Risk categorization
    if tripped_triggers:
        risk_assessment = "ELEVATED_FRICTION"
    elif request.capital_cost_delta_pct > 20.0:
        risk_assessment = "HIGH_CAPITAL_EXPOSURE"
    elif delta_ebitda > base_ebitda * 0.3:
        risk_assessment = "HIGH_RETURN"
    else:
        risk_assessment = "LOW_VOLATILITY"

    # Narrative formulation
    narrative = (
        f"Under simulated conditions (Adoption: {speed_factor:.1f}x, Wage Growth: {request.wage_inflation_pct:.1f}%, "
        f"Aggression: {request.automation_aggression:.1f}x), projected EBITDA shifts by "
        f"{'+' if delta_ebitda >= 0 else ''}${delta_ebitda:,.2f} USD. "
    )
    if tripped_triggers:
        narrative += f"WARNING: Tripped {len(tripped_triggers)} invalidation boundary condition(s)."
    else:
        narrative += "All operating parameters remain within safe resilience envelopes."

    impact = CounterfactualImpact(
        base_ebitda_usd=base_ebitda,
        simulated_ebitda_usd=simulated_ebitda,
        delta_ebitda_usd=delta_ebitda,
        base_transition_cost_usd=base_cost,
        simulated_transition_cost_usd=simulated_cost,
        net_roles_created_delta=roles_delta,
        displaced_tasks_pct_simulated=simulated_displaced,
        risk_assessment=risk_assessment,
        tripped_triggers=tripped_triggers,
        counterfactual_narrative=narrative,
    )

    return ScenarioSimulationResponse(
        tenant_id=tenant_id,
        scenario=scenario,
        simulation_parameters=request.model_dump(),
        impact=impact,
        simulated_at=datetime.now(timezone.utc),
    )
