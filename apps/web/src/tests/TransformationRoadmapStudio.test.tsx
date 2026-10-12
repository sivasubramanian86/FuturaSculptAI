import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransformationRoadmapStudio } from '../components/TransformationRoadmapStudio';
import { getTranslations } from '../i18n';

describe('TransformationRoadmapStudio Component', () => {
  const i18n = getTranslations('en');

  it('renders input controls and switches between text and url input modes', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    expect(screen.getByRole('heading', { name: /Future Work Transformation Simulator/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Traditional Work Description/i)).toBeInTheDocument();

    // Switch to URL mode
    const urlModeBtn = screen.getByRole('button', { name: /Enter Company Website URL/i });
    fireEvent.click(urlModeBtn);

    expect(screen.getByLabelText(/Company Website URL/i)).toBeInTheDocument();

    // Switch back to text mode
    const textModeBtn = screen.getByRole('button', { name: /Paste Traditional Work Notes/i });
    fireEvent.click(textModeBtn);

    expect(screen.getByLabelText(/Traditional Work Description/i)).toBeInTheDocument();
  });

  it('selects preset business and triggers generation', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    // Select Automotive preset
    const autoPreset = screen.getByRole('button', { name: /Auto Repair & Precision Workshop/i });
    fireEvent.click(autoPreset);

    const generateBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(generateBtn);

    // Check generated results
    expect(screen.getAllByText(/Precision Automotive & Engineering Services/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Transformation Narrative & Strategic Horizons/i)).toBeInTheDocument();
    expect(screen.getByText(/Year 1 \(Digital Relief\)/i)).toBeInTheDocument();
  });

  it('switches between different horizons and interacts with copy and voice buttons', () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: mockSpeak, cancel: mockCancel },
      writable: true,
    });
    class MockUtterance {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockUtterance;
    (globalThis as any).SpeechSynthesisUtterance = MockUtterance;

    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    // Generate roadmap
    const generateBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(generateBtn);

    // Switch to Year 3 horizon
    const year3Tab = screen.getByRole('button', { name: /3 Years: Intelligent Synergy/i });
    fireEvent.click(year3Tab);
    expect(screen.getByText(/Year 3 \(Intelligent Synergy\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1.85x Revenue/i)).toBeInTheDocument();

    // Switch to Year 10 horizon
    const year10Tab = screen.getByRole('button', { name: /10 Years: Cognitive Leader/i });
    fireEvent.click(year10Tab);
    expect(screen.getByText(/Year 10 \(Cognitive Leadership\)/i)).toBeInTheDocument();
    expect(screen.getByText(/5.8x Valuation/i)).toBeInTheDocument();

    // Switch to Baseline
    const baselineTab = screen.getByRole('button', { name: /Now: Traditional Baseline/i });
    fireEvent.click(baselineTab);
    expect(screen.getByText(/Now \(Traditional Style\)/i)).toBeInTheDocument();

    // Voice Speak button
    const speakBtn = screen.getByRole('button', { name: /Listen to Narrative/i });
    fireEvent.click(speakBtn);
    expect(mockSpeak).toHaveBeenCalled();

    // Toggle voice to stop
    fireEvent.click(screen.getByRole('button', { name: /Stop Voice/i }));
    expect(mockCancel).toHaveBeenCalled();

    // Copy brief button
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
    const copyBtn = screen.getByRole('button', { name: /Copy Brief/i });
    fireEvent.click(copyBtn);
    expect(screen.getByText(/Copied Brief/i)).toBeInTheDocument();
  });
});
