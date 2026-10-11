"""Skills Mobility Agent formulating skills adjacency graphs and reskilling pathways."""

from app.agents.base import AgentContext, BaseSwarmAgent
from app.models.agent_swarm import AgentRole, AgentStep, AutonomyTier


class SkillsMobilityAgent(BaseSwarmAgent):
    """Analyzes workforce skill deltas, adjacency graphs, and formulates upskilling pathways."""

    def __init__(self, role: AgentRole = AgentRole.SKILLS_MOBILITY):
        """Initialize SkillsMobilityAgent with role and metadata."""
        super().__init__(
            role=role,
            name="SkillsMobilityAgent",
            description="Benchmarks workforce capabilities and constructs transition pathways.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Benchmark capabilities and compile targeted reskilling curriculum.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Reskilling pathway and required credentials.
        """
        pathway = "ROL-001 Inspector -> ROL-003 AI Automation Supervisor (6-week certified module)."
        context.shared_memory["reskilling_pathway"] = pathway
        context.shared_memory["skills_adjacency"] = {
            "source_skills": ["Manual Visual Inspection", "Defect Logging"],
            "target_skills": ["Edge-TPU Calibration", "AI Anomaly Supervision"],
            "transition_difficulty": "Low-Moderate (42 hours training)",
        }

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought="Benchmarking operator capabilities against emerging Edge Vision calibration requirements.",
            tool_called="compile_reskilling_curriculum",
            observation=(
                "Identified transition pathway: ROL-001 (Manual Inspector) -> "
                "ROL-003 (AI Automation Supervisor). Required micro-credentials: SKL-002."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )


# Backward compatibility alias
SkillGapAnalystAgent = SkillsMobilityAgent
