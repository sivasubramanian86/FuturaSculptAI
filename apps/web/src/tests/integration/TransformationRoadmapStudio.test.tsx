import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TransformationRoadmapStudio } from '../../components/TransformationRoadmapStudio';
import { api } from '../../services/api';
import { getTranslations } from '../../i18n';

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

  it('simulates company roadmap for Khan Academy and Zerodha', () => {
    const { rerender } = render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    const compModeBtn = screen.getByRole('button', { name: /Company \/ Global Institution Name/i });
    fireEvent.click(compModeBtn);

    const input = screen.getByLabelText(/Target Enterprise or Institution Name/i);
    fireEvent.change(input, { target: { value: 'Khan Academy' } });

    const generateBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(generateBtn);

    expect(screen.getAllByText(/Khan Academy/i).length).toBeGreaterThanOrEqual(1);

    rerender(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    fireEvent.change(input, { target: { value: 'Zerodha' } });
    fireEvent.click(generateBtn);

    expect(screen.getAllByText(/Zerodha/i).length).toBeGreaterThanOrEqual(1);
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

    // Switch back to Strategic 1Y - 10Y Timeline sub-tab
    const roadmapTab = screen.getByRole('button', { name: /Strategic 1Y - 10Y Timeline/i });
    fireEvent.click(roadmapTab);
    expect(screen.getByText(/Transformation Narrative & Strategic Horizons/i)).toBeInTheDocument();

    // Tab 2: Lyria Podcast
    const podcastTab = screen.getByRole('button', { name: /Lyria Future Podcast/i });
    fireEvent.click(podcastTab);
    expect(screen.getByText(/Lyria Podcast: Echoes of 2036/i)).toBeInTheDocument();

    // Speed buttons
    fireEvent.click(screen.getByRole('button', { name: '1.25x' }));
    fireEvent.click(screen.getByRole('button', { name: '1.5x' }));

    // Play podcast
    let capturedPodcastUtterance: any = null;
    mockSpeak.mockImplementation((u) => { capturedPodcastUtterance = u; });
    const playPodcastBtn = screen.getByRole('button', { name: /Play Future Podcast/i });
    fireEvent.click(playPodcastBtn);
    expect(mockSpeak).toHaveBeenCalled();
    if (capturedPodcastUtterance?.onend) capturedPodcastUtterance.onend();
    if (capturedPodcastUtterance?.onerror) capturedPodcastUtterance.onerror();

    // Pause podcast
    const pausePodcastBtn = screen.getByRole('button', { name: /Pause Future Podcast/i });
    fireEvent.click(pausePodcastBtn);
    expect(mockCancel).toHaveBeenCalled();

    // Tab 3: Veo Short Video Walkthrough
    const videoTab = screen.getByRole('button', { name: /Veo Short Video Walkthrough/i });
    fireEvent.click(videoTab);
    expect(screen.getByText(/Veo Video Walkthrough: Day in the Life \(2036\)/i)).toBeInTheDocument();
    expect(screen.getByText(/AERIAL CAMPUS VIEW/i)).toBeInTheDocument();

    // Toggle video play / pause and test timer tick
    vi.useFakeTimers();
    const playVideoBtn = screen.getByText('▶');
    fireEvent.click(playVideoBtn);
    expect(screen.getByText('⏸')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Change video scrubber to 45 and tick to test loop reset
    const scrubber = screen.getByRole('slider');
    fireEvent.change(scrubber, { target: { value: '45' } });
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    fireEvent.click(screen.getByText('⏸'));
    vi.useRealTimers();

    // Switch camera angles
    fireEvent.click(screen.getByRole('button', { name: 'HUD' }));
    expect(screen.getByText(/FIRST-PERSON HUD COGNITIVE WORKSPACE/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /SYNERGY/i }));
    expect(screen.getByText(/COLLABORATIVE MULTI-AGENT SYNERGY POD/i)).toBeInTheDocument();

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
    let capturedVoiceUtterance: any = null;
    mockSpeak.mockImplementation((u) => { capturedVoiceUtterance = u; });
    const speakBtn = screen.getByRole('button', { name: /Listen to Narrative/i });
    fireEvent.click(speakBtn);
    expect(mockSpeak).toHaveBeenCalled();
    if (capturedVoiceUtterance?.onend) capturedVoiceUtterance.onend();
    if (capturedVoiceUtterance?.onerror) capturedVoiceUtterance.onerror();

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

  it('simulates transportation fleet roadmap from preset', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    const taxiPreset = screen.getByRole('button', { name: /Taxi & Regional Transport Fleet/i });
    fireEvent.click(taxiPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Mobility & Autonomous Fleet Logistics/i).length).toBeGreaterThanOrEqual(1);
  });

  it('simulates cinema production roadmap from preset', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    const cinemaPreset = screen.getByRole('button', { name: /Independent Film & Creative Production/i });
    fireEvent.click(cinemaPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Creative Film & Digital Media Production/i).length).toBeGreaterThanOrEqual(1);
  });

  it('simulates bakery roadmap from preset', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    const bakeryPreset = screen.getByRole('button', { name: /Family Bakery & Packaged Foods/i });
    fireEvent.click(bakeryPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Food Processing & Artisan Bakery/i).length).toBeGreaterThanOrEqual(1);
  });

  it('simulates public health clinic roadmap from preset', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    const clinicPreset = screen.getByRole('button', { name: /District General Hospital & Clinic/i });
    fireEvent.click(clinicPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/District General Hospital & Rural Health Network/i).length).toBeGreaterThanOrEqual(1);
  });

  it('simulates retail supermarket and website URL roadmaps', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    const textInput = screen.getByLabelText(/Traditional Work Description/i);
    fireEvent.change(textInput, { target: { value: 'We run a neighborhood retail grocery supermarket shop with inventory' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Modernized Retail & Omni-Channel Commerce/i).length).toBeGreaterThanOrEqual(1);

    const urlModeBtn = screen.getByRole('button', { name: /Enter Company Website URL/i });
    fireEvent.click(urlModeBtn);
    const urlInput = screen.getByLabelText(/Company Website URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://example-bakery.com/about' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Food Processing & Artisan Bakery/i).length).toBeGreaterThanOrEqual(1);
  });

  it('handles non-zero simulation delay with setTimeout and loading state', () => {
    vi.useFakeTimers();
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={200} />);

    const generateBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(generateBtn);

    expect(screen.getByText(/Synthesizing Multi-Agent Evidence & 100x Model\.\.\./i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText(/Transformation Narrative & Strategic Horizons/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('simulates Microsoft, Anthropic and African Community School roadmaps from presets', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    const msPreset = screen.getByRole('button', { name: /Microsoft/i });
    fireEvent.click(msPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Microsoft Corporation/i).length).toBeGreaterThanOrEqual(1);

    const anthropicPreset = screen.getByRole('button', { name: /Anthropic/i });
    fireEvent.click(anthropicPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Anthropic PBC/i).length).toBeGreaterThanOrEqual(1);

    const africaPreset = screen.getByRole('button', { name: /Community School \(Sub-Saharan Africa\)/i });
    fireEvent.click(africaPreset);
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Community Primary & Vocational Network \(Sub-Saharan Africa\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('handles target enterprise name input onChange in company mode', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /Company \/ Global Institution Name/i }));
    const input = screen.getByLabelText(/Target Enterprise or Institution Name/i);
    fireEvent.change(input, { target: { value: 'Global Agro Logistics' } });
    expect((input as HTMLInputElement).value).toBe('Global Agro Logistics');
  });

  it('filters presets by sector tabs and auto-selects entity when sector prop is passed', () => {
    const { rerender } = render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} sector="healthcare" />);
    // Verify healthcare preset is active
    expect(screen.getByRole('button', { name: /Mayo Clinic/i })).toBeInTheDocument();

    // Switch sector filter chip to IT
    fireEvent.click(screen.getByRole('button', { name: /IT Tech Titans/i }));
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();

    // Switch sector filter chip to All Sectors
    fireEvent.click(screen.getByRole('button', { name: /All Sectors/i }));
    expect(screen.getByRole('button', { name: /Tesla Gigafactory/i })).toBeInTheDocument();

    // Rerender with it_technology sector prop
    rerender(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} sector="it_technology" />);
    expect(screen.getByRole('button', { name: /Microsoft/i })).toBeInTheDocument();
  });

  it('simulates Waymo autonomous fleet and Pixar animation studios roadmaps', () => {
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    // Test Waymo
    fireEvent.click(screen.getByRole('button', { name: /Company \/ Global Institution Name/i }));
    const input = screen.getByLabelText(/Target Enterprise or Institution Name/i);
    fireEvent.change(input, { target: { value: 'Waymo' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Waymo Autonomous Ridehail Fleet/i).length).toBeGreaterThanOrEqual(1);

    // Test Pixar
    fireEvent.change(input, { target: { value: 'Pixar' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Pixar Animation Studios/i).length).toBeGreaterThanOrEqual(1);

    // Test UPI NPCI
    fireEvent.change(input, { target: { value: 'UPI NPCI Network' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/NPCI & UPI High-Concurrency Network/i).length).toBeGreaterThanOrEqual(1);

    // Test Stripe Payments
    fireEvent.change(input, { target: { value: 'Stripe Payments' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Stripe Global Payment Processing/i).length).toBeGreaterThanOrEqual(1);

    // Test Nestlé
    fireEvent.change(input, { target: { value: 'Nestlé Food Processing' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Nestlé Agri-Supply & Packaged Foods/i).length).toBeGreaterThanOrEqual(1);

    // Test JPMorgan Chase
    fireEvent.change(input, { target: { value: 'JPMorgan Chase & Co' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/JPMorgan Chase & Global Clearing/i).length).toBeGreaterThanOrEqual(1);

    // Test Tesla
    fireEvent.change(input, { target: { value: 'Tesla Gigafactory' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Tesla Gigafactory & Precision EV Assembly/i).length).toBeGreaterThanOrEqual(1);

    // Test Toyota
    fireEvent.change(input, { target: { value: 'Toyota Motor Manufacturing' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Toyota Motor Manufacturing/i).length).toBeGreaterThanOrEqual(1);

    // Test Mayo Clinic
    fireEvent.change(input, { target: { value: 'Mayo Clinic' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Mayo Clinic \(Rochester, USA\)/i).length).toBeGreaterThanOrEqual(1);

    // Test Apollo Hospitals
    fireEvent.change(input, { target: { value: 'Apollo Hospitals' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Apollo Hospitals Enterprise \(Global Network\)/i).length).toBeGreaterThanOrEqual(1);

    // Test NHS Foundation Trust
    fireEvent.change(input, { target: { value: 'NHS Foundation Trust' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/NHS Foundation Trust \(UK\)/i).length).toBeGreaterThanOrEqual(1);

    // Test Johns Hopkins
    fireEvent.change(input, { target: { value: 'Johns Hopkins Medicine' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Johns Hopkins Medicine \(USA\)/i).length).toBeGreaterThanOrEqual(1);

    // Test AIIMS
    fireEvent.change(input, { target: { value: 'AIIMS New Delhi' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/AIIMS New Delhi \(Apex Public Hospital\)/i).length).toBeGreaterThanOrEqual(1);

    // Test Meta
    fireEvent.change(input, { target: { value: 'Meta Platforms' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Meta Platforms & FAIR AI/i).length).toBeGreaterThanOrEqual(1);

    // Test TCS & Infosys
    fireEvent.change(input, { target: { value: 'TCS & Infosys' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/TCS & Infosys Enterprise Solutions/i).length).toBeGreaterThanOrEqual(1);

    // Test OpenAI
    fireEvent.change(input, { target: { value: 'OpenAI Research' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/OpenAI Research & Deployment/i).length).toBeGreaterThanOrEqual(1);

    // Test Retail
    fireEvent.change(input, { target: { value: 'Modernized Retail' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i }));
    expect(screen.getAllByText(/Modernized Retail & Omni-Channel Commerce/i).length).toBeGreaterThanOrEqual(1);
  });

  it('augments roadmap with live API response when generateTransformationRoadmap succeeds', async () => {
    const mockRoadmap = {
      firm_title: 'Mayo Clinic Live API',
      category: 'public_health',
      executive_summary: 'Live Vertex AI executive summary.',
      societal_impact_narrative: 'Live planetary impact narrative.',
      productivity_verdict: {
        headline: '100x Live',
        multiplierSummary: 'Live 100x',
        civilizationalReach: 'Global reach',
      },
      horizons: {
        baseline: {
          year: '2026',
          badge: 'BASELINE',
          headline: 'Live Baseline',
          workStyle: 'Human Only',
          workerExperience: 'Paperwork',
          productivityMultiplier: '1.0x',
          productivityIndex: 1,
          firmMetrics: {
            revenueMultiple: '1.0x',
            netMargin: '10%',
            creativeTimePct: 20,
            wageIncrease: '0%',
            turnaround: '3 days',
          },
          keyMilestones: ['Live milestone 1'],
        },
        year1: {
          year: 'Year 1',
          badge: 'AGENT TRIAGE',
          headline: 'Live Year 1',
          workStyle: 'Augmented',
          workerExperience: 'Copilot',
          productivityMultiplier: '2.5x',
          productivityIndex: 2.5,
          firmMetrics: {
            revenueMultiple: '1.3x',
            netMargin: '18%',
            creativeTimePct: 40,
            wageIncrease: '+10%',
            turnaround: '1 day',
          },
          keyMilestones: ['Live milestone Y1'],
        },
      },
      evidence_citations: [
        {
          id: 'CIT-LIVE-001',
          source: 'Live Vertex Source',
          sha256Hash: 'abc',
          groundedQuote: 'Live Quote',
          agentAuthor: 'Scout Agent',
        },
      ],
    };

    vi.spyOn(api, 'generateTransformationRoadmap').mockResolvedValueOnce(mockRoadmap);

    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    const mayoPreset = screen.getByRole('button', { name: /Mayo Clinic/i });
    fireEvent.click(mayoPreset);

    const genBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mayo Clinic Live API/i)).toBeInTheDocument();
    });
  });

  it('handles live API response with empty evidence citations and handles API rejection gracefully', async () => {
    const mockRoadmapWithProfile: any = {
      firm_title: 'Apollo Hospitals Healthcare',
      category: 'public_health',
      executive_summary: 'EHR and tele-triage transformation',
      societal_impact_narrative: 'Expanded clinical access across Tier-2 cities',
      productivity_verdict: '4.2x clinical turnaround multiple',
      horizons: {},
      evidence_citations: ['NABH Clinical Guidelines 2026'],
      company_profile: {
        name: 'Apollo Hospitals Enterprise',
        ticker_or_symbol: 'APOLLOHOSP.NS',
        employee_count: '70,000 clinicians and staff',
        annual_revenue: '₹19,000 Cr',
        net_profit_or_margin: '9.8% net margin',
        core_business: 'Multi-specialty tertiary care and digital pharmacy',
        competitive_moat: 'Apollo 24/7 digital clinical graph',
        automation_baseline: 'Automated bed allocation and clinical lab telemetry',
        primary_sources: ['Apollo FY25 Annual Report'],
      },
      futuristic_readiness: {
        ai_agentic_maturity: 18.2,
        digital_telemetry_iot: 18.0,
        workforce_adaptability: 17.5,
        process_orchestration: 18.4,
        data_moat_governance: 17.9,
        total_score: 90.0,
        grade: 'A+ Frontier Pioneer',
        key_strengths: ['Apollo 24/7 tele-triage engine'],
        modernization_gaps: ['Legacy rural PACS integrations'],
      },
    };

    const mockRoadmapNoCitations: any = {
      firm_title: '',
      category: '',
      executive_summary: '',
      societal_impact_narrative: '',
      productivity_verdict: null,
      horizons: {},
      evidence_citations: [],
    };

    const spy = vi.spyOn(api, 'generateTransformationRoadmap')
      .mockResolvedValueOnce(mockRoadmapWithProfile)
      .mockResolvedValueOnce(mockRoadmapNoCitations)
      .mockRejectedValueOnce(new Error('Vertex AI quota exceeded'));

    const { rerender } = render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);

    // First invocation with empty citations and empty firm_title
    const apolloPreset = screen.getByRole('button', { name: /Apollo Hospitals/i });
    fireEvent.click(apolloPreset);

    const genBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Apollo Hospitals/i).length).toBeGreaterThanOrEqual(1);
    });

    // Second invocation with API failure
    rerender(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={0} />);
    const nhsPreset = screen.getByRole('button', { name: /NHS Foundation Trust/i });
    fireEvent.click(nhsPreset);
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/NHS Foundation Trust/i).length).toBeGreaterThanOrEqual(2);
    });

    spy.mockRestore();
  });

  it('exercises agent swarm stepper HUD with simulation delay and timer advancement', async () => {
    vi.useFakeTimers();
    render(<TransformationRoadmapStudio i18n={i18n} simulationDelayMs={200} />);
    const genBtn = screen.getByRole('button', { name: /Generate 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(genBtn);

    expect(screen.getByTestId('gemini-agent-swarm-hud')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText(/STEP [2-5] OF 5/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    vi.useRealTimers();
  });
});


