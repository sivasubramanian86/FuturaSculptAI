"""Work Transformation Graph (WTG) domain service."""

from typing import List

from app.models.workgraph import (
    EdgeType,
    NodeProperties,
    NodeType,
    WorkGraphEdge,
    WorkGraphNode,
    WorkGraphResponse,
)


def get_food_manufacturing_seed_graph(tenant_id: str) -> WorkGraphResponse:
    """Generate the canonical baseline Work Transformation Graph for Food Manufacturing.

    Links enterprise outcomes, capabilities, workflows, tasks, roles, skills,
    systems, agents, and controls for high-speed packaging QA.

    Args:
        tenant_id: Tenant identifier.

    Returns:
        WorkGraphResponse: Populated graph containing nodes and edges.
    """
    nodes: List[WorkGraphNode] = [
        WorkGraphNode(
            node_id="OUT-001",
            tenant_id=tenant_id,
            node_type=NodeType.OUTCOME,
            name="Zero Defect Product Recalls",
            description="Achieve < 0.001% packaging seal and labeling defect rate across all processing lines.",
            properties=NodeProperties(
                sector="food_manufacturing",
                status="baseline",
                criticality="critical",
            ),
            evidence_ids=["EVD-STRAT-01"],
        ),
        WorkGraphNode(
            node_id="CAP-001",
            tenant_id=tenant_id,
            node_type=NodeType.CAPABILITY,
            name="Automated Packaging Quality Inspection",
            description="Real-time multi-spectral vision verification of package seals, expiration date printing, and allergen labels.",
            properties=NodeProperties(
                sector="food_manufacturing",
                status="baseline",
                criticality="high",
            ),
            evidence_ids=["EVD-SOP-01"],
        ),
        WorkGraphNode(
            node_id="WF-001",
            tenant_id=tenant_id,
            node_type=NodeType.WORKFLOW,
            name="High-Speed Packaging QA Triage",
            description="Continuous inspection of 450 units/minute conveyor flow with automated reject diversion.",
            properties=NodeProperties(
                sector="food_manufacturing",
                status="baseline",
                cycle_time_seconds=0.13,
            ),
            evidence_ids=["EVD-SOP-01"],
        ),
        WorkGraphNode(
            node_id="TSK-001",
            tenant_id=tenant_id,
            node_type=NodeType.TASK,
            name="Visual Heat-Seal Verification",
            description="Inspect integrity of vacuum seal boundaries to prevent microbial spoilage.",
            properties=NodeProperties(
                sector="food_manufacturing",
                cost_per_hour=32.0,
                cycle_time_seconds=1.2,
            ),
            evidence_ids=["EVD-TASK-01"],
        ),
        WorkGraphNode(
            node_id="TSK-002",
            tenant_id=tenant_id,
            node_type=NodeType.TASK,
            name="Optical Defect Model Calibration",
            description="Calibrate threshold sensitivities on edge vision cameras to balance false-positive rejection rates.",
            properties=NodeProperties(
                sector="food_manufacturing",
                cost_per_hour=55.0,
            ),
            evidence_ids=["EVD-SOP-01"],
        ),
        WorkGraphNode(
            node_id="ROL-001",
            tenant_id=tenant_id,
            node_type=NodeType.ROLE,
            name="Packaging QA Inspector",
            description="Monitors conveyor line, manually sample-tests packages, and records defect log entries in ERP.",
            properties=NodeProperties(
                sector="food_manufacturing",
                cost_per_hour=34.0,
                status="baseline",
            ),
            evidence_ids=["EVD-ROLE-01"],
        ),
        WorkGraphNode(
            node_id="ROL-002",
            tenant_id=tenant_id,
            node_type=NodeType.ROLE,
            name="Vision Automation Lead",
            description="Supervises AI inspection cameras, manages model retraining cycles, and coordinates robotic divert gates.",
            properties=NodeProperties(
                sector="food_manufacturing",
                cost_per_hour=62.0,
                status="proposed",
            ),
            evidence_ids=["EVD-ROLE-02"],
        ),
        WorkGraphNode(
            node_id="SKL-001",
            tenant_id=tenant_id,
            node_type=NodeType.SKILL,
            name="Thermal Seal Defect Recognition",
            description="Visual pattern recognition of micro-tears, air-bubbles, and crimp defects.",
            properties=NodeProperties(sector="food_manufacturing"),
            evidence_ids=["EVD-TASK-01"],
        ),
        WorkGraphNode(
            node_id="SKL-002",
            tenant_id=tenant_id,
            node_type=NodeType.SKILL,
            name="Edge Vision Model Tuning",
            description="Adjustment of confidence bounding boxes on high-speed industrial inference units.",
            properties=NodeProperties(sector="food_manufacturing"),
            evidence_ids=["EVD-ROLE-02"],
        ),
        WorkGraphNode(
            node_id="SYS-001",
            tenant_id=tenant_id,
            node_type=NodeType.SYSTEM,
            name="SAP Line Execution System (LES)",
            description="Core factory execution software recording batch numbers, lots, and regulatory compliance logs.",
            properties=NodeProperties(sector="food_manufacturing"),
            evidence_ids=["EVD-SYS-01"],
        ),
        WorkGraphNode(
            node_id="AGT-001",
            tenant_id=tenant_id,
            node_type=NodeType.AGENT,
            name="PackagingVisionInspectorAgent",
            description="Autonomous Google ADK edge-agent performing continuous defect segmentation and alert generation.",
            properties=NodeProperties(
                sector="food_manufacturing",
                status="proposed",
            ),
            evidence_ids=["EVD-AGT-01"],
        ),
        WorkGraphNode(
            node_id="CTR-001",
            tenant_id=tenant_id,
            node_type=NodeType.CONTROL,
            name="FDA 21 CFR Part 11 Audit Trail",
            description="Tamper-proof electronic signatures and automated logging for all inspection overrides.",
            properties=NodeProperties(
                sector="food_manufacturing",
                criticality="critical",
            ),
            evidence_ids=["EVD-CTR-01"],
        ),
    ]

    edges: List[WorkGraphEdge] = [
        WorkGraphEdge(
            edge_id="EDG-001",
            tenant_id=tenant_id,
            source_node_id="CAP-001",
            target_node_id="OUT-001",
            relation_type=EdgeType.SUPPORTS,
            impact_weight=0.95,
        ),
        WorkGraphEdge(
            edge_id="EDG-002",
            tenant_id=tenant_id,
            source_node_id="CAP-001",
            target_node_id="WF-001",
            relation_type=EdgeType.DECOMPOSES_INTO,
            impact_weight=1.0,
        ),
        WorkGraphEdge(
            edge_id="EDG-003",
            tenant_id=tenant_id,
            source_node_id="WF-001",
            target_node_id="TSK-001",
            relation_type=EdgeType.DECOMPOSES_INTO,
            impact_weight=0.7,
        ),
        WorkGraphEdge(
            edge_id="EDG-004",
            tenant_id=tenant_id,
            source_node_id="ROL-001",
            target_node_id="TSK-001",
            relation_type=EdgeType.EXECUTES,
            allocation_percentage=85.0,
        ),
        WorkGraphEdge(
            edge_id="EDG-005",
            tenant_id=tenant_id,
            source_node_id="AGT-001",
            target_node_id="TSK-001",
            relation_type=EdgeType.AUGMENTED_BY,
            allocation_percentage=75.0,
        ),
        WorkGraphEdge(
            edge_id="EDG-006",
            tenant_id=tenant_id,
            source_node_id="ROL-001",
            target_node_id="SKL-001",
            relation_type=EdgeType.REQUIRES_SKILL,
            impact_weight=0.9,
        ),
        WorkGraphEdge(
            edge_id="EDG-007",
            tenant_id=tenant_id,
            source_node_id="ROL-002",
            target_node_id="SKL-002",
            relation_type=EdgeType.REQUIRES_SKILL,
            impact_weight=0.95,
        ),
        WorkGraphEdge(
            edge_id="EDG-008",
            tenant_id=tenant_id,
            source_node_id="WF-001",
            target_node_id="CTR-001",
            relation_type=EdgeType.GOVERNED_BY,
            impact_weight=1.0,
        ),
    ]

    return WorkGraphResponse(
        tenant_id=tenant_id,
        sector="food_manufacturing",
        nodes=nodes,
        edges=edges,
        total_nodes=len(nodes),
        total_edges=len(edges),
    )
