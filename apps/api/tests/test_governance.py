"""Unit test suite for Governance TrustBoard, SAIF Controls, and Investor Lens."""

from fastapi.testclient import TestClient

from app.main import app
from app.models.governance import ControlStatus, RemediationActionRequest, SAIFDomain
from app.services.governance_service import governance_service

client = TestClient(app)


def test_get_governance_trustboard_nominal():
    """Verify retrieval of holistic 8-pillar Well-Architected and SAIF posture."""
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}
    response = client.get("/governance/trustboard", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["tenant_id"] == "tenant-food-mfg-01"
    assert data["overall_trust_score"] >= 85.0
    assert data["gate_status"] == "PASSED"
    assert data["red_lines_breached"] == 0
    assert len(data["pillars"]) == 8
    assert len(data["saif_controls"]) == 6

    pillar_names = [p["pillar"] for p in data["pillars"]]
    assert "Security, Privacy & SAIF" in pillar_names
    assert "Operational Excellence" in pillar_names
    assert "Cost Optimization / FinOps" in pillar_names
    assert "Responsible AI & Workforce" in pillar_names
    assert "Evidence Quality & Provenance" in pillar_names


def test_get_saif_controls_unfiltered_and_filtered():
    """Verify listing SAIF matrix controls and domain-specific filtering."""
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}

    # All controls
    res_all = client.get("/governance/saif-controls", headers=headers)
    assert res_all.status_code == 200
    all_controls = res_all.json()
    assert len(all_controls) == 6

    # Domain filtered: SECURE_AI_SYSTEMS
    res_filtered = client.get(
        f"/governance/saif-controls?domain={SAIFDomain.SECURE_AI_SYSTEMS.value}",
        headers=headers,
    )
    assert res_filtered.status_code == 200
    filtered = res_filtered.json()
    assert len(filtered) == 1
    assert filtered[0]["control_id"] == "SAIF-03"
    assert "Model Armor" in filtered[0]["title"]


def test_get_investor_lens_baseline():
    """Verify default Investor Lens thesis and financial metrics generation."""
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}
    response = client.get("/governance/investor-lens", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["tenant_id"] == "tenant-food-mfg-01"
    assert data["projected_ebitda_impact_usd"] > 0
    assert data["net_roi_multiple"] > 0
    assert data["payback_period_months"] > 0
    assert data["defensibility_moat_score"] == 94.5
    assert len(data["roadmaps"]) == 3
    assert "Anti-Fabrication Notice" in data["disclaimer"] or "Simulated scenario" in data["disclaimer"]


def test_simulate_investor_lens_custom_parameters():
    """Verify custom parameter simulations for EBITDA, Net ROI, and Payback."""
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}
    payload = {
        "wage_uplift_multiplier": 1.5,
        "automation_yield_factor": 1.4,
        "transition_capex_usd": 300000.0,
    }
    response = client.post("/governance/investor-lens/simulate", json=payload, headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["assumptions_applied"]["wage_uplift_multiplier"] == 1.5
    assert data["assumptions_applied"]["automation_yield_factor"] == 1.4
    assert data["assumptions_applied"]["transition_capex_usd"] == 300000.0
    assert data["transition_cost_usd"] == 300000.0
    assert data["net_roi_multiple"] > 0


def test_update_remediation_success_and_not_found():
    """Verify updating remediation status and error response on unknown control."""
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}

    # Valid update
    valid_payload = {
        "control_id": "SAIF-01",
        "remediation_owner": "Senior SecOps Architect",
        "action_notes": "Implemented automated SBOM hash validation in Cloud Build.",
        "resolved": True,
    }
    res = client.post("/governance/remediate", json=valid_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["control_id"] == "SAIF-01"
    assert data["status"] == ControlStatus.VERIFIED.value
    assert data["remediation_owner"] == "Senior SecOps Architect"

    # Non-resolved update
    in_progress_payload = {
        "control_id": "SAIF-02",
        "remediation_owner": "Data Protection Officer",
        "action_notes": "Reviewing IAM DLP scopes.",
        "resolved": False,
    }
    res2 = client.post("/governance/remediate", json=in_progress_payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == ControlStatus.IN_PROGRESS.value

    # Invalid control ID
    invalid_payload = {
        "control_id": "SAIF-999",
        "remediation_owner": "Unknown",
        "action_notes": "Nonexistent control test notes.",
        "resolved": False,
    }
    res_err = client.post("/governance/remediate", json=invalid_payload, headers=headers)
    assert res_err.status_code == 404
    assert "not found" in res_err.json()["detail"].lower()


def test_export_diligence_pack_nominal():
    """Verify generation of cryptographically sealed enterprise diligence pack."""
    headers = {"X-Tenant-ID": "tenant-food-mfg-01"}
    response = client.get("/governance/diligence-pack", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["pack_id"].startswith("DIL-tenant-foo")
    assert len(data["cryptographic_seal_hash"]) == 64  # SHA-256 length
    assert len(data["evidence_hashes"]) >= 1
    assert data["gate_status"] in ["PASSED", "FLAGGED", "BLOCKED"]
    assert "Anti-Fabrication Notice" in data["disclaimer"]


def test_red_line_breach_blocks_gate_status():
    """Verify that any red-line breach immediately forces gate status to BLOCKED."""
    test_tenant = "tenant-audit-blocked-01"
    headers = {"X-Tenant-ID": test_tenant}

    # Baseline before breach
    res_before = client.get("/governance/trustboard", headers=headers)
    assert res_before.status_code == 200
    assert res_before.json()["gate_status"] == "PASSED"

    # Inject red-line breach
    governance_service.inject_red_line_breach(test_tenant, count=1)

    # Post-breach inspection
    res_after = client.get("/governance/trustboard", headers=headers)
    assert res_after.status_code == 200
    data = res_after.json()
    assert data["red_lines_breached"] == 1
    assert data["gate_status"] == "BLOCKED"


def test_low_trust_score_flags_gate_status():
    """Verify FLAGGED gate status when trust score falls below 85.0 and BLOCKED when < 60%."""
    test_tenant = "tenant-flagged-01"
    headers = {"X-Tenant-ID": test_tenant}

    # Initialize tenant
    client.get("/governance/trustboard", headers=headers)

    # Degrade 1 SAIF control to IN_PROGRESS (5/6 = 83.3% < 85%) -> FLAGGED
    governance_service.update_remediation(
        test_tenant,
        RemediationActionRequest(
            control_id="SAIF-01",
            remediation_owner="Auditor",
            action_notes="Pending compliance audit.",
            resolved=False,
        ),
    )

    res_flagged = client.get("/governance/trustboard", headers=headers)
    assert res_flagged.status_code == 200
    assert res_flagged.json()["gate_status"] == "FLAGGED"

    # Degrade 2 more SAIF controls (3/6 = 50.0% < 60%) -> BLOCKED
    for cid in ["SAIF-02", "SAIF-03"]:
        governance_service.update_remediation(
            test_tenant,
            RemediationActionRequest(
                control_id=cid,
                remediation_owner="Auditor",
                action_notes="Pending audit review.",
                resolved=False,
            ),
        )

    res_blocked = client.get("/governance/trustboard", headers=headers)
    assert res_blocked.status_code == 200
    assert res_blocked.json()["gate_status"] == "BLOCKED"
