# FuturaSculptAI: Quality Gates & Verification Standards

This document establishes the non-negotiable verification gates required for every phase and feature.

## 1. Test-Driven Development (TDD) Hierarchy

1. **Unit Testing (`tests/unit/`):**
   - Mandatory for all deterministic scoring calculators (RRI, TRS, WAI, HOS, TrustScore), policy engine evaluations, routing algorithms, cache key hashing, and schema validations.
   - Pinned coverage threshold: `--cov-fail-under=100` on deterministic scoring and core domain logic.
   - Zero bypass policy: no `@pytest.mark.skip` or cheat flags on business logic.

2. **Contract Testing (`tests/contract/`):**
   - Validates typed Pydantic request/response contracts for FastAPI endpoints, ADK agent specialist interfaces, and MCP tool schemas.

3. **Integration Testing (`tests/integration/`):**
   - Tests the vertical control loop: Ingestion -> EvidenceEnvelope -> WorkGraph projection -> Scenario Foundry -> Verification -> Approval.

4. **Agent Evaluation Suite (`evals/golden/`):**
   - Evaluates non-deterministic agent outputs using Google ADK trajectory evaluations and golden test datasets.
   - Evaluates:
     - Groundedness Rate (Claim-to-source entailment >= 95%).
     - Tool Trajectory Accuracy (Correct tool calling sequence >= 90%).
     - Policy Adherence (0 red-line violations).

5. **Security & Static Analysis:**
   - **Ruff:** Strict selection `["D", "ANN", "S", "E", "W", "F", "B", "I"]`. Zero warnings, zero errors.
   - **Bandit:** Zero high/medium security issues (`bandit -r agents apps/api packages`).
   - **Gitleaks:** Zero committed secrets or credentials.

6. **Accessibility & Frontend Quality:**
   - Vitest + `axe-core` assertions (`toHaveNoViolations()`) for major cockpit views.
   - Strict TypeScript compiler check (`tsc --noEmit`).
