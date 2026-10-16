# Antigravity Skill Usage and Governance Record

Audit Session: 2026-10-16
Platform Lead: Principal Systems Architect & Google Cloud Release Lead

---

## 1. Active & Utilized Skills Matrix

| Skill Identifier | Source Path | Applicable Phases | Governance Constraints & Justification |
|---|---|---|---|
| **futurasculpt-architecture-audit** | `.agents/skills/futurasculpt-architecture-audit/SKILL.md` | Phase 0, 1, 3, 10 | Zero business math inside API routers; strict WorkGraph C4 layer boundary enforcement. |
| **futurasculpt-security-audit** | `.agents/skills/futurasculpt-security-audit/SKILL.md` | Phase 0, 2, 7, 10 | SAIF controls, zero-leak credential isolation, Bandit AST inspection, Model Armor boundaries. |
| **futurasculpt-evidence-audit** | `.agents/skills/futurasculpt-evidence-audit/SKILL.md` | Phase 4, 6, 10 | EvidenceEnvelope verification, tamper-evident SHA-256 lineage, source span verification, abstention contract. |
| **futurasculpt-finops-audit** | `.agents/skills/futurasculpt-finops-audit/SKILL.md` | Phase 5, 8 | Vertex context cache hit rate, token budget caps ($2.00 session cap), BigQuery byte bounds (1GB limit). |
| **futurasculpt-accessibility-audit** | `.agents/skills/futurasculpt-accessibility-audit/SKILL.md` | Phase 9, 10 | WCAG 2.1 AA keyboard navigation, ARIA semantics, color contrast in ambient co-pilot. |
| **futurasculpt-agent-eval** | `.agents/skills/futurasculpt-agent-eval/SKILL.md` | Phase 4, 5, 10 | ADK agent trajectory validation, tool-calling policy gates, proposal-dependent evaluation. |
| **google-cloud-auth-verification** | `~/.gemini/config/skills/google-cloud-auth-verification/SKILL.md` | Phase 1, 2, 5 | Step 0 verification of Application Default Credentials, project ID binding, and service account isolation. |
| **firebase-basics** | `~/.gemini/config/skills/firebase-basics/SKILL.md` | Phase 1, 2, 3 | Hosting rewrites, CLI deploy standards (`npx -y firebase-tools@latest`), and project binding. |
| **ponytail** | `~/.gemini/config/plugins/ponytail/skills/ponytail/SKILL.md` | Phase 1 - 11 | Minimal surgical edits, deletion over addition, high-signal architecture, no unrequested boilerplate. |

---

## 2. Policy Enforcement Notes

- **Zero Invention Rule:** Only verified, repository-local and system-configured skills are activated.
- **Audit Verification:** Skills are re-verified during post-implementation release gates (Phase 10).
- **No Production Leaks:** Zero credentials, bearer tokens, or PII are passed into skill prompt trajectories or logs.
