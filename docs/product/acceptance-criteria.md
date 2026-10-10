# FuturaSculptAI: Acceptance Criteria by Module

This document defines the strict Definition of Done (DoD) and testable acceptance criteria for each core subsystem.

## 1. Evidence Ingestion & Ledger (Module 1)
- [ ] Accepts PDF, CSV, image (diagrams/charts), audio (MP3/WAV), video (MP4), and JSON payloads up to 50MB.
- [ ] Every ingested item produces a validated `EvidenceEnvelope` containing `evidence_id`, `tenant_id`, `sha256_hash`, `timestamp`, `acl`, `sensitivity`, and `source_uri`.
- [ ] Cloud DLP / Sensitive Data Protection masks sensitive PII (names, emails, phones, SSNs) prior to persistence.
- [ ] Evidence text segments include source page numbers, bounding boxes, or media timestamp offsets.
- [ ] Unverifiable or corrupted files fail gracefully with typed error codes (`ERR_INGESTION_CORRUPT`).

## 2. Temporal Work Transformation Graph (Module 2)
- [ ] Represents all 11 core node types: `Outcome`, `Capability`, `Workflow`, `Task`, `Role`, `Skill`, `System`, `Data`, `Agent`, `Control`, `Technology`.
- [ ] Graph edges contain `edge_type`, `valid_from`, `valid_to`, `confidence` (0.0-1.0), and `evidence_ids`.
- [ ] Supports temporal point-in-time traversal (`as_of_timestamp`), allowing comparison between past baselines, present state, and simulated future state.
- [ ] Graph serialization supports typed JSON, BigQuery table schema export, and interactive Cytoscape/Force-directed UI layout.

## 3. Future Scenario Foundry (Module 3)
- [ ] Generates exactly 4 scenario classes per assessment run: `Conservative`, `Accelerated`, `Disruptive`, `Human-First`.
- [ ] Every scenario provides:
  - 3-Year EBITDA Impact ($ or % range).
  - Net New Roles created vs. Transformed Roles.
  - Confidence Score and explicit Uncertainty Range.
  - List of Invalidation Triggers (conditions under which the scenario collapses).
  - Minimum 3 Counterfactual assumptions.
- [ ] Zero fabricated market figures; all projections derive from documented evidence or user-editable assumption parameters.

## 4. Task Redesign Matrix & Sculptor (Module 4)
- [ ] Classifies every task in the workflow into one of six categories: `Retain`, `Assist`, `Augment`, `Automate`, `Redesign`, `Retire`.
- [ ] Each classification requires a documented rationale, target agent/system mapping, and estimated cycle time reduction.
- [ ] Human approval gate (HITL) required before any redesigned task state transitions from `Draft` to `Approved`.

## 5. Workforce Opportunity Engine & Pathways (Module 5)
- [ ] Computes deterministic metrics: Role Resilience Index (RRI), Transition Readiness Score (TRS), Workforce Adaptability Index (WAI), Human Opportunity Score (HOS).
- [ ] Generates personalized transition pathways mapping existing roles to emerging adjacent roles with specific skill gaps and targeted learning modules.
- [ ] Enforces responsible workforce rules: minimum cohort size (k >= 10), zero layoff suggestions, zero protected attribute evaluation.

## 6. Opportunity Forge (Module 6)
- [ ] Converts any user-submitted operational pain point into a complete 13-part solution package:
  1. Current-state evidence citations.
  2. Root cause hypotheses.
  3. Desired business outcome & target KPI.
  4. Future human-agent workflow diagram.
  5. Google Cloud reference architecture.
  6. Required tools/APIs & MCP server bindings.
  7. New & transformed job roles.
  8. Upskilling curriculum.
  9. Financial unit economics & cost envelope.
  10. SAIF security controls & compliance mapping.
  11. Validation and trajectory evaluation plan.
  12. Phased implementation backlog (Jira-ready epics/stories).
  13. Production-ready Google ADK multi-agent starter specification.

## 7. Dynamic Intelligence Layer: Gateway, Prompts, Cache, Memory (Module 7)
- [ ] Dynamic Model Gateway selects optimal model based on complexity, modality, latency SLO, and budget; never relies on a single hardcoded model.
- [ ] Prompt Compiler dynamically combines immutable policy envelopes, tenant rules, task recipes, and retrieved evidence; generates an audit prompt manifest.
- [ ] Multi-tier cache (L0 Request, L1 Semantic, L2 Retrieval, L3 Vertex Explicit Context, L4 Artifact) achieves >= 40% cost reduction on repeated runs.
- [ ] Memory Broker enforces strict tenant isolation, RBAC permissions, and TTL expiration across working, episodic, and semantic memory.

## 8. TrustBoard & Investor Lens (Module 8)
- [ ] TrustBoard scores Google Well-Architected 6 pillars (Operational Excellence, Security, Reliability, Performance, Cost, Sustainability) and SAIF compliance (0-100).
- [ ] Red-line security violations block agent execution or deployment approval.
- [ ] Investor Lens allows uploading redacted enterprise data, generating a complete transformation thesis, defensibility analysis, and downloadable diligence pack in < 15 minutes.
