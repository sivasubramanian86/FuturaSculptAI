"""Google ADK Multi-Agent Architecture package for FuturaSculptAI."""

from app.agents.base import AgentContext, BaseSwarmAgent
from app.agents.orchestrator import SwarmOrchestrator, swarm_orchestrator
from app.agents.subagents import (
    AdversarialCriticAgent,
    AgentBlueprintAgent,
    BusinessSolutionAgent,
    FinOpsAgent,
    FinOpsEvaluatorAgent,
    FutureSignalsAgent,
    GovernanceCriticAgent,
    SkillGapAnalystAgent,
    SkillsMobilityAgent,
    TaskDecomposerAgent,
    TaskRedesignAgent,
    TrustGovernanceAgent,
    WorkGraphArchitectAgent,
)

from app.agents.adk_boardroom import (
    CHRORoleTwinAgent,
    CISORoleTwinAgent,
    ConflictResolverAgent,
    CTORoleTwinAgent,
    EvidenceVerifierAgent,
    FutureBoardroomCoordinator,
    boardroom_coordinator,
)

__all__ = [
    "AgentContext",
    "BaseSwarmAgent",
    "SwarmOrchestrator",
    "swarm_orchestrator",
    "FutureBoardroomCoordinator",
    "boardroom_coordinator",
    "CTORoleTwinAgent",
    "CHRORoleTwinAgent",
    "CISORoleTwinAgent",
    "EvidenceVerifierAgent",
    "ConflictResolverAgent",
    "WorkGraphArchitectAgent",
    "FutureSignalsAgent",
    "TaskRedesignAgent",
    "TaskDecomposerAgent",
    "SkillsMobilityAgent",
    "SkillGapAnalystAgent",
    "BusinessSolutionAgent",
    "AgentBlueprintAgent",
    "TrustGovernanceAgent",
    "GovernanceCriticAgent",
    "FinOpsAgent",
    "FinOpsEvaluatorAgent",
    "AdversarialCriticAgent",
]
