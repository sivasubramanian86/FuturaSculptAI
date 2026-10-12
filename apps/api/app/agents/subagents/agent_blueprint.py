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
        req = context.request
        target_role = req.target_role_id or "ROL-001"

        blueprint = AgentBlueprintSpec(
            blueprint_id="ADK-SPEC-001",
            name="PackagingVisionAgent",
            target_role_id=target_role,
            model_tier="gemini-2.5-flash",
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            tools_bound=[
                "edge_camera_stream_reader",
                "defect_classifier_adk_tool",
                "diverter_gate_actuator",
                "hitl_supervisor_notifier",
            ],
            trigger_events=["CONVEYOR_ITEM_PRESENT", "SEAL_BAR_RELEASE"],
            circuit_breaker_condition="consecutive_low_confidence_inferences >= 3",
            rollback_procedure="Gracefully bypass pneumatic diverter and route stream to human inspector cockpit.",
        )

        blueprints: List[AgentBlueprintSpec] = [blueprint]
        context.shared_memory["agent_blueprints"] = blueprints

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought="Synthesizing concrete Google ADK agent specifications, tool contracts, and safety circuit breakers.",
            tool_called="generate_adk_agent_blueprint",
            observation=(
                f"Generated Google ADK specification for {blueprint.name} bound to role {target_role}. "
                f"Configured 4 tools, fail-safe circuit breaker, and rollback procedure."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )
