---
name: futurasculpt-architecture-audit
description: Audits FuturaSculptAI against C4 diagrams, temporal WorkGraph schemas, and layer separation boundaries.
---

# FuturaSculptAI Architecture Audit Skill

## Purpose
Ensures that all backend services, agent specialists, and frontend components adhere to the Work Transformation Operating System architecture without architectural drift or layer pollution.

## Triggers
- End of Phase checkpoints.
- Before committing any major architectural module or new agent specialist.

## Audit Procedure
1. **Layer Boundary Check:**
   - Verify that API routes (`apps/api/routers/`) contain ZERO business calculations or formula processing. All logic must be delegated to domain services or the ADK orchestrator.
2. **Schema & Contract Conformance:**
   - Verify that all WorkGraph node and edge mutations conform strictly to `docs/architecture/workgraph-schema.md`.
   - Verify temporal fields (`valid_from`, `valid_to`, `is_current`) are present on all state mutations.
3. **Multi-Agent Coordination Protocol:**
   - Verify that specialist agents do not bypass the `EngagementOrchestrator` coordinator.
   - Verify that all agent tool calls specify typed JSON schemas and risk tiers (A0-A3).

## Verification Script (PowerShell)
```powershell
# Check for direct calculation logic inside routers
Get-ChildItem -Path "apps/api/routers" -Filter "*.py" -Recurse | Select-String -Pattern "def calculate_|def compute_"
```

## Expected Output
A structured audit report identifying:
- Layer violations (if any) with line numbers.
- Schema non-conformance.
- Pass/Fail determination for the architecture gate.
