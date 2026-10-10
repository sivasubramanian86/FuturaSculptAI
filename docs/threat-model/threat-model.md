# FuturaSculptAI: Threat Model & Security Posture (SAIF Alignment)

This document formalizes the threat model for FuturaSculptAI, evaluating attack vectors across users, data ingestion, LLM agents, MCP tools, and cloud infrastructure using STRIDE and Google SAIF (Secure AI Framework).

## 1. Trust Boundaries & Attack Surfaces

```text
[ External Untrusted Sources ] (PDFs, Images, Audio, User Prompts)
           |
       [ BOUNDARY 1: Web / Ingestion Gateway ] -> Cloud DLP & Model Armor
           |
[ Tenant-Isolated Backend Services ] (FastAPI, ADK Orchestrator)
           |
       [ BOUNDARY 2: Agent-to-Model / Agent-to-Tool ] -> Tool Allowlists & Scoped IAM
           |
[ Core Managed Infrastructure ] (Vertex AI, BigQuery, Firestore, GCS, Secret Manager)
```

---

## 2. Threat Analysis (STRIDE Matrix)

| Threat Category | Specific AI / Cloud Vulnerability | Impact | Mitigation / Security Control |
|---|---|---|---|
| **Spoofing** | Agent identity impersonation or forged tenant tokens. | Unauthorized multi-tenant data access. | Strict JWT tenant claims validation; short-lived GCP service account tokens for A3 executions; IAM Workload Identity Federation. |
| **Tampering** | Indirect prompt injection hidden inside uploaded PDFs or process logs (e.g., hidden instructions to leak data). | Agent hijack; unintended actions; corrupted graph links. | **Model Armor** prompt inspection; text normalization stripping control tags; structural separation of data from instructions; zero-execution rule on ingested content. |
| **Repudiation** | An approved operating model or agent blueprint executed without audit trail. | Inability to attribute changes or verify compliance. | Immutable **Outcome Ledger** & BigQuery audit log; every action logs `user_id`, `timestamp`, `evidence_ids`, and digital signature. |
| **Information Disclosure** | PII / employee names exposed in vector search or LLM outputs; cross-tenant cache leaks. | Privacy breach; GDPR/HIPAA non-compliance. | **Cloud Sensitive Data Protection (DLP)** masking at ingestion; tenant-scoped vector search filters (`tenant_id = ?`); cache keys include tenant hash and ACL. |
| **Denial of Service (DoS)** | Denial-of-Wallet via complex recursive scenario generation or token-exhaustion attacks. | Cloud cost explosion; service degradation. | Per-tenant rate limiting; preflight token estimation; strict session budget caps ($2.00 max); Cloud Run concurrency limits. |
| **Elevation of Privilege** | Agent manipulating tool parameters to execute unauthorized shell commands or cloud mutations. | Cloud environment compromise. | Strict typed JSON tool schemas; **Tool Allowlisting**; no arbitrary code execution tools in production; A4 consequential actions strictly disabled. |

---

## 3. Google SAIF (Secure AI Framework) Control Checklist

- [x] **SAIF-01: Expand Strong Security Foundations:** VPC Service Controls, least-privilege IAM roles, TLS 1.3 in transit, Cloud KMS CMEK encryption at rest.
- [x] **SAIF-02: Extend Detection and Response:** Cloud Audit Logs, OpenTelemetry traces recording prompt manifests, model routing, and tool invocations.
- [x] **SAIF-03: Automate Defenses to Keep Pace:** Model Armor automated content filtering on ingress and egress.
- [x] **SAIF-04: Harmonize Platform Controls:** Uniform tenant boundary enforcement across BigQuery, Firestore, and Vertex AI.
- [x] **SAIF-05: Adapt Controls for AI Capabilities:** Explicit human-in-the-loop (HITL) gates for A2/A3 actions; total prohibition of A4 consequential actions.
- [x] **SAIF-06: Contextualize AI System Risks:** Sector-specific compliance profiles (FDA CFR Part 11 for Food Manufacturing, HIPAA for Healthcare).
