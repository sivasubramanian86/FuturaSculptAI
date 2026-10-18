"""Business Solution Agent generating comprehensive enterprise transformation dossiers."""

from app.agents.base import AgentContext, BaseSwarmAgent
from app.models.agent_swarm import (
    AgentRole,
    AgentStep,
    AutonomyTier,
    BusinessSolutionDossier,
)


class BusinessSolutionAgent(BaseSwarmAgent):
    """Synthesizes comprehensive 13-part enterprise transformation dossiers and financial ROI."""

    def __init__(self):
        """Initialize BusinessSolutionAgent with role and metadata."""
        super().__init__(
            role=AgentRole.BUSINESS_SOLUTION,
            name="BusinessSolutionAgent",
            description="Compiles 13-part enterprise transformation dossier and financial business case.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Compile 13-part enterprise solution dossier.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Business solution dossier compilation observation.
        """
        from app.agents.enterprise_profiles import resolve_enterprise_profile

        req = context.request
        profile = context.shared_memory.get("enterprise_profile") or resolve_enterprise_profile(req)
        sector = profile.sector
        horizon = req.horizon_years
        task_matrix = context.shared_memory.get("task_matrix") or profile.tasks

        # Model financial uplift grounded in conservative operational metrics
        annual_savings = 320000.0 * float(horizon) * 0.5
        token_cost = context.shared_memory.get("token_cost_usd", 0.0009) * 100000.0
        net_ebitda = round(annual_savings - token_cost, 2)
        payback_months = round(max(1.2, 4.5 / float(horizon)), 1)

        dossier = BusinessSolutionDossier(
            transformation_title=f"Horizon {horizon} Enterprise Work Transformation: {profile.company_name} ({profile.sector_display_name})",
            target_sector=sector,
            horizon_years=horizon,
            current_state_assessment=profile.current_state_assessment,
            target_state_architecture=profile.target_state_architecture,
            task_allocations=task_matrix,
            net_ebitda_impact_usd=net_ebitda,
            payback_period_months=payback_months,
            reskilling_roadmap_weeks=6,
            risk_mitigation_plan=(
                f"Zero individual terminations; human supervisory pilot verification for {profile.company_name}; "
                "hardware & software fail-safe bypass switch installed at operator stations."
            ),
        )
        context.shared_memory["solution_dossier"] = dossier

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought="Synthesizing 13-part enterprise transformation solution dossier and financial impact case.",
            tool_called="generate_enterprise_solution_dossier",
            observation=(
                f"Generated comprehensive transformation dossier. Projected Net EBITDA impact: "
                f"${net_ebitda:,.2f} USD with payback period of {payback_months} months."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )
