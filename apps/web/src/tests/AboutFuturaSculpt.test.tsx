import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutFuturaSculpt } from '../components/AboutFuturaSculpt';
import { getTranslations } from '../i18n';

describe('AboutFuturaSculpt Component', () => {
  const i18n = getTranslations('en');

  it('renders hackathon track title, problem statement, and 9-agent matrix', () => {
    render(<AboutFuturaSculpt i18n={i18n} />);

    expect(screen.getAllByText(/GOOGLE CLOUD APAC AI BUILDER CUP 2026/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 2, name: /About FuturaSculptAI/i })).toBeInTheDocument();
    expect(screen.getByText(/4.4T Productivity Paradox/i)).toBeInTheDocument();

    // Check agent table entries
    expect(screen.getByText(/Task Decomposer/i)).toBeInTheDocument();
    expect(screen.getByText(/Adversarial Critic/i)).toBeInTheDocument();
    expect(screen.getByText(/FinOps Evaluator/i)).toBeInTheDocument();

    // Check industry capsules
    expect(screen.getByText(/Apex Food Line 4/i)).toBeInTheDocument();
    expect(screen.getByText(/ICU Clinical Handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Level-2 AML Alert Triage/i)).toBeInTheDocument();

    // Check links
    expect(screen.getByRole('link', { name: /GitHub Repository ↗/i })).toHaveAttribute(
      'href',
      'https://github.com/sivasubramanian86/FuturaSculptAI'
    );
  });
});
