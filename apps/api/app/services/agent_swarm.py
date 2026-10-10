"""Compatibility bridge re-exporting SwarmOrchestrator from app.agents."""

from app.agents.orchestrator import SwarmOrchestrator, swarm_orchestrator

__all__ = ["SwarmOrchestrator", "swarm_orchestrator"]
