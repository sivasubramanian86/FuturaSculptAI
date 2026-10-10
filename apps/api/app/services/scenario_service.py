"""Future Scenario Foundry domain service."""

from typing import List

from app.models.scenario import (
    FutureScenario,
    ScenarioClass,
    ScenarioComparisonResponse,
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
                "Without cobotic transformation, facility capacity maxes out by Q4 2027.",
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
                "A purely automated approach creates 40% staff turnover and union grievances.",
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
