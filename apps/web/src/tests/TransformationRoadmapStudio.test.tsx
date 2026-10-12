import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransformationRoadmapStudio } from '../components/TransformationRoadmapStudio';
import { getTranslations } from '../i18n';

describe('TransformationRoadmapStudio Component', () => {
  const i18n = getTranslations('en');

  it('renders input controls and switches between text, company, and url input modes', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    expect(screen.getByRole('heading', { name: /Future Work Transformation Simulator/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Traditional Work Description/i)).toBeInTheDocument();

    // Switch to Company mode
    const compModeBtn = screen.getByRole('button', { name: /Company \/ Global Institution Name/i });
    fireEvent.click(compModeBtn);
    expect(screen.getByLabelText(/Target Enterprise or Institution Name/i)).toBeInTheDocument();

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

  it('simulates company roadmap for Google or Anthropic with 100x productivity multiplier', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    const compModeBtn = screen.getByRole('button', { name: /Company \/ Global Institution Name/i });
    fireEvent.click(compModeBtn);

    const input = screen.getByLabelText(/Target Enterprise or Institution Name/i);
    fireEvent.change(input, { target: { value: 'Google' } });

    const generateBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(generateBtn);

    expect(screen.getAllByText(/Google \(Alphabet Inc\.\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/100x Civilizational & Enterprise Multiplier/i).length).toBeGreaterThanOrEqual(1);
  });

  it('simulates global public good roadmap for Government School in India or Africa', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    const schoolPreset = screen.getByRole('button', { name: /Government Rural School \(India\)/i });
    fireEvent.click(schoolPreset);

    const generateBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(generateBtn);

    expect(screen.getAllByText(/Government School System \(India\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2.5x Student Reach/i)).toBeInTheDocument();
  });

  it('navigates across multimodal studio tabs: Infographics, Lyria Podcast, Veo Video, Evidence, and Society', () => {
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

    // Tab 1: Imagen Infographic
    const infoTab = screen.getByRole('button', { name: /Imagen Visual Infographic Twin/i });
    fireEvent.click(infoTab);
    expect(screen.getByText(/Imagen Architecture Twin: 2036 Workspace Blueprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Zone 1: Human Sanctuary/i)).toBeInTheDocument();

    // Tab 2: Lyria Podcast
    const podcastTab = screen.getByRole('button', { name: /Lyria Future Podcast/i });
    fireEvent.click(podcastTab);
    expect(screen.getByText(/Lyria Podcast: Echoes of 2036/i)).toBeInTheDocument();

    // Play podcast
    const playPodcastBtn = screen.getByRole('button', { name: /Play Future Podcast/i });
    fireEvent.click(playPodcastBtn);
    expect(mockSpeak).toHaveBeenCalled();

    // Pause podcast
    const pausePodcastBtn = screen.getByRole('button', { name: /Pause Future Podcast/i });
    fireEvent.click(pausePodcastBtn);
    expect(mockCancel).toHaveBeenCalled();

    // Tab 3: Veo Short Video Walkthrough
    const videoTab = screen.getByRole('button', { name: /Veo Short Video Walkthrough/i });
    fireEvent.click(videoTab);
    expect(screen.getByText(/Veo Video Walkthrough: Day in the Life \(2036\)/i)).toBeInTheDocument();
    expect(screen.getByText(/AERIAL CAMPUS VIEW/i)).toBeInTheDocument();

    // Switch camera angle
    fireEvent.click(screen.getByRole('button', { name: 'HUD' }));
    expect(screen.getByText(/FIRST-PERSON HUD COGNITIVE WORKSPACE/i)).toBeInTheDocument();

    // Tab 4: Multi-Agentic RAG Evidence
    const evidenceTab = screen.getByRole('button', { name: /Multi-Agentic RAG Evidence/i });
    fireEvent.click(evidenceTab);
    expect(screen.getByText(/Multi-Agentic RAG Verified Evidence Dossier/i)).toBeInTheDocument();
    expect(screen.getByText(/Future Signals Scout Agent/i)).toBeInTheDocument();

    // Tab 5: Societal Flywheel
    const societyTab = screen.getByRole('button', { name: /Societal & Civilizational Lift/i });
    fireEvent.click(societyTab);
    expect(screen.getByText(/Societal & Civilizational Flywheel: Global Multiplier/i)).toBeInTheDocument();
    expect(screen.getByText(/Universal Education/i)).toBeInTheDocument();
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

    // Switch to Year 2 horizon
    const year2Tab = screen.getByRole('button', { name: /2 Years: Copilot Frontline/i });
    fireEvent.click(year2Tab);
    expect(screen.getByText(/Year 2 \(Copilot Frontline\)/i)).toBeInTheDocument();

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
