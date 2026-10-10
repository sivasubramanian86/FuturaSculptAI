---
name: futurasculpt-security-audit
description: Scans repository for secrets, evaluates SAIF controls, checks Bandit/Ruff security rules, and verifies Model Armor boundaries.
---

# FuturaSculptAI Security Audit Skill

## Purpose
Enforces enterprise DevSecOps and Google SAIF controls. Guarantees zero credential leaks, verifies least-privilege IAM policies, and prevents unauthorized actions.

## Triggers
- Before any Git commit or pull request.
- Prior to Cloud Run deployment or live infrastructure binding.

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
$patterns = 'AIza[0-9A-Za-z-_]{35}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN.*PRIVATE KEY|password\s*=\s*["\x27][^"\x27]{6,}'
$secretHits = Get-ChildItem -Recurse -Include "*.py","*.ts","*.js","*.json","*.yaml","*.toml","*.env" |
  Where-Object { $_.FullName -notmatch "node_modules|\.git|__pycache__" } |
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
