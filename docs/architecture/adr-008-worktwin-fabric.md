# ADR-008: Futura WorkTwin Fabric Architecture

## Status
ACCEPTED (2026-10-16)

## Context & Problem Statement
Organizations evaluating AI transformation need to model and test operating-model changes, agentic delegations, and skill transitions before disrupting real workers. However, creating unrestricted "AI clones" of employees introduces identity replication attack surfaces, violation of EU AI Act (prohibitions on workplace emotion recognition and high-risk employment decisions), and trust erosion.

## Architectural Decision
FuturaSculptAI implements the **Futura WorkTwin Fabric**:
- **RoleTwin (Default):** Synthetic role archetypes (intern, developer, doctor, plant manager, CTO, CEO) based on approved process and task data. No real human identity is modeled.
- **PersonalWorkTwin (Opt-in Demo Feature Flag):** Consenting employee's approved knowledge and personal work context, strictly bound to assisting the employee owner. Never creates an employer-controlled impersonator.
- **OrganizationTwin:** Aggregated organizational graph of teams, workflows, agents, costs, and control layers used for macro simulation.

### Autonomy Hierarchy (WT0 - WT5)
- **WT0 (Observe):** Read & organize approved documentation.
- **WT1 (Assist):** Draft recommendations & training plans.
- **WT2 (Simulate):** Multi-agent simulation arena representation (Boardroom, Sandbox).
- **WT3 (Prepare):** Draft tickets/architecture changes with mandatory human review.
- **WT4 (Execute):** Perform reversible, low-risk sandbox tasks after human sign-off.
- **WT5 (Consequential):** Employment decisions (Hiring/Firing/Pay/Discipline) — **STRICTLY PROHIBITED**.

### Governance Boundaries (EU AI Act & OECD)
1. Zero Emotion / Behavioral Inference.
2. Zero Autonomous Adverse Employment Decisions.
3. Explicit Twin Manifest with granular capability boundaries.
4. Cryptographic provenance on all retrieved evidence.
