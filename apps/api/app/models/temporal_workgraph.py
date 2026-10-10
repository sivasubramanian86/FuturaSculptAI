"""Pydantic schemas for temporal graph projections and blast radius analysis."""

from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


class BlastRadiusRequest(BaseModel):
    """Parameters for blast radius downstream impact analysis."""

    node_id: str
    max_depth: int = Field(default=3, ge=1, le=5)


class BlastRadiusNodeImpact(BaseModel):
    """Impact details for a single node in the downstream cascade."""

    node_id: str
    name: str
    node_type: str
    depth: int
    relationship_chain: List[str]


class BlastRadiusResponse(BaseModel):
    """Results of directed blast radius reachability traversal."""

    target_node_id: str
    target_node_name: str
    target_node_type: str
    total_affected_nodes: int
    affected_roles: List[str]
    affected_tasks: List[str]
    affected_systems: List[str]
    affected_controls: List[str]
    cascade: List[BlastRadiusNodeImpact]
    disruption_risk: str  # LOW | MEDIUM | HIGH | CRITICAL
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TemporalProjectionRequest(BaseModel):
    """Query parameters for horizon temporal snapshot."""

    horizon_year: int = Field(default=0, ge=0, le=5)
    sector: Optional[str] = "food_manufacturing"


class TemporalSimulationSummary(BaseModel):
    """Metrics comparing baseline with projected horizon transformation."""

    horizon_year: int
    human_task_allocation_pct: float
    agent_task_allocation_pct: float
    active_agent_count: int
    active_human_roles_count: int
    net_productivity_gain_pct: float
    governance_checkpoint_count: int
