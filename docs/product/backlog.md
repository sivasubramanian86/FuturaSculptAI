# FuturaSculptAI: Master Engineering Backlog

This backlog organizes the full Prompt-to-Production implementation lifecycle into structured, milestone-driven phases (Phase 0 through Phase 9).

## Phase Summary & Progress

| Phase | Title | Focus | Status |
|---|---|---|---|
| **Phase 0** | Discovery & Contract | Repo inventory, skills map, C4 diagrams, schemas, ADRs, GEMINI.md | 🟡 IN PROGRESS |
| **Phase 1** | Skeleton & Vertical Slice | Monorepo scaffolding, FastAPI backend, React cockpit, Food Mfg slice | ⚪ PENDING |
| **Phase 2** | Multimodal Ingestion & Retrieval | Document AI, audio/video ingestion, DLP redaction, Evidence Ledger | ⚪ PENDING |
| **Phase 3** | WorkGraph & Future Scenarios | BigQuery temporal tables, 4 scenario generators, Healthcare/Banking capsules | ⚪ PENDING |
| **Phase 4** | Multi-Agent Orchestration | Google ADK coordinator + 14 specialists, A0-A3 autonomy, critic loops | ⚪ PENDING |
| **Phase 5** | Dynamic Intelligence Layer | Model Gateway, versioned Prompt Compiler, L0-L4 caching, Memory Broker | ⚪ PENDING |
| **Phase 6** | Opportunity Forge & Pathways | Pain-to-solution pipeline, ADK agent blueprinting, RRI/TRS scoring, pathways | ⚪ PENDING |
| **Phase 7** | TrustBoard & Investor Lens | Well-Architected 6 pillars, SAIF audit, <15min self-service investor sandbox | ⚪ PENDING |
| **Phase 8** | Hardening & Cloud Deployment | Terraform IaC, Cloud Run deployment, Model Armor, load/resilience tests | ⚪ PENDING |
| **Phase 9** | Hackathon Package & Demo | Video script, pitch deck, README, YouTube demo, Devpost submission | ⚪ PENDING |

---

## Detailed Phase Breakdown

### Phase 0: Discovery & Contract (Current Phase)
- [x] Ep-001: Discover local toolchains, Python 3.12, Node 22, gcloud CLI, active GCP projects.
- [x] Ep-002: Inventory global and user skills in `~/.gemini/skills/` and create missing workspace skills in `.agents/skills/`.
- [x] Ep-003: Initialize Git repository, configure hardened `.gitignore`, and set up session memory (`futurasculptai.md`).
- [x] Ep-004: Author Product Charter, Domain Glossary, Competitive Boundary, User Journeys, Responsible Workforce Rules.
- [x] Ep-005: Author C4 Architecture Diagrams (Mermaid), Work Transformation Graph Schema, EvidenceEnvelope contract.
- [x] Ep-006: Define Autonomy Risk Tiers (A0-A4), Score Contracts, Cost Envelope, Threat Model, and ADRs.
- [x] Ep-007: Author repository `GEMINI.md` binding all architecture, product, and security contracts.
- [x] Ep-008: Compile `docs/discovery-report.md` and present Phase 0 checkpoint for user approval.

### Phase 1: Skeleton & Trusted Vertical Slice
- [ ] Ep-101: Scaffold clean monorepo: `apps/web`, `apps/api`, `agents/`, `packages/`.
- [ ] Ep-102: Implement FastAPI backend with Pydantic contracts and health probe endpoints.
- [ ] Ep-103: Implement React 18 + Vite + TypeScript frontend with dark-mode glassmorphic enterprise cockpit.
- [ ] Ep-104: Ingest sample Food Manufacturing operational SOP and role/task dataset.
- [ ] Ep-105: Render minimal WorkGraph and single conservative scenario with evidence drawer.
- [ ] Ep-106: Unit test suite for contracts, deterministic scoring, and health checks with 100% green build.

