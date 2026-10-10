"""Temporal WorkGraph Engine implementing NetworkX graph traversal and blast radius analytics."""

from typing import List, Optional, Set, Tuple

import networkx as nx

from app.models.temporal_workgraph import (
    BlastRadiusNodeImpact,
    BlastRadiusResponse,
    TemporalSimulationSummary,
)
from app.models.workgraph import (
    EdgeType,
    NodeProperties,
    NodeType,
    WorkGraphEdge,
    WorkGraphNode,
    WorkGraphResponse,
)
from app.services.workgraph_service import get_food_manufacturing_seed_graph


class TemporalGraphEngine:
    """Manages temporal snapshots, horizon projection, and directed dependency blast radius."""

    def build_networkx_graph(self, response: WorkGraphResponse) -> nx.DiGraph:
        """Construct a NetworkX DiGraph representation from WorkGraphResponse.

        Args:
            response: WorkGraphResponse containing nodes and edges.

        Returns:
            nx.DiGraph: Directed graph with node and edge attributes.
        """
        graph = nx.DiGraph()
        for node in response.nodes:
            graph.add_node(
                node.node_id,
                name=node.name,
                node_type=node.node_type.value,
                description=node.description,
                properties=node.properties,
                evidence_ids=node.evidence_ids,
            )

        for edge in response.edges:
            graph.add_edge(
                edge.source_node_id,
                edge.target_node_id,
                edge_id=edge.edge_id,
                relation_type=edge.relation_type.value,
                allocation_percentage=edge.allocation_percentage,
                impact_weight=edge.impact_weight,
            )
        return graph

    def get_temporal_projection(
        self, tenant_id: str, horizon_year: int = 0
    ) -> Tuple[WorkGraphResponse, TemporalSimulationSummary]:
        """Project the Work Transformation Graph at a specific future horizon.

        Args:
            tenant_id: Tenant identifier.
            horizon_year: 0 (Baseline), 1 (Augmented Hybrid), 3 (Autonomous Transformation).

        Returns:
            Tuple[WorkGraphResponse, TemporalSimulationSummary]: Graph snapshot and summary.
        """
        base_graph = get_food_manufacturing_seed_graph(tenant_id)
        nodes: List[WorkGraphNode] = [n.model_copy() for n in base_graph.nodes]
        edges: List[WorkGraphEdge] = [e.model_copy() for e in base_graph.edges]

        if horizon_year == 0:
            # Baseline: 100% human task allocation, agents in planning status
            for node in nodes:
                if node.node_type == NodeType.AGENT:
                    node.properties.status = "baseline"
            summary = TemporalSimulationSummary(
                horizon_year=0,
                human_task_allocation_pct=100.0,
                agent_task_allocation_pct=0.0,
                active_agent_count=0,
                active_human_roles_count=2,
                net_productivity_gain_pct=0.0,
                governance_checkpoint_count=2,
            )
        elif horizon_year <= 2:
            # Year 1-2: Hybrid Human-in-the-Loop Augmentation
            for node in nodes:
                if node.node_id == "AGT-001":
                    node.properties.status = "transformed"
                if node.node_id == "TSK-001":
                    node.properties.status = "transformed"
                    node.properties.cycle_time_seconds = 0.8

            # Update allocation edge: 40% agent allocation
            for edge in edges:
                if edge.edge_id == "EDG-008":
                    edge.allocation_percentage = 40.0

            # Add reskilling skill node
            nodes.append(
                WorkGraphNode(
                    node_id="SKL-002",
                    tenant_id=tenant_id,
                    node_type=NodeType.SKILL,
                    name="Computer Vision Edge Model Tuning",
                    description="Frontline operator skill to supervise confidence drift on seal cameras.",
                    properties=NodeProperties(
                        sector="food_manufacturing",
                        status="transformed",
                        criticality="high",
                    ),
                    evidence_ids=["EVD-RESKILL-01"],
                )
            )
            edges.append(
                WorkGraphEdge(
                    edge_id="EDG-011",
                    tenant_id=tenant_id,
                    source_node_id="ROL-001",
                    target_node_id="SKL-002",
                    relation_type=EdgeType.REQUIRES_SKILL,
                    impact_weight=0.9,
                    evidence_ids=["EVD-RESKILL-01"],
                )
            )

            summary = TemporalSimulationSummary(
                horizon_year=horizon_year,
                human_task_allocation_pct=60.0,
                agent_task_allocation_pct=40.0,
                active_agent_count=1,
                active_human_roles_count=2,
                net_productivity_gain_pct=22.5,
                governance_checkpoint_count=3,
            )
        else:
            # Year 3+: Autonomous Continuous Transformation (A2/A3 supervisor)
            for node in nodes:
                if node.node_id == "AGT-001":
                    node.properties.status = "transformed"
                if node.node_id == "TSK-001":
                    node.properties.status = "transformed"
                    node.properties.cycle_time_seconds = 0.2

            for edge in edges:
                if edge.edge_id == "EDG-008":
                    edge.allocation_percentage = 80.0

            # Add AI Automation Lead Role
            nodes.append(
                WorkGraphNode(
                    node_id="ROL-003",
                    tenant_id=tenant_id,
                    node_type=NodeType.ROLE,
                    name="Automation Quality Supervisor",
                    description="Elevated operational role supervising multi-agent fleets and anomaly escalations.",
                    properties=NodeProperties(
                        sector="food_manufacturing",
                        status="transformed",
                        criticality="critical",
                        cost_per_hour=45.0,
                    ),
                    evidence_ids=["EVD-ROLE-03"],
                )
            )
            edges.append(
                WorkGraphEdge(
                    edge_id="EDG-012",
                    tenant_id=tenant_id,
                    source_node_id="ROL-003",
                    target_node_id="AGT-001",
                    relation_type=EdgeType.GOVERNED_BY,
                    impact_weight=1.0,
                    evidence_ids=["EVD-ROLE-03"],
                )
            )

            summary = TemporalSimulationSummary(
                horizon_year=horizon_year,
                human_task_allocation_pct=20.0,
                agent_task_allocation_pct=80.0,
                active_agent_count=2,
                active_human_roles_count=3,
                net_productivity_gain_pct=58.0,
                governance_checkpoint_count=4,
            )

        response = WorkGraphResponse(
            tenant_id=tenant_id,
            sector="food_manufacturing",
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges),
        )
        return response, summary

    def compute_blast_radius(self, tenant_id: str, node_id: str, max_depth: int = 3) -> Optional[BlastRadiusResponse]:
        """Compute downstream impact cascade using directed graph reachability.

        Args:
            tenant_id: Tenant identifier.
            node_id: Root target node initiating change or failure.
            max_depth: Maximum BFS edge exploration depth (1 to 5).

        Returns:
            Optional[BlastRadiusResponse]: Blast radius cascade or None if node not found.
        """
        base_graph = get_food_manufacturing_seed_graph(tenant_id)
        graph = self.build_networkx_graph(base_graph)

        if node_id not in graph:
            return None

        target_data = graph.nodes[node_id]
        target_name = target_data.get("name", node_id)
        target_type = target_data.get("node_type", "unknown")

        visited: Set[str] = set()
        queue: List[Tuple[str, int, List[str]]] = [(node_id, 0, [node_id])]
        cascade: List[BlastRadiusNodeImpact] = []

        affected_roles: List[str] = []
        affected_tasks: List[str] = []
        affected_systems: List[str] = []
        affected_controls: List[str] = []

        while queue:
            curr_id, depth, chain = queue.pop(0)
            if depth > 0 and curr_id not in visited:
                visited.add(curr_id)
                curr_node = graph.nodes[curr_id]
                curr_type = curr_node.get("node_type", "")
                curr_name = curr_node.get("name", curr_id)

                cascade.append(
                    BlastRadiusNodeImpact(
                        node_id=curr_id,
                        name=curr_name,
                        node_type=curr_type,
                        depth=depth,
                        relationship_chain=chain,
                    )
                )

                if curr_type == NodeType.ROLE.value and curr_name not in affected_roles:
                    affected_roles.append(curr_name)
                elif curr_type == NodeType.TASK.value and curr_name not in affected_tasks:
                    affected_tasks.append(curr_name)
                elif curr_type == NodeType.SYSTEM.value and curr_name not in affected_systems:
                    affected_systems.append(curr_name)
                elif curr_type == NodeType.CONTROL.value and curr_name not in affected_controls:
                    affected_controls.append(curr_name)

            if depth < max_depth:
                # Explore both forward successors and upstream execution dependencies
                neighbors = set(graph.successors(curr_id)).union(graph.predecessors(curr_id))
                for neighbor in sorted(neighbors):
                    if neighbor not in visited and neighbor != node_id:
                        queue.append((neighbor, depth + 1, chain + [neighbor]))

        # Assess disruption risk
        has_critical_control = len(affected_controls) > 0
        total_affected = len(cascade)

        if has_critical_control or total_affected >= 5:
            disruption_risk = "CRITICAL"
        elif total_affected >= 3:
            disruption_risk = "HIGH"
        elif total_affected >= 1:
            disruption_risk = "MEDIUM"
        else:
            disruption_risk = "LOW"

        return BlastRadiusResponse(
            target_node_id=node_id,
            target_node_name=target_name,
            target_node_type=target_type,
            total_affected_nodes=total_affected,
            affected_roles=affected_roles,
            affected_tasks=affected_tasks,
            affected_systems=affected_systems,
            affected_controls=affected_controls,
            cascade=cascade,
            disruption_risk=disruption_risk,
        )


temporal_graph_engine = TemporalGraphEngine()
