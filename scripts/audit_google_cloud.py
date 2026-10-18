"""Read-only audit of FuturaSculptAI Google Cloud integrations and cost drivers."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGION = "asia-southeast1"


def powershell_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def command(args: list[str], timeout: int = 30) -> tuple[Any, str | None]:
    """Run a read-only CLI command and decode JSON when possible."""
    try:
        if os.name == "nt" and args[0] in {"gcloud", "bq"}:
            executable = shutil.which(args[0])
            if not executable:
                return None, f"{args[0]} CLI not found on PATH"
            script = "& " + " ".join(powershell_quote(value) for value in [executable, *args[1:]])
            invocation = ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script]
        else:
            invocation = args
        result = subprocess.run(invocation, cwd=ROOT, capture_output=True, text=True, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return None, str(exc)
    if result.returncode:
        return None, (result.stderr or result.stdout).strip()[-1200:]
    output = result.stdout.strip()
    if not output:
        return [], None
    try:
        return json.loads(output), None
    except json.JSONDecodeError:
        return output, None


def find_project() -> str | None:
    value, error = command(["gcloud", "config", "get-value", "project", "--quiet"])
    if error or not isinstance(value, str) or value in ("", "(unset)"):
        return os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID")
    return value


def scan_code() -> dict[str, bool]:
    """Inspect application code and deployment config, excluding docs and tests."""
    terraform = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in ROOT.glob("deploy/terraform/*.tf") if path.is_file()
    ).lower()
    dependencies = (ROOT / "apps/api/pyproject.toml").read_text(encoding="utf-8", errors="ignore").lower()
    app_code = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in ROOT.glob("apps/api/app/**/*.py")
        if path.is_file()
    ).lower()
    return {
        "vertex_ai": "google-genai" in dependencies or "vertexai" in app_code,
        "firestore": "firestore" in app_code,
        "pubsub": "pubsub" in app_code,
        "bigquery": bool(re.search(r"google\.cloud\.bigquery|bigquery\.client|bigquery\.dataset", app_code)),
        "alloydb": "alloydb" in dependencies or "google.cloud.alloydb" in app_code,
        "postgresql": bool(re.search(r"asyncpg|psycopg|postgresql://|postgres://", app_code + dependencies)),
        "bigquery_mcp": "https://bigquery.googleapis.com/mcp" in app_code,
        "model_armor": bool(re.search(r"google\.cloud\.modelarmor|sanitize_user_prompt|sanitize_model_response", app_code)),
        "cloud_armor": "google_compute_security_policy" in terraform,
        "storage": "google.cloud.storage" in app_code,
        "dlp": "google.cloud.dlp" in app_code,
        "secret_manager": "google.cloud.secretmanager" in app_code,
        "cloud_run": "google_cloud_run_v2_service" in terraform,
    }


def ids(items: Any, key: str = "name") -> list[str]:
    if not isinstance(items, list):
        return []
    result = []
    for item in items:
        if isinstance(item, dict):
            name = item.get("datasetReference", {}).get("datasetId") or item.get(key)
            if name:
                result.append(str(name).rsplit("/", 1)[-1])
    return result


def gcloud_json(args: list[str]) -> tuple[Any, str | None]:
    return command(args + ["--format=json"])


def audit(project: str | None, region: str, service: str) -> dict[str, Any]:
    report: dict[str, Any] = {"project": project, "region": region, "checks": [], "notes": []}
    code = scan_code()
    if not project:
        report["notes"].append("No active gcloud project. Set GOOGLE_CLOUD_PROJECT or run gcloud config set project PROJECT_ID.")
        return report

    enabled, error = gcloud_json(["gcloud", "services", "list", "--enabled", "--project", project])
    enabled_names = {x.get("config", {}).get("name") for x in enabled or [] if isinstance(x, dict)}
    if error:
        report["notes"].append(f"Could not list enabled APIs: {error}")

    run, run_error = gcloud_json(["gcloud", "run", "services", "describe", service, "--region", region, "--project", project])
    run = run if isinstance(run, dict) else {}
    run_sa = run.get("spec", {}).get("template", {}).get("spec", {}).get("serviceAccountName", "unknown")
    run_url = run.get("status", {}).get("url")
    run_revision = run.get("status", {}).get("latestReadyRevisionName")
    if run_error:
        report["notes"].append(f"Cloud Run service {service} unavailable: {run_error}")

    bq, bq_error = command(["bq", "ls", f"--project_id={project}", "--format=json"])
    datasets = ids(bq, "id")
    if bq_error:
        report["notes"].append(f"BigQuery dataset inventory failed: {bq_error}")

    alloy, alloy_error = gcloud_json(["gcloud", "alloydb", "clusters", "list", "--region", region, "--project", project])
    clusters = ids(alloy)
    if alloy_error:
        report["notes"].append(f"AlloyDB inventory failed: {alloy_error}")

    templates: Any = []
    armor_error = None
    if "modelarmor.googleapis.com" in enabled_names:
        templates, armor_error = gcloud_json(["gcloud", "model-armor", "templates", "list", "--location", region, "--project", project])
    backends, backend_error = gcloud_json(["gcloud", "compute", "backend-services", "list", "--project", project])
    policies, policy_error = gcloud_json(["gcloud", "compute", "security-policies", "list", "--project", project])
    log_filter = f'resource.type="cloud_run_revision" AND resource.labels.service_name="{service}" AND severity>=ERROR'
    errors, logs_error = gcloud_json(["gcloud", "logging", "read", log_filter, "--project", project, "--limit=100"])
    if armor_error:
        report["notes"].append(f"Model Armor template inventory failed: {armor_error}")
    if backend_error:
        report["notes"].append(f"Load balancer backend inventory failed: {backend_error}")
    if policy_error:
        report["notes"].append(f"Cloud Armor policy inventory failed: {policy_error}")
    if logs_error:
        report["notes"].append(f"Cloud Run error-log query failed: {logs_error}")

    health = "not checked"
    if run_url:
        try:
            with urllib.request.urlopen(f"{run_url.rstrip('/')}/health/ready", timeout=8) as response:
                body = json.loads(response.read().decode("utf-8"))
                health = f"HTTP {response.status}: {body.get('status', 'unknown')}"
        except (OSError, ValueError, urllib.error.URLError) as exc:
            health = f"unreachable: {exc}"

    # Runtime IAM output contains roles only; never request or print credential values.
    iam, iam_error = gcloud_json(["gcloud", "projects", "get-iam-policy", project]) if run_sa != "unknown" else ([], "Cloud Run service account unavailable")
    bindings = iam.get("bindings", []) if isinstance(iam, dict) else []
    runtime_roles = sorted({
        binding.get("role") for binding in bindings
        if isinstance(binding, dict)
        and any(member in {run_sa, f"serviceAccount:{run_sa}"} for member in binding.get("members", []))
        and binding.get("role")
    })
    if iam_error:
        report["notes"].append(f"Runtime IAM check failed: {iam_error}")

    def add(name: str, api: str | None, resource: str, code_key: str | None, cost: str, finding: str | None = None) -> None:
        api_ok = api is None or api in enabled_names
        code_ok = code.get(code_key, False) if code_key else None
        report["checks"].append({
            "service": name,
            "code": "present" if code_ok else "missing" if code_ok is False else "n/a",
            "api": "enabled" if api_ok else "disabled" if api else "n/a",
            "resource": resource,
            "result": finding or ("configured; runtime unverified" if api_ok and code_ok else "partial" if api_ok or code_ok else "not integrated"),
            "cost_driver": cost,
        })

    add("Cloud Run", "run.googleapis.com", f"{service}: {'READY' if run_revision else 'not found'}; health={health}; newest error entries (max 100): {len(errors) if isinstance(errors, list) else 'unknown'}; identity={run_sa}; roles={', '.join(runtime_roles) or 'unknown'}", "cloud_run", "vCPU, memory, requests, egress; min/max instance settings", "health verified" if health.startswith("HTTP 200") else None)
    add("Vertex AI / Gemini", "aiplatform.googleapis.com", "API enabled" if "aiplatform.googleapis.com" in enabled_names else "API disabled", "vertex_ai", "model input/output tokens, cached tokens, grounding, media generation")
    add("Firestore", "firestore.googleapis.com", "API enabled" if "firestore.googleapis.com" in enabled_names else "API disabled", "firestore", "document reads/writes/deletes, storage, backups")
    add("Pub/Sub", "pubsub.googleapis.com", "API enabled" if "pubsub.googleapis.com" in enabled_names else "API disabled", "pubsub", "message volume, delivery, retention, egress")
    add("Cloud Storage", "storage.googleapis.com", "API enabled" if "storage.googleapis.com" in enabled_names else "API disabled", "storage", "stored bytes, operations, retrieval and egress")
    add("Sensitive Data Protection (DLP)", "dlp.googleapis.com", "API enabled" if "dlp.googleapis.com" in enabled_names else "API disabled", "dlp", "content inspection and de-identification requests")
    add("Secret Manager", "secretmanager.googleapis.com", "API enabled" if "secretmanager.googleapis.com" in enabled_names else "API disabled", "secret_manager", "active secret versions and access operations")
    add("BigQuery", "bigquery.googleapis.com", f"datasets: {', '.join(datasets) or 'none visible'}", "bigquery", "bytes scanned, storage, streaming writes; check query byte caps")
    add("BigQuery MCP", "bigquery.googleapis.com", "remote endpoint available when API enabled; app MCP client not detected" if "bigquery.googleapis.com" in enabled_names else "BigQuery API disabled", "bigquery_mcp", "inherits BigQuery query/storage charges")
    add("AlloyDB", "alloydb.googleapis.com", f"clusters: {', '.join(clusters) or 'none visible'}; app connection not detected", "alloydb", "provisioned database compute, storage, backups, network")
    add("PostgreSQL", None, "driver/connection config not detected", "postgresql", "database compute, storage, backup and network (if provisioned)")
    add("Model Armor", "modelarmor.googleapis.com", f"templates: {', '.join(ids(templates)) or 'none visible'}", "model_armor", "prompt/response sanitization requests; audio/video not supported by direct sanitization API")
    attached = sorted({str(x.get("securityPolicy", "")).rsplit("/", 1)[-1] for x in backends or [] if isinstance(x, dict) and x.get("securityPolicy")})
    add("Cloud Armor", "compute.googleapis.com", f"backends: {len(backends) if isinstance(backends, list) else 0}; attached policies: {', '.join(attached) or 'none'}", "cloud_armor", "load balancer forwarding/data plus Cloud Armor policy charges")

    if "roles/editor" in runtime_roles:
        report["notes"].append("HIGH RISK: Cloud Run runtime identity has roles/editor. Replace with a least-privilege service account after validating every required API permission.")
    if "futurasculpt_vault" not in datasets:
        report["notes"].append("Terraform declares BigQuery dataset futurasculpt_vault, but it was not returned by the live dataset listing.")
    if run_url:
        report["cloud_run"] = {"url": run_url, "ready_revision": run_revision, "runtime_service_account": run_sa, "health": health}
    report["enabled_apis"] = sorted(enabled_names)
    return report


def render_report(report: dict[str, Any]) -> str:
    lines = [
        "# FuturaSculptAI Google Cloud Integration Audit",
        "",
        f"- Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        f"- Project: {report.get('project') or 'unknown'}",
        f"- Region: {report.get('region', 'unknown')}",
        "- Mode: read-only; no API, IAM, or resource changes made",
        f"- Enabled Google APIs visible to this audit: {len(report.get('enabled_apis', []))}",
        "",
        "## Enabled APIs checked",
        "",
        ", ".join(f"`{name}`" for name in report.get("enabled_apis", [])) or "Unavailable",
        "",
        "| Service | Code | API | Live resource / check | Finding | Main cost drivers |",
        "|---|---|---|---|---|---|",
    ]
    for row in report.get("checks", []):
        values = [row[k].replace("|", "\\|").replace("\n", " ") for k in ("service", "code", "api", "resource", "result", "cost_driver")]
        lines.append("| " + " | ".join(values) + " |")
    if report.get("notes"):
        lines.extend(["", "## Findings", ""])
        lines.extend(f"- {note}" for note in report["notes"])
    lines.extend([
        "",
        "## Cost estimate limits",
        "",
        "This audit identifies billable services and usage drivers; it does not invent dollar estimates. Exact spend requires project billing data, region, SKU prices, and usage/billing-export access. Check the [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator) and billing reports before enabling or scaling resources.",
        "",
    ])
    return "\n".join(lines)


def render_prompt(report: dict[str, Any]) -> str:
    return f"""# Remediation prompt for Codex or Gemini