### Phase 2: Multimodal Ingestion & Retrieval
- [ ] Ep-201: Implement `EvidenceEnvelope` parser supporting PDF, CSV, images, audio, and video.
- [ ] Ep-202: Integrate Cloud DLP / Sensitive Data Protection adapter for automated PII masking.
- [ ] Ep-203: Build Evidence Ledger with SHA-256 integrity checks, temporal validity, and ACL enforcement.
- [ ] Ep-204: Build Evidence Verifier agent to check claim-to-source entailment and flag unsupported assertions.

### Phase 3: WorkGraph & Future Scenarios
- [ ] Ep-301: Implement temporal Work Transformation Graph service with point-in-time traversal.
- [ ] Ep-302: Build Scenario Foundry executing Conservative, Accelerated, Disruptive, and Human-First engines.
- [ ] Ep-303: Integrate sector configuration capsules: Food Manufacturing (deep), Healthcare (proof), Banking (proof).
- [ ] Ep-304: Build interactive Cytoscape/Force-directed graph visualizer in the React cockpit.

### Phase 4: Multi-Agent Orchestration (Google ADK)
- [ ] Ep-401: Implement `EngagementOrchestrator` coordinator using Google ADK.
- [ ] Ep-402: Implement specialist agents: WorkGraphAgent, FutureSignalsAgent, TaskRedesignAgent, SkillsMobilityAgent, BusinessSolutionAgent, AgentBlueprintAgent, TrustGovernanceAgent, FinOpsAgent, AdversarialCriticAgent.
- [ ] Ep-403: Enforce A0-A3 autonomy guardrails, timeout budgets, and rollback mechanisms.
- [ ] Ep-404: Golden trajectory evaluation tests with ADK eval suite.

### Phase 5: Dynamic Intelligence Layer
- [ ] Ep-501: Implement Dynamic Model Gateway with cost/complexity/SLO routing across Vertex AI Gemini models.
- [ ] Ep-502: Implement versioned Prompt Compiler (immutable envelope + tenant rules + task recipe + evidence).
- [ ] Ep-503: Implement multi-tier Cache Manager (L0-L4) with tenant/ACL cache keys and TTL expiration.
- [ ] Ep-504: Implement Memory Broker managing working, episodic, and semantic memory with strict privacy filters.

### Phase 6: Opportunity Forge & Pathways
- [ ] Ep-601: Build Opportunity Forge converting operational pain points into 13-part enterprise solutions.
- [ ] Ep-602: Build Task Redesign Matrix (Retain, Assist, Augment, Automate, Redesign, Retire).
- [ ] Ep-603: Implement deterministic Role Resilience Index (RRI) and Transition Readiness Score (TRS) calculators.
- [ ] Ep-604: Build Personalized Career Pathways portal with skill gap analysis and curated learning roadmaps.

### Phase 7: TrustBoard & Investor Lens
- [ ] Ep-701: Implement Well-Architected 6-pillar scoring and Google SAIF control matrix.
- [ ] Ep-702: Build Investor Lens self-service sandbox generating diligence dossiers in < 15 minutes.
- [ ] Ep-703: Implement interactive assumption sensitivity sliders and exportable evidence packs.

### Phase 8: Hardening & Cloud Deployment
- [ ] Ep-801: Author Terraform configurations for Cloud Run, BigQuery, Firestore, Secret Manager, Cloud Storage.
- [ ] Ep-802: Implement Model Armor and VPC Service Controls security policies.
- [ ] Ep-803: Configure GitHub Actions CI/CD with Gitleaks, Ruff, Bandit, Vitest, and Cloud Run automated deployment.
- [ ] Ep-804: Run load, resilience, and WCAG accessibility audits.

### Phase 9: Hackathon Package & Demo
- [ ] Ep-901: Record 3-minute video pitch demonstrating the end-to-end closed control loop.
- [ ] Ep-902: Author comprehensive README.md, architecture diagrams, and judging criteria mapping.
- [ ] Ep-903: Finalize Devpost submission for AI Builder Cup 2026 Future of Work track.
