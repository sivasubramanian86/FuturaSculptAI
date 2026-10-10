"""Pydantic schemas for the Temporal Work Transformation Graph."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class NodeType(str, Enum):
    """The 11 core Work Transformation Graph node classes."""

    OUTCOME = "outcome"
    CAPABILITY = "capability"
    WORKFLOW = "workflow"
    TASK = "task"
    ROLE = "role"
    SKILL = "skill"
    SYSTEM = "system"
    DATA = "data"
    AGENT = "agent"
    CONTROL = "control"
    TECHNOLOGY = "technology"


class EdgeType(str, Enum):
    """Directional semantic relationships between graph nodes."""

    SUPPORTS = "supports"
    DECOMPOSES_INTO = "decomposes_into"
    EXECUTES = "executes"
    REQUIRES_SKILL = "requires_skill"
    OPERATES_SYSTEM = "operates_system"
    GOVERNED_BY = "governed_by"
    AUGMENTED_BY = "augmented_by"
    ENABLED_BY = "enabled_by"
    PRODUCES_DATA = "produces_data"


class NodeProperties(BaseModel):
    """Dynamic properties specific to node types."""

    sector: str = "food_manufacturing"
    status: str = "baseline"  # baseline | proposed | transformed | retired
    criticality: str = "high"
    cost_per_hour: Optional[float] = None
    cycle_time_seconds: Optional[float] = None
    maturity_level: Optional[str] = None  # emerging | accelerating | mature
    extra: Dict[str, Any] = {}


class WorkGraphNode(BaseModel):
    """A discrete enterprise operating model entity."""

    node_id: str
    tenant_id: str
    node_type: NodeType
    name: str
    description: str
    properties: NodeProperties = Field(default_factory=NodeProperties)
    valid_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    valid_to: Optional[datetime] = None
    is_current: bool = True
    evidence_ids: List[str] = []


class WorkGraphEdge(BaseModel):
    """Directional relationship connecting two WorkGraph nodes."""

    edge_id: str
    tenant_id: str
    source_node_id: str
    target_node_id: str
    relation_type: EdgeType
    allocation_percentage: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    impact_weight: float = Field(default=1.0, ge=-1.0, le=1.0)
    valid_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    valid_to: Optional[datetime] = None
    is_current: bool = True
    evidence_ids: List[str] = []


class WorkGraphResponse(BaseModel):
    """Container payload for graph queries and visualizer renders."""

    tenant_id: str
    sector: str
    nodes: List[WorkGraphNode]
    edges: List[WorkGraphEdge]
    total_nodes: int
    total_edges: int
    as_of: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
