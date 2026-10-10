# FuturaSculptAI: Security Non-Negotiables

This document specifies the mandatory security, privacy, and compliance constraints that every pull request, release, and cloud deployment must satisfy without exception.

## 1. Zero Credential Exposure
- **No Hardcoded Secrets:** No API keys (e.g. `AIza...`, `sk-...`), service account JSON keys, database passwords, private keys, or bearer tokens may exist in source control.
- **Secret Manager Binding:** All third-party tokens and service credentials must be fetched at runtime via Google Secret Manager using IAM Application Default Credentials (ADC).
- **Gitleaks Enforcement:** Gitleaks scans are executed locally and enforced as a blocking check in CI workflows (`.github/workflows/security_audit.yml`).

## 2. Multi-Tenant Isolation
- **Tenant Scoping:** All API endpoints, BigQuery queries, Firestore collections, and vector search operations MUST include an explicit `tenant_id` filter. Cross-tenant leakage is treated as a Severity 1 incident.
- **Cache Partitioning:** Multi-tier cache keys must include the `tenant_id` and ACL fingerprint to prevent cross-tenant cache contamination.

## 3. Data Privacy & DLP
- **Mandatory Cloud DLP Ingestion:** All raw unstructured text, transcripts, and documents pass through Cloud Sensitive Data Protection (DLP) to redact PII (names, emails, phones, SSNs, credit cards) before indexing.
- **k-Anonymity (k >= 10):** Aggregate workforce analytics must suppress any group with fewer than 10 individuals to prevent de-anonymization.

## 4. Prompt Injection & Agent Security
- **Model Armor Inspection:** All incoming user prompts and retrieved evidence passages are screened via Model Armor for jailbreaks, prompt injections, and system prompt override attempts.
- **Data vs. Instruction Separation:** Ingested documents are treated strictly as untrusted data; the system shall never execute instructions embedded within uploaded documents.
- **Typed Tool Schemas:** Tool execution parameters are strictly validated against Pydantic schemas. Free-form shell commands are prohibited.

## 5. Autonomy Red Lines
- **Prohibited A4 Consequential Actions:** Autonomous termination, layoff rankings, individual disciplinary action, or compensation adjustments are strictly blocked at API and database rule boundaries.
