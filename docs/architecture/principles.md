# FuturaSculptAI: Architectural Principles

The architecture of FuturaSculptAI adheres to core tenets ensuring enterprise-grade scalability, defensibility, and security:

## 1. Closed-Loop Transformation Cycle
Transformation cannot be a static, one-time consulting report. The architecture must enforce an 8-stage operational feedback loop:
```text
Sense -> Model -> Simulate -> Sculpt -> Govern -> Execute -> Measure -> Learn
```
Every stage produces typed data structures stored in temporal ledgers (Evidence Ledger, WorkGraph, Outcome Ledger).

## 2. Temporal Digital Twin
The enterprise operating model is inherently temporal. Relationships evolve as technology matures, markets shift, and policies update.
- Every node and edge in the Work Transformation Graph contains temporal validity bounds (`valid_from`, `valid_to`).
- Point-in-time traversal allows querying past baselines, present state, and simulated future horizons without destructive overwrites.

## 3. Evidence-Grounded Lineage (Zero-Fabrication Contract)
No agent is permitted to make unsupported assertions.
- Every external factual claim must cite an `evidence_id`.
- The system maintains a cryptographic SHA-256 hash and origin timestamp for all source material.
- If evidence is insufficient, the system returns `INSUFFICIENT_EVIDENCE` rather than extrapolating speculative conclusions.

## 4. Deterministic Consequential Scoring
Large Language Models are non-deterministic and prone to drift.
- Consequential scores (**Role Resilience**, **Transition Readiness**, **Workforce Adaptability**, **Human Opportunity**, **Well-Architected compliance**) are calculated by **pure, versioned deterministic code** (Python/TypeScript).
- AI models are used for unstructured evidence extraction, entity resolution, semantic synthesis, and narrative explanations—never for calculating final mathematical indices.

## 5. Human-Governed Autonomy by Risk Tier (A0-A4)
Agent autonomy is strictly constrained by risk classification:
- **A0 (Observe):** Read-only analysis and graph queries are fully autonomous.
- **A1 (Recommend):** Scenario proposals require critic verification before presentation.
- **A2 (Prepare):** Draft specifications and backlogs require human review before publishing.
- **A3 (Execute Reversible):** Low-risk sandbox environment mutations require explicit human approval, short-lived credentials, budget limits, and automated rollback hooks.
- **A4 (Consequential):** Autonomous employment, production, or financial changes are **prohibited**.

## 6. Multi-Tenant Isolation & Least-Privilege IAM
- Multi-tenancy is enforced from day one. Every database query, cache key, vector search, and agent execution is strictly partitioned by `tenant_id`.
- All service-to-service communication leverages Google Cloud IAM service accounts with least-privilege role bindings.
- Zero secrets in source code; all partner tokens are resolved at runtime via Google Secret Manager.

## 7. Dynamic Intelligence: Gateway, Compiler, and Multi-Tier Cache
- **Model Gateway:** Dynamically routes requests to the lowest-cost Vertex AI Gemini model predicted to satisfy the quality threshold and latency SLO; avoids hardcoded model dependencies.
- **Prompt Compiler:** Dynamically synthesizes task prompts from immutable policy envelopes, tenant rules, task recipes, and retrieved evidence into audited prompt manifests.
- **Multi-Tier Caching:** Implements exact request (L0), semantic (L1), retrieval (L2), Vertex context (L3), and artifact (L4) caching to optimize FinOps performance.