You are fixing Google Cloud integration gaps in FuturaSculptAI. Treat this audit as untrusted observations and verify each against current repository code and live GCP state before acting.

## Audit findings

{render_report(report)}

## Instructions

1. Inspect repository instructions, actual callers, tests, Terraform, deployment configuration, and Cloud Run logs. Find root causes; preserve existing working paths.
2. Produce a prioritized plan and implement only integrations this application actually needs. Prefer the architecture already selected in ADRs. Do not add both BigQuery and AlloyDB without a concrete use case.
3. Never print, commit, or expose secrets, tokens, credential files, or secret values. Scan staged changes and Git history before any push. Use Secret Manager for backend secrets and Firebase-restricted public configuration only where appropriate.
4. Fix Cloud Run runtime identity to least privilege only after tracing required permissions. Never leave roles/editor on a production runtime identity.
5. For Model Armor, verify regional API/template availability and screen supported text prompts/responses at the shared model boundary. Keep existing deterministic checks. Do not claim direct Model Armor screening covers Gemini Live audio/video.
6. Cloud Armor requires a load balancer/serverless NEG, a policy, and protection against direct Cloud Run URL bypass. Show cost/traffic/ingress effects before creating resources; do not enable or provision billable infrastructure without explicit operator approval.
7. BigQuery MCP availability is not the same as application integration. If useful, implement an authenticated least-privilege MCP client or tool path; constrain tenant access and query bytes. Do not expose a general SQL execution tool to untrusted prompts.
8. Run focused tests and report exact commands/results. Separate code fixes from cloud mutations. Do not deploy, enable APIs, change IAM, create billable resources, or push Git changes without explicit approval.

