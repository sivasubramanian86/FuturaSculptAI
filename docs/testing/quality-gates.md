# FuturaSculptAI: Quality Gates & Verification Standards

This document establishes the non-negotiable verification gates required for every phase and feature.

## 1. Test-Driven Development (TDD) Hierarchy

FuturaSculptAI organizes both backend and frontend test suites into clean, distinct tiers with strict 100.0% coverage quality gates.

### Backend Test Organization (`apps/api/tests/`)
1. **Unit Testing (`apps/api/tests/unit/`):**
   - Mandatory for all deterministic scoring calculators (RRI, TRS, WAI, HOS, TrustScore), policy engine evaluations, RBAC permissions, tenant boundaries, logging, and custom exception hierarchies.
   - Pinned coverage threshold: `--cov-fail-under=100` on deterministic scoring and core domain logic.
   - Files: `test_scoring.py`, `test_rbac_and_auth.py`, `test_logging_and_exceptions.py`, `test_security_redlines.py`.
   - Zero bypass policy: no `@pytest.mark.skip` or cheat flags on business logic.

2. **Integration Testing (`apps/api/tests/integration/`):**
   - Tests vertical subsystem integration: routers, adapters (Vertex AI, DLP), prompt orchestrator with dynamic Gemini model routing, temporal WorkGraph engine, and stateful services.
   - Files: `test_agents.py`, `test_evidence.py`, `test_governance.py`, `test_health.py`, `test_onboarding.py`, `test_opportunity.py`, `test_scenarios.py`, `test_tasks.py`, `test_temporal_workgraph.py`, `test_vertex_and_orchestrator.py`, `test_workgraph.py`.

3. **End-to-End (E2E) Lifecycle Testing (`apps/api/tests/e2e/`):**
   - Full 10-step autonomous transformation lifecycle from onboarding and raw telemetry ingestion through multi-agent deliberation, scenario forecasting, task sculpting, A2 governance sign-off, and Diligence Pack generation.
   - Files: `test_e2e_lifecycle.py`.

4. **Agent Evaluation Suite (`apps/api/tests/evals/`):**
   - Evaluates multi-agent trajectories and groundedness using Google ADK trajectory evaluations and golden dataset:
     - Groundedness Rate (Claim-to-source entailment >= 95%).
     - Tool Trajectory Accuracy (Correct tool calling sequence >= 90%).
     - Policy Adherence (0 red-line violations).
   - Files: `test_adk_agent_eval.py` (`golden/trajectories.json`).

### Frontend Test Organization (`apps/web/src/tests/`)
1. **Unit Testing (`apps/web/src/tests/unit/`):**
   - Isolated tests for standalone presentation components, utilities, and error boundaries.
   - Files: `AboutFuturaSculpt.test.tsx`, `ErrorBoundary.test.tsx`, `FAQHelp.test.tsx`, `GuidedTourModal.test.tsx`, `Header.test.tsx`, `SettingsStudio.test.tsx`, `TrustScoreCard.test.tsx`, `ScenarioCard.test.tsx`, `logger.test.ts`, `i18n.test.ts`.

2. **Integration Testing (`apps/web/src/tests/integration/`):**
   - Tests interactive feature studios, workbench components, API service adapters, and Firebase client SDK layer.
   - Files: `api.test.ts`, `firebase.test.ts`, `EvidenceDrawer.test.tsx`, `WorkGraphView.test.tsx`, `TaskSculptor.test.tsx`, `OpportunityEngine.test.tsx`, `AgentSwarmConsole.test.tsx`, `TransformationRoadmapStudio.test.tsx`, `TrustBoardWorkbench.test.tsx`, `MultiModalMediaStudio.test.tsx`, `OnboardingModal.test.tsx`, `CitizenOverview.test.tsx`.

3. **End-to-End (E2E) Journey Testing (`apps/web/src/tests/e2e/`):**
   - Full user journey through Citizen Sanctuary, Enterprise Executive Cockpit, Aura Hologram voice assistant, and governance sign-off gates.
   - Files: `App.test.tsx`, `AppShell.test.tsx`, `AuraHologramAssistant.test.tsx`, `e2e_journey.test.tsx`.

## 2. Security & Static Analysis Standards
- **Ruff:** Strict selection `["D", "ANN", "S", "E", "W", "F", "B", "I"]`. Zero warnings, zero errors.
- **Bandit:** Zero high/medium security issues (`bandit -r app`).
- **Secret Scan:** Zero committed secrets or credentials (`scripts/security_scan.ps1`).

## 3. Accessibility & Frontend Quality Gates
- **WCAG 2.1 AA:** Full keyboard navigation, ARIA Live announcements, and compliant contrast ratios.
- **Strict TypeScript:** Zero compile errors (`npm run build`).

