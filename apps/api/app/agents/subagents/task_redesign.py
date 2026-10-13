"""Task Redesign Agent analyzing 6-part task classification (Retain, Assist, Augment, Automate, Redesign, Retire)."""

from typing import List

from app.agents.base import AgentContext, BaseSwarmAgent
from app.agents.prompt_orchestrator import prompt_orchestrator
from app.models.agent_swarm import (
    AgentRole,
    AgentStep,
    AutonomyTier,
    TaskAllocationItem,
    TaskClassificationType,
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

        # 6-part task taxonomy allocation
        task_matrix: List[TaskAllocationItem] = [
            TaskAllocationItem(
                task_id="TSK-001",
                task_name="Continuous Surface Defect Screening",
                classification=TaskClassificationType.AUTOMATE,
                human_share_pct=0.0,
                agent_share_pct=100.0,
                justification="Repetitive high-frequency inspection suited for Edge-TPU vision inference.",
            ),
            TaskAllocationItem(
                task_id="TSK-002",
                task_name="Anomalous Seal Defect Adjudication",
                classification=TaskClassificationType.AUGMENT,
                human_share_pct=60.0,
                agent_share_pct=40.0,
                justification="Critical regulatory boundary requiring human operator sign-off with AI assistance.",
            ),
            TaskAllocationItem(
                task_id="TSK-003",
                task_name="Sensor Calibration & Optical Alignment",
                classification=TaskClassificationType.RETAIN,
                human_share_pct=100.0,
                agent_share_pct=0.0,
                justification="Physical precision intervention retained exclusively by certified technician.",
            ),
        ]
        context.shared_memory["task_matrix"] = task_matrix

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


# Backward compatibility alias
TaskDecomposerAgent = TaskRedesignAgent
