# Security Policy

## Responsible Disclosure & Governance

FuturaSculptAI adheres to enterprise security, zero-trust tenant boundaries, and Google's **Secure AI Framework (SAIF)**.
We take vulnerabilities, data integrity, and compliance seriously.

---

## Supported Versions

| Version | Supported | Security Maintenance Status |
|:---|:---:|:---|
| `0.1.x` (Phase 1/2 Hackathon Build) | :white_check_mark: | Active Security Patching |
| `< 0.1.0` | :x: | End of Life / Unsupported |

---

## Reporting a Vulnerability

If you discover a security vulnerability, privilege escalation risk, prompt injection bypass, or cross-tenant data exposure:

1. **Do NOT open a public GitHub issue.**
2. Send an encrypted advisory to the core maintainers at:
   - **Email:** `security@futurasculpt.internal` / `kailasamsiva@gmail.com`
   - **Subject:** `[SECURITY] FuturaSculptAI Vulnerability Disclosure - <Brief Summary>`
3. Include the following details:
   - Detailed description of the vulnerability and attack vector.
   - Proof of Concept (PoC) steps or minimal reproduction script.
   - Potential impact (e.g., cross-tenant leak, unauthorized RRI scoring mutation, Model Armor evasion).
   - Any recommended remediation steps.

### Response SLA
- **Initial Acknowledgement:** Within **24 hours**.
- **Triage & Severity Classification:** Within **48 hours**.
- **Remediation & Patch Deployment:** Within **7 days** (Critical) or **14 days** (High).

---

## Security Architecture & Non-Negotiables

FuturaSculptAI enforces strict architectural security non-negotiables:

1. **Zero Hardcoded Secrets:**
   - No credentials, tokens, or private keys are ever committed to source code or git history.
   - Production secrets are injected dynamically via **Google Cloud Secret Manager**.
   - Automated secret scanners (`bandit`, local regex scanner, and GitHub secret scanning) run in pre-commit and CI workflows.

2. **Strict Multi-Tenant Isolation:**
   - Every incoming request must provide an explicit, non-empty `X-Tenant-ID` header.
   - Cross-tenant data leakage is structurally prevented at both the database and service boundaries.

3. **Responsible AI Red Lines:**
   - Automated sanitization and rejection of adversarial prompts attempting:
     - Direct automated terminations or firing decisions.
     - Unaudited salary or compensation slashing.
     - Protected demographic discrimination (gender, age, race, disability).
     - PII extraction (SSN, credit card, national ID).

4. **Evidence Provenance & Immutability:**
   - Every uploaded document or citation is cryptographically fingerprinted using **SHA-256**.
   - Evidence records cannot be altered post-ingestion without invalidating their verification hashes.

5. **IAM Least Privilege:**
   - Public traffic is restricted exclusively to frontend entrypoints.
   - Backend APIs and microservices enforce identity-aware access and Cloud IAM least privilege (`roles/run.invoker`, `roles/aiplatform.user`).
