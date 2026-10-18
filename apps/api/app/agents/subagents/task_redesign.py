"""Task Redesign Agent analyzing 6-part task classification (Retain, Assist, Augment, Automate, Redesign, Retire)."""

from typing import List

from app.agents.base import AgentContext, BaseSwarmAgent
from app.agents.prompt_orchestrator import prompt_orchestrator
from app.models.agent_swarm import (
    AgentRole,
    AgentStep,
    AutonomyTier,
    TaskAllocationItem,
)


class TaskRedesignAgent(BaseSwarmAgent):
    """Decomposes enterprise workflows into human agency and autonomous agent triage."""

    def __init__(self, role: AgentRole = AgentRole.TASK_REDESIGN):
        """Initialize TaskRedesignAgent with role and metadata."""
        super().__init__(
            role=role,
            name="TaskRedesignAgent",
            description="Classifies workflow tasks into Retain, Assist, Augment, Automate, Redesign, Retire.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Calculate human vs agent work allocation split and fine-grained task matrix.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Work allocation analysis and task decomposition.
        """
        # Execute dynamic Gemini LLM reasoning via Prompt Orchestrator
        decomposer_output = await prompt_orchestrator.execute_decomposer_reasoning(context)
        human_work_pct = decomposer_output.human_work_pct
        agent_work_pct = decomposer_output.agent_work_pct

        context.shared_memory["human_work_pct"] = human_work_pct
        context.shared_memory["agent_work_pct"] = agent_work_pct

        from app.agents.enterprise_profiles import resolve_enterprise_profile

        profile = context.shared_memory.get("enterprise_profile") or resolve_enterprise_profile(context.request)
        task_matrix: List[TaskAllocationItem] = profile.tasks
        context.shared_memory["task_matrix"] = task_matrix

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought=f"Decomposing {profile.company_name} {profile.target_capability_name} into cognitive triage and physical verification segments.",
            tool_called="calculate_work_allocation_split",
            observation=(
                f"Assigned {agent_work_pct:.1f}% routine triage to {profile.blueprint_agent_name}; "
                f"preserved {human_work_pct:.1f}% complex anomaly adjudication for {profile.target_role_name}."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )


# Backward compatibility alias
TaskDecomposerAgent = TaskRedesignAgent
