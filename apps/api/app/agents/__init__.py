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
    CFORoleTwinAgent,
    CHRORoleTwinAgent,
    CISORoleTwinAgent,
    ConflictResolverAgent,
    CTORoleTwinAgent,
    EmployeeAdvocateRoleTwinAgent,
    EvidenceVerifierAgent,
    FuturaBoardroomCoordinator,
    FutureBoardroomCoordinator,
    boardroom_coordinator,
    get_adk_boardroom_agent,
)

__all__ = [
    "AgentContext",
    "BaseSwarmAgent",
    "SwarmOrchestrator",
    "swarm_orchestrator",
    "FuturaBoardroomCoordinator",
    "FutureBoardroomCoordinator",
    "boardroom_coordinator",
    "get_adk_boardroom_agent",
    "CTORoleTwinAgent",
    "CHRORoleTwinAgent",
    "CISORoleTwinAgent",
    "CFORoleTwinAgent",
    "EmployeeAdvocateRoleTwinAgent",
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
