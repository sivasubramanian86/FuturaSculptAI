"""End-to-End (E2E) Full Lifecycle Integration and Deliberation Suite.

Executes the complete FuturaSculptAI Control Loop:
Onboarding -> WorkGraph -> Blast Radius -> 9-Agent Swarm -> Evidence Notarization
-> SHA-256 Verification -> Claim Entailment -> Deterministic Scoring -> A2 Sign-off -> Diligence Pack.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.agent_swarm import AutonomyTier

client = TestClient(app)


@pytest.mark.e2e
def test_full_planetary_transformation_e2e_lifecycle():
    """Execute complete end-to-end enterprise workforce transformation lifecycle."""
    tenant_id = "tenant-food-mfg-01"
    headers = {"X-Tenant-ID": tenant_id}

    # Step 1: Organization Onboarding
    onboard_payload = {
        "organization_name": "Artisan Harvest Precision Bakery",
        "sector": "food_manufacturing",
        "headcount": 120,
        "primary_strategic_goal": "Modernize packaging line with Edge AI",
        "contact_email": "ops@artisanharvest.example.com",
    }
    r_onboard = client.post("/api/v1/onboard", json=onboard_payload, headers=headers)
    assert r_onboard.status_code == 201
    assert r_onboard.json()["organization_name"] == "Artisan Harvest Precision Bakery"

    # Step 2: WorkGraph Seed Hydration & Temporal Projection
    r_graph = client.get("/api/v1/workgraph/temporal?horizon_year=3", headers=headers)
    assert r_graph.status_code == 200
    graph_data = r_graph.json()
    assert "graph" in graph_data
    assert "nodes" in graph_data["graph"]
    assert "summary" in graph_data
    assert graph_data["summary"]["horizon_year"] == 3

    # Step 3: Blast Radius Topology Analysis
    r_blast = client.get("/api/v1/workgraph/blast-radius?node_id=CAP-001&max_depth=2", headers=headers)
    assert r_blast.status_code == 200
    blast_data = r_blast.json()
    assert blast_data["target_node_id"] == "CAP-001"
    assert "total_affected_nodes" in blast_data

    # Step 4: 9-Specialist Google ADK Agent Swarm Deliberation (Horizon 3 triggers A2 Gate)
    swarm_payload = {
        "scenario_prompt": "Augment high-speed seal inspection line with Edge-TPU vision sensors and AI copilot.",
        "sector": "food_manufacturing",
        "target_role_id": "ROL-001",
        "target_capability_id": "CAP-001",
        "evidence_ids": ["EVD-SOP-01", "EVD-STRAT-01"],
        "horizon_years": 3,
    }
    r_swarm = client.post("/api/v1/agents/swarm/run", json=swarm_payload, headers=headers)
    assert r_swarm.status_code == 200
    swarm_res = r_swarm.json()
    assert swarm_res["status"] == "REQUIRES_APPROVAL"
    assert swarm_res["autonomy_gate"] == AutonomyTier.A2_APPROVAL_GATE.value
    assert len(swarm_res["trajectories"]) == 10  # 9 specialists + orchestrator

    # Step 5: Multimodal Evidence Upload & Cryptographic Notarization
    file_bytes = b"%PDF-1.4 EU AI Act High-Risk Standard & Worker Protection Agreement 2026"
    files = {"file": ("worker_agreement.pdf", file_bytes, "application/pdf")}
    form_data = {
        "source_type": "pdf",
        "author": "Labor Representative Council",
        "sensitivity": "internal",
    }
    r_ev_up = client.post("/api/v1/evidence/upload", files=files, data=form_data, headers=headers)
    assert r_ev_up.status_code == 201
    ev_record = r_ev_up.json()
    ev_id = ev_record["evidence_id"]
    assert "sha256_hash" in ev_record

    # Step 6: Tamper-Proof Cryptographic Integrity Check
    r_integ = client.get(f"/api/v1/evidence/{ev_id}/integrity", headers=headers)
    assert r_integ.status_code == 200
    assert r_integ.json()["is_valid"] is True

    # Step 7: Zero-Fabrication Claim Entailment Verification
    claim_payload = {
        "claim_text": "Worker Protection Agreement 2026",
        "evidence_ids": [ev_id],
    }
    r_claim = client.post("/api/v1/evidence/verify-claim", json=claim_payload, headers=headers)
    assert r_claim.status_code == 200
    assert r_claim.json()["verdict"] in ["SUPPORTED", "GROUNDED", "VERIFIED"]

    # Step 8: Deterministic WAI-100 TrustBoard & RRI Evaluation
    r_wai = client.get("/api/v1/scoring/trustboard", headers=headers)
    assert r_wai.status_code == 200
    assert "trust_score" in r_wai.json()
    assert r_wai.json()["gate_status"] == "PASSED"

    r_rri = client.get("/api/v1/scoring/rri?role_id=ROL-001", headers=headers)
    assert r_rri.status_code == 200
    assert r_rri.json()["role_id"] == "ROL-001"

    # Step 9: Human-in-the-Loop A2 Approval Gate Sign-off
    approval_payload = {
        "decision": "APPROVED",
        "approver_id": "usr-governance-001",
        "notes": "Verified zero job terminations, 90-day salary escrow, and 6-week upskilling pathway.",
    }
    r_appr = client.post("/api/v1/tasks/TSK-002/approval", json=approval_payload, headers=headers)
    assert r_appr.status_code == 200
    assert r_appr.json()["status"] == "APPROVED"

    # Step 10: Governance Diligence Pack Export
    r_pack = client.get("/api/v1/governance/diligence-pack", headers=headers)
    assert r_pack.status_code == 200
    pack_data = r_pack.json()
    assert "pack_id" in pack_data
    assert "cryptographic_seal_hash" in pack_data
    assert pack_data["saif_compliance_pct"] >= 0.0
