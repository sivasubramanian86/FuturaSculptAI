"""Governance Critic Agent (backward-compatibility alias for TrustGovernanceAgent)."""

from app.agents.subagents.trust_governance import GovernanceCriticAgent, TrustGovernanceAgent

__all__ = ["GovernanceCriticAgent", "TrustGovernanceAgent"]
