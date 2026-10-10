"""Subsystem liveness probe across all FuturaSculptAI API endpoints."""

import sys
import httpx

API_BASE = "http://localhost:8000"


def run_probes() -> bool:
    """Execute automated health probes against local API server."""
    endpoints = [
        ("/", "Root Metadata"),
        ("/health/live", "Liveness Probe"),
        ("/health/ready", "Readiness Probe"),
        ("/api/v1/workgraph", "WorkGraph Query"),
        ("/api/v1/scenarios", "Scenario Foundry"),
        ("/api/v1/evidence", "Evidence Ledger"),
        ("/api/v1/scoring/rri?role_id=ROL-001", "RRI Evaluation"),
        ("/api/v1/scoring/trustboard", "TrustBoard Evaluation"),
    ]

    all_passed = True
    print(f"Executing subsystem probes against {API_BASE}...\n")

    with httpx.Client(base_url=API_BASE, timeout=5.0) as client:
        for path, label in endpoints:
            try:
                resp = client.get(path, headers={"X-Tenant-ID": "tenant-food-mfg-01"})
                if resp.status_code == 200:
                    print(f"  [PASS] {label:25} {path} -> HTTP 200")
                else:
                    print(f"  [FAIL] {label:25} {path} -> HTTP {resp.status_code}")
                    all_passed = False
            except Exception as exc:
                print(f"  [ERR]  {label:25} {path} -> {str(exc)}")
                all_passed = False

    return all_passed


if __name__ == "__main__":
    success = run_probes()
    sys.exit(0 if success else 1)
