# FuturaSculptAI: Autonomy & Risk Tiers (A0-A4 Framework)

FuturaSculptAI adheres to a strict 5-tier risk and autonomy envelope. This framework aligns with Google SAIF principles and enterprise governance standards, preventing unconstrained or dangerous autonomous actions.

## Autonomy Matrix

| Tier | Category | Autonomy Level | Example Actions | Required Governance & Verification Gates |
|---|---|---|---|---|
| **A0** | **Observe** | Fully Autonomous | Ingest documents, extract entities, compute graph metrics, run read-only queries, generate telemetry. | Read-only permissions; tenant-isolated credentials; DLP scanning on ingestion. |
| **A1** | **Recommend** | Autonomous with Critic Gate | Propose future scenarios, recommend task allocations (`Augment`, `Automate`), draft emerging roles, suggest skills pathways. | **Adversarial Critic Agent** verification; evidence citation check (Claim-to-Source entailment); confidence threshold >= 0.70. |
| **A2** | **Prepare** | Autonomous Preparation; Approval to Publish | Generate Jira implementation backlogs, author Google ADK agent specifications, draft Terraform IaC manifests. | Draft status in database; explicit Human-in-the-Loop (HITL) review and click-to-approve before committing or exporting. |
| **A3** | **Execute Reversible** | Strict Approval Required | Provision an isolated sandbox Cloud Run instance, create a test BigQuery dataset, trigger a synthetic test pipeline. | Dual-approver authorization; short-lived GCP service account token (TTL <= 15 min); strict FinOps budget cap ($50.00); automated 1-click rollback hook. |
| **A4** | **Consequential** | **PROHIBITED IN MVP** | Triggering live production infrastructure changes, executing financial fund transfers, modifying live payroll, or making individual employment decisions. | **Strictly blocked at API Gateway and Database Security Rules level.** |

---

## Escalation & Circuit Breaker Protocol

1. **Confidence Threshold Breach:** If an agent's confidence score drops below 0.60, the workflow immediately pauses and requests human input or flags `INSUFFICIENT_EVIDENCE`.
2. **Policy Violation Intercept:** If a prompt or tool call attempts to access A4 capabilities or violate Responsible Workforce Red Lines, the **Trust Governance Agent** trips the circuit breaker:
   - Terminates the agent execution loop immediately.
   - Logs an immutable security incident event to Cloud Logging.
   - Returns a typed error response (`ERR_GOVERNANCE_REDLINE_TRIGGERED`) to the caller.
3. **FinOps Budget Tripwire:** If an interactive scenario simulation exceeds its pre-allocated token or cost budget (e.g., $1.00 per interactive session), downstream reasoning calls are downgraded to Gemini Flash or throttled.
