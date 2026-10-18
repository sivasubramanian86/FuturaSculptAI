"""Seed sample WorkGraph nodes and outcome ledger data into BigQuery dataset 'futurasculpt_vault'."""

from datetime import datetime, timezone
import json
from google.cloud import bigquery

PROJECT_ID = "genai-apac-2026-491004"
DATASET_ID = "futurasculpt_vault"
TENANT_ID = "tenant-food-mfg-01"


def seed_bigquery():
    print(f"Connecting to BigQuery project={PROJECT_ID}, dataset={DATASET_ID}...")
    client = bigquery.Client(project=PROJECT_ID)

    # 1. Create wtg_nodes table
    nodes_table_id = f"{PROJECT_ID}.{DATASET_ID}.wtg_nodes"
    nodes_schema = [
        bigquery.SchemaField("tenant_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("node_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("node_type", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("description", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("sector", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("horizon_year", "INT64", mode="REQUIRED"),
        bigquery.SchemaField("properties", "STRING", mode="NULLABLE"),
        bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED"),
    ]
    nodes_table = bigquery.Table(nodes_table_id, schema=nodes_schema)
    nodes_table = client.create_table(nodes_table, exists_ok=True)
    print(f"Verified table: {nodes_table_id}")

    # 2. Create outcome_ledger table
    outcomes_table_id = f"{PROJECT_ID}.{DATASET_ID}.outcome_ledger"
    outcomes_schema = [
        bigquery.SchemaField("tenant_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("scenario_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("horizon_year", "INT64", mode="REQUIRED"),
        bigquery.SchemaField("productivity_gain", "FLOAT64", mode="REQUIRED"),
        bigquery.SchemaField("human_allocation_pct", "FLOAT64", mode="REQUIRED"),
        bigquery.SchemaField("agent_allocation_pct", "FLOAT64", mode="REQUIRED"),
        bigquery.SchemaField("active_agents", "INT64", mode="REQUIRED"),
        bigquery.SchemaField("active_roles", "INT64", mode="REQUIRED"),
        bigquery.SchemaField("wage_bond_escrow_usd", "FLOAT64", mode="REQUIRED"),
        bigquery.SchemaField("recorded_at", "TIMESTAMP", mode="REQUIRED"),
    ]
    outcomes_table = bigquery.Table(outcomes_table_id, schema=outcomes_schema)
    outcomes_table = client.create_table(outcomes_table, exists_ok=True)
    print(f"Verified table: {outcomes_table_id}")

    now = datetime.now(timezone.utc).isoformat()

    # 3. Populate sample WorkGraph nodes
    sample_nodes = [
        # Horizon 0 (Baseline)
        {
            "tenant_id": TENANT_ID,
            "node_id": "OUT-001",
            "node_type": "outcome",
            "name": "Zero Defect Product Recalls",
            "description": "Achieve < 0.001% packaging seal defect rate.",
            "sector": "food_manufacturing",
            "horizon_year": 0,
            "properties": json.dumps({"criticality": "critical", "status": "baseline"}),
            "ingested_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "node_id": "CAP-001",
            "node_type": "capability",
            "name": "Automated Packaging Quality Inspection",
            "description": "Multi-spectral vision verification of package seals and allergen labels.",
            "sector": "food_manufacturing",
            "horizon_year": 0,
            "properties": json.dumps({"criticality": "high", "cycle_time_seconds": 0.13}),
            "ingested_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "node_id": "ROL-001",
            "node_type": "role",
            "name": "Packaging QA Inspector",
            "description": "Line monitoring, sample-testing packages, manual logging.",
            "sector": "food_manufacturing",
            "horizon_year": 0,
            "properties": json.dumps({"cost_per_hour": 34.0, "status": "baseline"}),
            "ingested_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "node_id": "AGT-001",
            "node_type": "agent",
            "name": "PackagingVisionInspectorAgent",
            "description": "Autonomous Google ADK edge agent for defect segmentation.",
            "sector": "food_manufacturing",
            "horizon_year": 0,
            "properties": json.dumps({"status": "planned", "allocation_pct": 0.0}),
            "ingested_at": now,
        },
        # Horizon 1 (Augmented Hybrid)
        {
            "tenant_id": TENANT_ID,
            "node_id": "ROL-001",
            "node_type": "role",
            "name": "Packaging QA Inspector (Augmented)",
            "description": "Supervises AI edge cameras, 90-day wage protection escrow active.",
            "sector": "food_manufacturing",
            "horizon_year": 1,
            "properties": json.dumps({"cost_per_hour": 38.0, "wage_hike_pct": 11.7}),
            "ingested_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "node_id": "AGT-001",
            "node_type": "agent",
            "name": "PackagingVisionInspectorAgent",
            "description": "Autonomous Google ADK edge agent running real-time defect triage.",
            "sector": "food_manufacturing",
            "horizon_year": 1,
            "properties": json.dumps({"status": "live", "allocation_pct": 40.0}),
            "ingested_at": now,
        },
        # Horizon 3 (Autonomous Transformation)
        {
            "tenant_id": TENANT_ID,
            "node_id": "ROL-003",
            "node_type": "role",
            "name": "Automation Quality Supervisor",
            "description": "Senior supervisor overseeing multi-agent fleets and anomaly escalations.",
            "sector": "food_manufacturing",
            "horizon_year": 3,
            "properties": json.dumps({"cost_per_hour": 52.0, "wage_hike_pct": 52.9}),
            "ingested_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "node_id": "CTR-001",
            "node_type": "control",
            "name": "FDA 21 CFR Part 11 Audit Trail",
            "description": "Cryptographic tamper-proof audit trail for automated inspection overrides.",
            "sector": "food_manufacturing",
            "horizon_year": 3,
            "properties": json.dumps({"governance": "saif_compliant", "status": "active"}),
            "ingested_at": now,
        },
    ]

    print(f"Streaming {len(sample_nodes)} nodes into {nodes_table_id}...")
    errors = client.insert_rows_json(nodes_table_id, sample_nodes)
    if errors:
        print(f"Errors inserting nodes: {errors}")
    else:
        print("Successfully uploaded sample WorkGraph nodes!")

    # 4. Populate sample Outcome Ledgers
    sample_outcomes = [
        {
            "tenant_id": TENANT_ID,
            "scenario_id": "SCN-BASELINE-Y0",
            "horizon_year": 0,
            "productivity_gain": 0.0,
            "human_allocation_pct": 100.0,
            "agent_allocation_pct": 0.0,
            "active_agents": 0,
            "active_roles": 2,
            "wage_bond_escrow_usd": 0.0,
            "recorded_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "scenario_id": "SCN-AUGMENTED-Y1",
            "horizon_year": 1,
            "productivity_gain": 22.5,
            "human_allocation_pct": 60.0,
            "agent_allocation_pct": 40.0,
            "active_agents": 1,
            "active_roles": 2,
            "wage_bond_escrow_usd": 50000.0,
            "recorded_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "scenario_id": "SCN-TRANSFORM-Y3",
            "horizon_year": 3,
            "productivity_gain": 58.0,
            "human_allocation_pct": 20.0,
            "agent_allocation_pct": 80.0,
            "active_agents": 2,
            "active_roles": 3,
            "wage_bond_escrow_usd": 125000.0,
            "recorded_at": now,
        },
        {
            "tenant_id": TENANT_ID,
            "scenario_id": "SCN-COGNITIVE-Y5",
            "horizon_year": 5,
            "productivity_gain": 85.0,
            "human_allocation_pct": 15.0,
            "agent_allocation_pct": 85.0,
            "active_agents": 4,
            "active_roles": 4,
            "wage_bond_escrow_usd": 250000.0,
            "recorded_at": now,
        },
    ]

    print(f"Streaming {len(sample_outcomes)} outcome ledger rows into {outcomes_table_id}...")
    errors = client.insert_rows_json(outcomes_table_id, sample_outcomes)
    if errors:
        print(f"Errors inserting outcome ledger rows: {errors}")
    else:
        print("Successfully uploaded sample Outcome Ledger rows!")

    # 5. Query verification
    print("\n--- Verifying BigQuery Sample Query ---")
    query = f"""
        SELECT node_id, node_type, name, horizon_year, sector
        FROM `{nodes_table_id}`
        WHERE tenant_id = '{TENANT_ID}'
        ORDER BY horizon_year, node_id
    """
    query_job = client.query(query)
    rows = list(query_job.result())
    print(f"Query returned {len(rows)} nodes from BigQuery:")
    for row in rows:
        print(f"  [Year {row.horizon_year}] ({row.node_type}) {row.node_id}: {row.name}")

    query2 = f"""
        SELECT scenario_id, horizon_year, productivity_gain, agent_allocation_pct, wage_bond_escrow_usd
        FROM `{outcomes_table_id}`
        WHERE tenant_id = '{TENANT_ID}'
        ORDER BY horizon_year
    """
    query_job2 = client.query(query2)
    rows2 = list(query_job2.result())
    print(f"\nQuery returned {len(rows2)} outcome ledger entries from BigQuery:")
    for r in rows2:
        print(f"  [{r.scenario_id}] Y{r.horizon_year}: +{r.productivity_gain}% gain, {r.agent_allocation_pct}% agent, ${r.wage_bond_escrow_usd:,.0f} wage escrow")


if __name__ == "__main__":
    seed_bigquery()
