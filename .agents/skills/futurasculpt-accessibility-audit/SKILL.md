---
name: futurasculpt-accessibility-audit
description: Audits the enterprise React cockpit for WCAG 2.1 AA accessibility, keyboard navigation, color contrast, and ARIA semantics.
---

# FuturaSculptAI Accessibility Audit Skill

## Purpose
Enforces WCAG 2.1 AA accessibility, screen-reader semantics, and responsive design across all cockpit views (WorkGraph, Futures, Task Sculptor, TrustBoard, Investor Lens).

## Triggers
- When new frontend views or visual components are built or refactored.
- End-of-phase frontend verification.

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
Accessibility scorecard showing 0 violations, verified ARIA labels, and keyboard operability.
