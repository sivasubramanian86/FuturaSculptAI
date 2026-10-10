# FuturaSculptAI: Work Transformation Graph (WTG) Schema

The Work Transformation Graph is a temporal, directed, typed multi-graph model. It is represented physically as relational temporal tables in Google BigQuery and projected in-memory for real-time visualization and agent traversal.

## 1. Node Taxonomy

Nodes belong to one of 11 distinct classes:

```json
{
  "node_id": "string (UUID)",
  "tenant_id": "string",
  "node_type": "outcome | capability | workflow | task | role | skill | system | data | agent | control | technology",
  "name": "string",
  "description": "string",
  "properties": {
    "sector": "food_manufacturing | healthcare | banking | generic",
    "status": "baseline | proposed | transformed | retired",
    "criticality": "low | medium | high | critical",
    "cost_per_hour": "number (optional, for tasks/roles)",
    "cycle_time_seconds": "number (optional, for tasks/workflows)",
    "maturity_level": "emerging | accelerating | mature (for technologies)"
  },
  "temporal": {
    "valid_from": "timestamp",
    "valid_to": "timestamp | null",
    "as_of_version": "integer"
  },
  "provenance": {
    "evidence_ids": ["string"],
    "created_by_agent": "string",
    "confidence": "number (0.0 - 1.0)"
  }
}
```

### Node Descriptions
1. **Outcome:** Strategic enterprise goal (e.g., `OUT-001: Zero Product Recalls in Packaging Line`).
2. **Capability:** Higher-order business ability (e.g., `CAP-001: Real-Time Quality Assurance Inspection`).
3. **Workflow:** Coordinated sequence of operational activities (e.g., `WF-001: End-of-Line Packaging Defect Triage`).
4. **Task:** Discrete unit of work performed by human or agent (e.g., `TSK-001: Visual Seal Integrity Verification`).
5. **Role:** Organizational job title or archetype (e.g., `ROL-001: Quality Inspection Operator`).
6. **Skill:** Requisite human or agent competency (e.g., `SKL-001: Defect Pattern Recognition`, `SKL-002: Computer Vision Model Calibration`).
7. **System:** Enterprise software or hardware asset (e.g., `SYS-001: High-Speed Conveyor Camera Array`, `SYS-002: SAP ERP Line Management`).
8. **Data:** Ingested or generated information artifact (e.g., `DAT-001: Defect Telemetry Stream`).
9. **Agent:** Autonomous Google ADK agent instance (e.g., `AGT-001: VisionDefectDetectionAgent`).
10. **Control:** Governance, safety, or compliance checkpoint (e.g., `CTR-001: FDA 21 CFR Part 11 Audit Trail`, `CTR-002: Model Armor Output Filter`).
11. **Technology:** Frontier or maturing technology signal (e.g., `TEC-001: Edge Edge-TPU Vision System`, `TEC-002: Autonomous Collaborative Robotics`).

---

## 2. Edge Taxonomy

Edges represent directional relationships between nodes with explicit semantic types:

```json
{
  "edge_id": "string (UUID)",
  "tenant_id": "string",
  "source_node_id": "string",
  "target_node_id": "string",
  "relation_type": "supports | decomposes_into | executes | requires_skill | operates_system | governed_by | augmented_by | enabled_by | produces_data",
  "properties": {
    "allocation_percentage": "number (0-100, e.g. task split between human and agent)",
    "impact_weight": "number (-1.0 to 1.0)"
  },
  "temporal": {
    "valid_from": "timestamp",
    "valid_to": "timestamp | null"
  },
  "provenance": {
    "evidence_ids": ["string"],
    "confidence": "number (0.0 - 1.0)"
  }
}
```

---

## 3. BigQuery Temporal Table Schemas

### Table 1: `wtg_nodes`
- `node_id` STRING NOT NULL
- `tenant_id` STRING NOT NULL
- `node_type` STRING NOT NULL
- `name` STRING NOT NULL
- `description` STRING
- `properties_json` JSON
- `valid_from` TIMESTAMP NOT NULL
- `valid_to` TIMESTAMP
- `is_current` BOOLEAN NOT NULL
- `evidence_ids` ARRAY<STRING>
- `created_at` TIMESTAMP NOT NULL

*Clustering:* `tenant_id`, `node_type`, `valid_from`  
*Partitioning:* `RANGE_BUCKET` or `DATE(valid_from)`

### Table 2: `wtg_edges`
- `edge_id` STRING NOT NULL
- `tenant_id` STRING NOT NULL
- `source_node_id` STRING NOT NULL
- `target_node_id` STRING NOT NULL
- `relation_type` STRING NOT NULL
- `properties_json` JSON
- `valid_from` TIMESTAMP NOT NULL
- `valid_to` TIMESTAMP
- `is_current` BOOLEAN NOT NULL
- `evidence_ids` ARRAY<STRING>
- `created_at` TIMESTAMP NOT NULL

*Clustering:* `tenant_id`, `source_node_id`, `relation_type`
