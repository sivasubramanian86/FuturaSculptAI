"""Task Decomposition Agent analyzing cognitive vs routine task allocation splits."""

from app.agents.base import AgentContext, BaseSwarmAgent
from app.models.agent_swarm import AgentRole, AgentStep, AutonomyTier


class TaskDecomposerAgent(BaseSwarmAgent):
    """Decomposes enterprise workflows into human agency and autonomous agent triage."""

    def __init__(self):
        """Initialize TaskDecomposerAgent with role and metadata."""
        super().__init__(
            role=AgentRole.TASK_DECOMPOSER,
            name="TaskDecompositionAgent",
            description="Decomposes workflow tasks into human operator and autonomous agent shares.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Calculate human vs agent work allocation split.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Work allocation analysis and task decomposition.
        """
        req = context.request
        human_work_pct = 100.0 - min(80.0, float(req.horizon_years) * 26.0)
        agent_work_pct = 100.0 - human_work_pct

        context.shared_memory["human_work_pct"] = human_work_pct
        context.shared_memory["agent_work_pct"] = agent_work_pct

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought="Decomposing visual seal verification task into cognitive triage and physical verification segments.",
            tool_called="calculate_work_allocation_split",
            observation=(
                f"Assigned {agent_work_pct:.1f}% routine visual defect triage to AGT-001; "
                f"preserved {human_work_pct:.1f}% complex anomaly adjudication for human operator."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )
