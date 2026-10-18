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
        from app.agents.enterprise_profiles import resolve_enterprise_profile

        profile = context.shared_memory.get("enterprise_profile") or resolve_enterprise_profile(context.request)
        pathway = profile.reskilling_pathway
        context.shared_memory["reskilling_pathway"] = pathway
        context.shared_memory["skills_adjacency"] = {
            "source_skills": profile.source_skills,
            "target_skills": profile.target_skills,
            "transition_difficulty": profile.transition_difficulty,
        }

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought=f"Benchmarking {profile.target_role_name} capabilities at {profile.company_name} against emerging automation requirements.",
            tool_called="compile_reskilling_curriculum",
            observation=(
                f"Identified transition pathway: {pathway}. "
                f"Curriculum difficulty: {profile.transition_difficulty}."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )


# Backward compatibility alias
SkillGapAnalystAgent = SkillsMobilityAgent
