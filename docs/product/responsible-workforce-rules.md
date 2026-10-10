# FuturaSculptAI: Responsible Workforce Rules & Ethical Red Lines

This document defines the strict, non-negotiable boundaries governing all workforce analysis, role evaluations, and agent behaviors within FuturaSculptAI. These rules are enforced deterministically at the API, database, and agent gateway levels.

## 1. Absolute Ethical Red Lines

1. **NO Autonomous Adverse Employment Actions:**
   - The system shall NEVER recommend, trigger, or suggest the termination, demotion, disciplinary action, or compensation reduction of any named individual.
   - All A4 consequential actions are strictly prohibited in the system architecture.

2. **NO Individual Layoff or Downsizing Rankings:**
   - The platform strictly forbids generating "layoff priority lists", "headcount cut candidates", or rank-ordered termination recommendations.
   - Any prompt or user input requesting termination rankings shall be rejected by the API gateway with a policy violation error (`ERR_POLICY_UNLAWFUL_WORKFORCE_ACTION`).

3. **NO Inference or Storage of Protected Attributes:**
   - The platform shall NEVER infer, extrapolate, or store protected characteristics (e.g., race, gender, age, religion, sexual orientation, disability status, union membership, or parental status).
   - Ingestion pipelines run Cloud Sensitive Data Protection (DLP) and automated regex masking to redact any demographic attributes before data reaches the Work Transformation Graph.

4. **Mandatory Minimum Cohort Thresholds (k-Anonymity):**
   - Aggregate workforce analytics (e.g., skill distribution, role resilience, turnover risk) must enforce a minimum cohort size of **k >= 10 individuals**.
   - If a filtered group contains fewer than 10 individuals, the system suppresses the data and reports `"Cohort size below privacy threshold (n < 10)"`.

5. **Consent-Based Individual Mobility:**
   - Individual pathway and skills analysis operates strictly under an **opt-in, consent-first** paradigm.
   - Personal career trajectory analysis is accessible solely by the employee themselves, not visible to managers as an evaluation score.

## 2. Deterministic Scoring Integrity

1. **No Silent Model Weighting:**
   - All consequential workforce scores (**Role Resilience Index**, **Transition Readiness Score**, **Workforce Adaptability Index**, **Human Opportunity Score**) must be computed by **deterministic, versioned Python/TypeScript algorithms**.
   - Large Language Models (LLMs) are restricted to unstructured evidence extraction, semantic taxonomy linking, and explanatory narratives. LLMs shall NEVER set score weights, adjust mathematical formulas, or calculate the final numerical index.

2. **Full Factor Transparency & Mathematical Auditability:**
   - Every computed score must expose its exact mathematical breakdown, input parameters, evidence IDs, and versioned formula ID (e.g., `formula_version: "2026.1-rri"`).
   - Black-box score generation is treated as a critical system defect.

3. **Mandatory 'Insufficient Evidence' Safe State:**
   - If evidence coverage for a role or task falls below the confidence threshold (Coverage < 60%), the system must flag `status: INSUFFICIENT_EVIDENCE` rather than fabricating plausible values or hallucinating extrapolations.

4. **Right to Appeal & Correction Workflow:**
   - Employees and department leads have a built-in UI mechanism to flag, contest, or submit corrective evidence against any task classification or skill requirement.
   - Contested items enter an audit queue with human-in-the-loop (HITL) resolution.
