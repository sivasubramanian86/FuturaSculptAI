---
name: futurasculpt-accessibility-audit
description: Audits the enterprise React cockpit for WCAG 2.1 AA accessibility, keyboard navigation, color contrast, and ARIA semantics.
version: "1.0.0"
author: "FuturaSculptAI Platform Engineering"
allowed_tools:
  - run_accessibility_linter
  - audit_axe_cockpit_view
  - verify_focus_trap_contract
---

# FuturaSculptAI Accessibility Audit Skill

## Purpose
Enforces WCAG 2.1 AA accessibility, screen-reader semantics, focus trapping, and responsive design across all cockpit views (WorkGraph, Futures, Task Sculptor, TrustBoard, Investor Lens).

## Tool Declarations & Input Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class AccessibilityAuditInput(BaseModel):
    """Input contract for cockpit accessibility verification."""
    view_name: str = Field(..., min_length=2, description="Target view identifier (e.g. WorkGraphCockpit, TrustBoard).")
    wcag_standard: str = Field(default="WCAG_2_1_AA", description="Target WCAG standard compliance level.")
    idempotency_key: str = Field(..., min_length=16, description="Cryptographic idempotency key to prevent duplicate audit execution.")

class AccessibilityAuditOutput(BaseModel):
    """Output scorecard for accessibility verification."""
    view_name: str
    violations_count: int = Field(default=0, ge=0)
    contrast_pass_rate_pct: float = Field(default=100.0, ge=0.0, le=100.0)
    keyboard_navigable: bool = True
    aria_compliance_passed: bool = True
    findings: List[str] = Field(default_factory=list)
```

## Deterministic Credential Isolation (Zero-Trust to Model)
- **Model as Untrusted Parameter Compiler:** The model generates audit directives and view targets; it never receives, inspects, or returns auth credentials, cookies, or session tokens.
- **Gateway Layer Auth:** All authenticated testing runners inject bearer tokens strictly at the test execution sandbox layer via local environment variables.

## Execution Sandboxing & Idempotency
- **Idempotency Guarantee:** Every execution must provide an `idempotency_key` (e.g. `sha256(view_name + commit_sha)`). Duplicate invocations return cached deterministic scorecards.
- **Rollback / Compensating Action:** If an accessibility check mutates component mocks or test DOM trees, the cleanup teardown restores initial state without leaking side-effects.

## Audit Procedure
1. **Automated Axe-Core Audits:**
   - Execute Vitest component test suites integrating `axe-core`.
   - Assert `expect(container).toHaveNoViolations()` across all rendered cockpit components.
2. **Keyboard Navigation & Focus Management:**
   - Verify that all interactive modal dialogs, drawers, and graph nodes are reachable and operable via keyboard (`Tab`, `Enter`, `Escape`).
   - Verify focus traps inside modals and drawers.
3. **Color Contrast & Dark-Mode Compliance:**
   - Verify minimum contrast ratio (4.5:1 for normal text, 3:1 for large text and UI controls) against dark-mode surfaces.
4. **Zero-Bypass Policy:**
   - Strict ban on `/* v8 ignore */` or disabling accessibility test matchers.

## Verification Script (TypeScript / Vitest)
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { WorkGraphCockpit } from './WorkGraphCockpit';

expect.extend(toHaveNoViolations);

test('WorkGraphCockpit should have zero accessibility violations', async () => {
  const { container } = render(<WorkGraphCockpit />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Expected Output
Accessibility scorecard showing 0 violations, verified ARIA labels, and full keyboard operability.