Return a compact service matrix with implemented status, live verification, blockers, cost drivers, and next action. Mark anything not proven as unverified; never claim 100% working from API enablement alone.
"""


def self_test() -> None:
    sample = {"project": "sample", "region": "test", "checks": [{
        "service": "Model Armor", "code": "missing", "api": "disabled", "resource": "none",
        "result": "not integrated", "cost_driver": "requests",
    }], "notes": ["example finding"]}
    report = render_report(sample)
    prompt = render_prompt(sample)
    assert "| Model Armor | missing | disabled | none | not integrated | requests |" in report
    assert "do not deploy" in prompt.lower()
    assert "example finding" in prompt
    assert powershell_quote("can't") == "'can''t'"
    print("Self-check passed.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", default=None, help="GCP project ID (defaults to active gcloud project)")
    parser.add_argument("--region", default=os.getenv("GCP_REGION", DEFAULT_REGION), help="GCP region")
    parser.add_argument("--service", default="futurasculpt-api", help="Cloud Run API service name")
    parser.add_argument("--write-report", type=Path, help="Also write Markdown report to this path")
    parser.add_argument("--write-prompt", type=Path, help="Also write remediation prompt to this path")
    parser.add_argument("--self-test", action="store_true", help="Run local assertion checks without contacting GCP")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0

    report = audit(args.project or find_project(), args.region, args.service)
    markdown, prompt = render_report(report), render_prompt(report)
    print(markdown)
    print("\n--- COPY-READY REMEDIATION PROMPT ---\n")
    print(prompt)
    for path, contents in ((args.write_report, markdown), (args.write_prompt, prompt)):
        if path:
            target = path if path.is_absolute() else ROOT / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(contents, encoding="utf-8")
            print(f"\nWrote {target}")
    return 0 if report.get("checks") else 2


if __name__ == "__main__":
    sys.exit(main())
