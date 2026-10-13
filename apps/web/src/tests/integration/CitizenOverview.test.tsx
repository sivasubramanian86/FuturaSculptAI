import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CitizenOverview } from '../../components/CitizenOverview';
import { getTranslations } from '../../i18n';

describe('CitizenOverview Component', () => {
  const i18n = getTranslations('en');

  it('renders hero title, metrics, and worker protection pillars', () => {
    const onNav = vi.fn();
    render(<CitizenOverview i18n={i18n} onNavigateTab={onNav} trustScore={95.1} taskCount={20} resilienceScore={82.0} />);

    expect(screen.getByRole('heading', { level: 1, name: /Work Transformation Built for People/i })).toBeInTheDocument();
    expect(screen.getByText('95.1')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();

    expect(screen.getByText(/Zero Layoff Protection/i)).toBeInTheDocument();
    expect(screen.getByText(/Differential Privacy Shield/i)).toBeInTheDocument();
    expect(screen.getByText(/Guaranteed Right to Appeal/i)).toBeInTheDocument();
  });

  it('triggers navigation callbacks from hero and module cards', () => {
    const onNav = vi.fn();
    render(<CitizenOverview i18n={i18n} onNavigateTab={onNav} />);

    fireEvent.click(screen.getByRole('button', { name: /Try Task Sculptor/i }));
    expect(onNav).toHaveBeenCalledWith('task_sculptor');

    fireEvent.click(screen.getByRole('button', { name: /Explore Career Pathways/i }));
    expect(onNav).toHaveBeenCalledWith('opportunity');

    fireEvent.click(screen.getByRole('button', { name: /Launch MultiModal Studio/i }));
    expect(onNav).toHaveBeenCalledWith('multimodal');

    fireEvent.click(screen.getByText(i18n.quickActionSculptDesc));
    expect(onNav).toHaveBeenCalledWith('task_sculptor');

    fireEvent.click(screen.getByText(i18n.quickActionOpportunityDesc));
    expect(onNav).toHaveBeenCalledWith('opportunity');

    fireEvent.click(screen.getByText(i18n.quickActionMediaDesc));
    expect(onNav).toHaveBeenCalledWith('multimodal');

    fireEvent.click(screen.getByText(i18n.quickActionSwarmDesc));
    expect(onNav).toHaveBeenCalledWith('agent_swarm');
  });

  it('triggers onOpenTour callback when One-Click Guided Tour button is clicked', () => {
    const onOpenTour = vi.fn();
    render(<CitizenOverview i18n={i18n} onNavigateTab={vi.fn()} onOpenTour={onOpenTour} />);

    const tourBtn = screen.getByRole('button', { name: /One-Click Guided Tour/i });
    expect(tourBtn).toBeInTheDocument();
    fireEvent.click(tourBtn);
    expect(onOpenTour).toHaveBeenCalledTimes(1);
  });

  it('toggles Simple Voice & Visual Mode and triggers audio speak readout', () => {
    let capturedUtterance: any = null;
    const mockSpeak = vi.fn((utterance) => {
      capturedUtterance = utterance;
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: mockSpeak, cancel: vi.fn() },
      writable: true,
    });
    class MockUtterance {
      text: string;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockUtterance;
    (globalThis as any).SpeechSynthesisUtterance = MockUtterance;

    render(<CitizenOverview i18n={i18n} onNavigateTab={vi.fn()} />);

    const toggleBtn = screen.getByRole('button', { name: /Switch to Simple Voice & Visual Mode/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Simple Mode — No Tech Jargon/i)).toBeInTheDocument();
    expect(screen.getByText(/Am I Safe\?/i)).toBeInTheDocument();

    const listenBtns = screen.getAllByRole('button', { name: /Listen in Your Language/i });
    expect(listenBtns.length).toBeGreaterThan(0);
    fireEvent.click(listenBtns[0]);
    expect(mockSpeak).toHaveBeenCalled();

    // Trigger onend to clear spokenAudioText
    expect(capturedUtterance).not.toBeNull();
    if (capturedUtterance?.onend) {
      capturedUtterance.onend();
    }

    // Branch where UtteranceClass is absent
    delete (window as any).SpeechSynthesisUtterance;
    delete (globalThis as any).SpeechSynthesisUtterance;
    fireEvent.click(listenBtns[0]);
  });
});

