# FuturaSculptAI: Domain Glossary

This glossary standardizes terms across the multi-agent system, API contracts, UI cockpit, and documentation.

### Core Concepts

- **Work Transformation Graph (WTG):** A temporal directed acyclic multi-graph representation of an enterprise operating model. Nodes represent Outcomes, Capabilities, Workflows, Tasks, Roles, Skills, Systems, Data, Agents, Controls, and Technologies. Edges define dependencies, allocations, and impacts with temporal validity (`valid_from`, `valid_to`), confidence scores, and provenance.
- **Evidence Ledger:** Immutable register of ingested enterprise and market evidence. Every claim asserted by an agent must cite one or more `evidence_id` entries with cryptographic hashes and temporal timestamps.
- **EvidenceEnvelope:** Standardized multimodal data structure containing normalized text/segments, original URI, MIME type, language, access control lists (ACL), sensitivity classification, and cryptographic content hash.
- **Closed Control Loop:** The 8-stage operational feedback cycle: `Sense -> Model -> Simulate -> Sculpt -> Govern -> Execute -> Measure -> Learn`.

### Autonomy & Risk Tiers

- **A0 (Observe):** Read-only operations. Ingesting, parsing, linking entities, running graph queries, computing deterministic metrics. Fully autonomous.
- **A1 (Recommend):** Analytical proposals. Generating scenarios, role adjustments, skill pathways, and architecture drafts. Requires agent critic verification before presentation.
- **A2 (Prepare):** Drafting executable artifacts. Compiling ADK agent blueprints, Jira backlogs, and Terraform templates. Autonomous preparation; human approval required before publishing.
- **A3 (Execute Reversible):** Low-risk environment changes. Creating sandbox GCP projects, isolated Cloud Run draft deployments, or synthetic test databases. Requires explicit human approval, strict budget caps, and an automated rollback hook.
- **A4 (Consequential):** High-stakes actions. Modifying production systems, impacting live compensation/employment, or transferring enterprise funds. **Prohibited in MVP**.

### Scenario Types

- **Conservative Scenario:** Optimization of existing operating models using low-risk assistive copilots, retrieval-augmented search, and minimal organizational restructuring.
- **Accelerated Scenario:** Deep workflow redesign incorporating autonomous multi-agent pipelines, straight-through processing, and substantial task reconfiguration.
- **Disruptive Scenario:** Step-function transformation driven by emergent frontier technologies (e.g., physical cobotics, spatial computing, edge AI) that alter fundamental business models.
- **Human-First Scenario:** Maximizing employee augmentation, resilience, job quality, and internal mobility subject to passing positive financial unit economics.

### Workforce Metrics

- **Role Resilience Index (RRI):** Deterministic score (0-100) reflecting a role's ability to maintain high strategic value through task augmentation and adjacent skills adaptability.
- **Transition Readiness Score (TRS):** Score (0-100) measuring an individual or cohort's proximity to target emerging roles based on transferable core competencies.
- **Workforce Adaptability Index (WAI):** Aggregate enterprise readiness score evaluating organizational agility, learning velocity, and technological absorption capacity.
- **Human Opportunity Score (HOS):** Ratio of net new value creation, creative tasks, and upward career trajectory unlocked versus displaced repetitive labor.
- **Agent Augmentation Potential (AAP):** Proportion of routine cognitive or data-processing tasks within a role that can be reliably delegated to autonomous agents under A0-A2 tiers.

### Technical & Governance Frameworks

- **Google ADK (Agent Development Kit):** Framework for building multi-agent systems with explicit hierarchy, coordinator patterns, and trajectory evaluation.
- **SAIF (Secure AI Framework):** Google framework for securing AI systems across data protection, threat modeling, access control, and model security.
- **Model Armor:** Google Cloud security layer filtering prompt injection, sensitive data leakage, and toxic content across inputs and outputs.
- **Sensitive Data Protection (Cloud DLP):** Google Cloud service for discovering, classifying, and de-identifying sensitive data (PII, PHI, financial).
- **Outcome Ledger:** Immutable record of baseline state, target forecast, realized outcome, owner, date, and variance for every deployed transformation.
