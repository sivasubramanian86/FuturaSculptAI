---
name: futurasculpt-architecture-audit
description: Audits FuturaSculptAI against C4 diagrams, temporal WorkGraph schemas, and layer separation boundaries.
version: "1.0.0"
author: "FuturaSculptAI Platform Engineering"
allowed_tools:
  - scan_layer_boundaries
  - verify_workgraph_schema_conformance
  - validate_orchestrator_coordination
---

# FuturaSculptAI Architecture Audit Skill

## Purpose
Ensures that all backend services, agent specialists, and frontend components adhere to the Work Transformation Operating System architecture without architectural drift or layer pollution.

## Tool Declarations & Input Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class ArchitectureAuditInput(BaseModel):
    """Input parameters for architectural compliance audit."""
    target_path: str = Field(default="apps/api/", description="Root path of target subproject.")
    enforce_zero_router_logic: bool = Field(default=True, description="Enforce zero domain math inside API routers.")
    idempotency_key: str = Field(..., min_length=16, description="Unique audit session idempotency token.")

class ArchitectureAuditOutput(BaseModel):
    """Output scorecard for architectural compliance."""
    layer_violations_count: int = Field(default=0, ge=0)
    schema_drift_detected: bool = False
    unauthorized_agent_bypasses: int = Field(default=0, ge=0)
    architecture_gate_passed: bool
    violations: List[str] = Field(default_factory=list)
```

## Deterministic Credential Isolation (Zero-Trust to Model)
- **Zero-Trust Model:** The architecture auditor inspects static ASTs and schema files; it never accesses production credentials, API secrets, or active databases.
- **Execution Broker Layer:** All scanning runs locally without sending code tokens to external unapproved endpoints.

## Execution Sandboxing & Idempotency
- **Idempotency Guarantee:** Scans are idempotent and produce deterministic AST reports for the same git tree hash.
- **Compensating Action / Saga Readiness:** The auditor operates strictly read-only against the filesystem, creating zero side-effects.

## Audit Procedure
1. **Layer Boundary Check:**
   - Verify that API routes (`apps/api/app/routers/`) contain ZERO business calculations or formula processing. All logic must be delegated to domain services or the ADK orchestrator.
2. **Schema & Contract Conformance:**
   - Verify that all WorkGraph node and edge mutations conform strictly to `docs/architecture/workgraph-schema.md`.
   - Verify temporal fields (`valid_from`, `valid_to`, `is_current`) are present on all state mutations.
3. **Multi-Agent Coordination Protocol:**
   - Verify that specialist agents do not bypass the `EngagementOrchestrator` coordinator.
   - Verify that all agent tool calls specify typed JSON schemas and risk tiers (A0-A3).

## Verification Script (PowerShell)
```powershell
# Check for direct calculation logic inside routers
Get-ChildItem -Path "apps/api/app/routers" -Filter "*.py" -Recurse | Select-String -Pattern "def calculate_|def compute_"
```

## Expected Output
A structured audit report identifying:
- Layer violations (if any) with line numbers.
- Schema non-conformance.
- Pass/Fail determination for the architecture gate.
