"""Agent Blueprint Agent generating Google ADK specifications for proposed worker agents."""

from typing import List

from app.agents.base import AgentContext, BaseSwarmAgent
from app.models.agent_swarm import (
    AgentBlueprintSpec,
    AgentRole,
    AgentStep,
    AutonomyTier,
)


class AgentBlueprintAgent(BaseSwarmAgent):
    """Generates production-ready Google ADK agent blueprints, tool bindings, and safety circuits."""

    def __init__(self):
        """Initialize AgentBlueprintAgent with role and metadata."""
        super().__init__(
            role=AgentRole.AGENT_BLUEPRINT,
            name="AgentBlueprintAgent",
            description="Generates executable Google ADK agent specifications and tool bindings.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Formulate Google ADK agent specifications and tool bindings.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Formulated ADK agent specifications.
        """
        from app.agents.enterprise_profiles import resolve_enterprise_profile

        profile = context.shared_memory.get("enterprise_profile") or resolve_enterprise_profile(context.request)
        target_role = context.request.target_role_id or profile.target_role_id

        blueprint = AgentBlueprintSpec(
            blueprint_id=profile.blueprint_id,
            name=profile.blueprint_agent_name,
            target_role_id=target_role,
            model_tier="gemini-2.5-flash",
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            tools_bound=profile.blueprint_tools,
            trigger_events=["CONVEYOR_ITEM_PRESENT", "PROCESS_CYCLE_TRIGGER"],
            circuit_breaker_condition="consecutive_low_confidence_inferences >= 3",
            rollback_procedure=f"Gracefully bypass automated actuators and route telemetry stream to {profile.target_role_name} cockpit.",
        )

        blueprints: List[AgentBlueprintSpec] = [blueprint]
        context.shared_memory["agent_blueprints"] = blueprints

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought=f"Synthesizing Google ADK {blueprint.name} specifications, tool contracts, and safety circuit breakers for {profile.company_name}.",
            tool_called="generate_adk_agent_blueprint",
            observation=(
                f"Generated Google ADK specification for {blueprint.name} bound to role {target_role}. "
                f"Configured {len(blueprint.tools_bound)} tools, fail-safe circuit breaker, and rollback procedure."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )
