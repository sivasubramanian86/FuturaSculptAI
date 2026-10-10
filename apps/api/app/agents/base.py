"""Base abstractions and execution contracts for Google ADK Swarm Agents."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List

from app.models.agent_swarm import AgentRole, AgentStep, SwarmRunRequest


@dataclass
class AgentContext:
    """Execution context and shared state for multi-agent swarm deliberation."""

    tenant_id: str
    request: SwarmRunRequest
    citations: List[str]
    step_index: int = 1
    shared_memory: Dict[str, Any] = field(default_factory=dict)


class BaseSwarmAgent(ABC):
    """Abstract Base Class for specialist Google ADK swarm agents."""

    def __init__(self, role: AgentRole, name: str, description: str):
        """Initialize the swarm agent with role, identity, and description."""
        self.role = role
        self.name = name
        self.description = description

    @abstractmethod
    async def execute(self, context: AgentContext) -> AgentStep:
        """Execute agent reasoning, tool invocation, and observation generation.

        Args:
            context: Shared swarm deliberation context and memory.

        Returns:
            AgentStep: Verifiable step recorded in trajectory ledger.
        """
        raise NotImplementedError
