---
name: futurasculpt-security-audit
description: Scans repository for secrets, evaluates SAIF controls, checks Bandit/Ruff security rules, and verifies Model Armor boundaries.
version: "1.0.0"
author: "FuturaSculptAI Platform Engineering"
allowed_tools:
  - scan_hardcoded_secrets
  - run_bandit_security_analysis
  - verify_model_armor_sanitizer
  - check_responsible_workforce_redlines
---

# FuturaSculptAI Security Audit Skill

## Purpose
Enforces enterprise DevSecOps and Google SAIF controls. Guarantees zero credential leaks, verifies least-privilege IAM policies, and prevents unauthorized actions.

## Tool Declarations & Input Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class SecurityAuditInput(BaseModel):
    """Input parameters for DevSecOps and SAIF security audit."""
    target_directory: str = Field(default=".", description="Root directory to scan.")
    enforce_zero_secrets: bool = Field(default=True, description="Enforce strict zero hardcoded credentials rule.")
    enforce_k_anonymity: int = Field(default=10, ge=5, description="Minimum cohort size for workforce telemetry.")
    idempotency_key: str = Field(..., min_length=16, description="Cryptographic security scan run token.")

class SecurityAuditOutput(BaseModel):
    """Security audit scorecard."""
    secrets_detected_count: int = Field(default=0, ge=0)
    bandit_vulnerabilities_count: int = Field(default=0, ge=0)
    model_armor_passed: bool = True
    red_lines_compliant: bool = True
    security_gate_passed: bool
    findings: List[str] = Field(default_factory=list)
```

## Deterministic Credential Isolation (Zero-Trust to Model)
- **Zero-Trust Model:** The security scanner evaluates static patterns and ASTs. It never passes live environment secrets or tokens to LLMs.
- **Execution Broker Layer:** All scanning runs locally without network egress. Model Armor sanitization is enforced deterministically via local Python regex/NFKC normalization before prompts reach the LLM gateway.

## Execution Sandboxing & Idempotency
- **Idempotency Guarantee:** Scans are idempotent, returning deterministic findings for a given commit SHA.
- **Compensating Action / Saga Readiness:** The security scan operates in read-only observation mode with zero mutation to checked-in code.

## Audit Procedure
1. **Secret & Credential Scan:**
   - Scan workspace for high-risk patterns (API keys, service account JSON files, private keys, .env files).
2. **Bandit Static Security Analysis:**
   - Run Bandit on Python packages: assert zero Medium or High severity vulnerabilities.
3. **Model Armor & Injection Protection Check:**
   - Verify all untrusted input channels (user prompts, file uploads) route through Model Armor sanitization wrappers.
4. **Responsible Workforce Guardrail Check:**
   - Verify that all endpoints handling workforce analytics enforce minimum cohort size (k >= 10) and prohibit A4 actions.

## Verification Script (PowerShell)
```powershell
# 1. Regex secret scan
$patterns = 'AIza[0-9A-Za-z-_]{35}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN.*PRIVATE KEY'
$secretHits = Get-ChildItem -Recurse -Include "*.py","*.ts","*.js","*.json","*.yaml","*.toml" |
  Where-Object { $_.FullName -notmatch "node_modules|\.git|__pycache__|\.venv" } |
  Select-String -Pattern $patterns

if ($secretHits) {
    Write-Error "CRITICAL: Hardcoded secrets detected!"
    $secretHits | Select-Object Filename, LineNumber, Line
    exit 1
} else {
    Write-Host "PASSED: Zero secrets detected."
}
```

## Expected Output
Security findings report with severity, location, and remediation status.
