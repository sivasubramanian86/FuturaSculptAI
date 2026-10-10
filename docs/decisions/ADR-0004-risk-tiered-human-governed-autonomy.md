# ADR-0004: Risk-Tiered Human-Governed Autonomy (A0-A4 Framework)

## Status
Accepted

## Context
Deploying autonomous AI agents into enterprise workflows introduces severe risks of unintended infrastructure mutation, financial loss, and ethical harm (e.g. unlawful workforce profiling or unauthorized terminations). Total autonomy is unacceptable to enterprise buyers, while complete manual intervention destroys agentic productivity.

## Decision
Adopt a strict 5-tier risk and autonomy model:
- **A0 (Observe):** Fully autonomous read-only operations.
- **A1 (Recommend):** Analytical recommendations verified by an Adversarial Critic Agent.
- **A2 (Prepare):** Draft blueprints and backlogs created autonomously; human approval required to publish.
- **A3 (Execute Reversible):** Low-risk environment changes require explicit human approval, short-lived scoped credentials, budget caps, and automated rollback hooks.
- **A4 (Consequential):** Autonomous employment, production, or financial changes are **strictly prohibited** in the system architecture.

## Trade-offs & Alternatives Considered
| Option | Pros | Cons | Operational Overhead |
|---|---|---|---|
| A0-A4 Tiered Autonomy (Selected) | Clear enterprise trust boundary, compliance with Google SAIF and EU AI Act, actionable automation without catastrophic risk. | Requires approval UI flows and rollback mechanisms for A3. | Low. |
| Full Unrestricted Autonomy | Faster demo generation. | Vulnerable to prompt injection, uncontrolled cloud spend, and catastrophic data loss. | Unacceptable. |
| Read-Only Copilot (A0/A1 only) | Safe. | Lacks the ability to prepare or execute actual transformation solutions. | Fails product vision. |

## Consequences
- **Positive:** Enterprise buyers and CISOs approve adoption; clear audit trail of human accountability.
- **Negative:** Reversible mutations in A3 require structured rollback implementations.
