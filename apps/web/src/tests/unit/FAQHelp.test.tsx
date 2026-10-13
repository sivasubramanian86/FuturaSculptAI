import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FAQHelp } from '../../components/FAQHelp';
import { getTranslations } from '../../i18n';

describe('FAQHelp Component', () => {
  const i18n = getTranslations('en');

  it('renders FAQ header and questions list', () => {
    render(<FAQHelp i18n={i18n} />);
    expect(screen.getByRole('heading', { name: /Frequently Asked Questions & Citizen Help/i })).toBeInTheDocument();
    expect(screen.getByText(/Will FuturaSculptAI replace my job or recommend layoffs/i)).toBeInTheDocument();
  });

  it('filters questions by keyword search', () => {
    render(<FAQHelp i18n={i18n} />);
    const searchInput = screen.getByPlaceholderText(/Search questions by keyword/i);

    fireEvent.change(searchInput, { target: { value: 'appeal' } });
    expect(screen.getByText(/How do I appeal an automated task redesign/i)).toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByRole('button', { name: '✕' });
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue('');
  });

  it('filters questions by category pill and toggles accordion', () => {
    render(<FAQHelp i18n={i18n} />);

    // Click Category filters
    fireEvent.click(screen.getByRole('button', { name: /Worker Rights & Security/i }));
    expect(screen.getByText(/Will FuturaSculptAI replace my job/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Privacy & Ethical AI/i }));
    expect(screen.getByText(/How does FuturaSculptAI protect my personal workplace privacy/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Google Cloud & AI Agents/i }));
    expect(screen.getByText(/Which Google Cloud technologies power/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Platform Guide/i }));
    expect(screen.getByText(/How do I switch between Citizen\/Worker View and Enterprise View/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /All Topics/i }));
    expect(screen.getByText(/Will FuturaSculptAI replace my job/i)).toBeInTheDocument();

    // Toggle open/close accordion
    const questionBtn = screen.getByRole('button', { name: /Will FuturaSculptAI replace my job/i });
    fireEvent.click(questionBtn); // close
    fireEvent.click(questionBtn); // reopen
    expect(screen.getByText(/By non-negotiable architectural policy/i)).toBeInTheDocument();
  });

  it('shows empty message when search yields no matches', () => {
    render(<FAQHelp i18n={i18n} />);
    const searchInput = screen.getByPlaceholderText(/Search questions by keyword/i);

    fireEvent.change(searchInput, { target: { value: 'zzzz_nonexistent_query' } });
    expect(screen.getByText(/No questions matched your search/i)).toBeInTheDocument();
  });
});

