import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuraHologramAssistant } from '../../components/AuraHologramAssistant';
import { api } from '../../services/api';

describe('AuraHologramAssistant Component', () => {
  let mockUtteranceInstance: any = null;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();

    // Mock SpeechSynthesis
    const mockSpeechSynthesis = {
      speak: vi.fn((utterance) => {
        mockUtteranceInstance = utterance;
        if (utterance.onstart) utterance.onstart();
        if (utterance.onend) utterance.onend();
      }),
      cancel: vi.fn(),
    };
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
    });

    class MockUtterance {
      lang = '';
      rate = 1;
      pitch = 1;
      text = '';
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockUtterance;
    (globalThis as any).SpeechSynthesisUtterance = MockUtterance;

    // Mock HTML5 Canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    });

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => setTimeout(cb, 16));
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('renders floating beacon trigger and opens modal with welcome greeting', async () => {
    const onNav = vi.fn();
    const onSelectSector = vi.fn();

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={onNav}
        onSelectSector={onSelectSector}
      />
    );

    const triggerBtn = screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i);
    expect(triggerBtn).toBeInTheDocument();

    // Click trigger to open modal
    fireEvent.click(triggerBtn);

    expect(screen.getByText(/Aura — 3D Virtual Live Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello! I am Aura/i)).toBeInTheDocument();
  });

  it('handles user text input, blank sends, and generates smart persona responses', async () => {
    const onNav = vi.fn();
    const onSelectSector = vi.fn();

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={onNav}
        onSelectSector={onSelectSector}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    const input = screen.getByPlaceholderText(/Ask Aura anything/i);
    const sendBtn = screen.getByRole('button', { name: /Send/i });

    // Test blank input does nothing
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendBtn);

    // Ask 5-year-old question
    fireEvent.change(input, { target: { value: 'Explain to a 5 year old kid' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/For a 5-year-old: Think of AI like a friendly robot helper/i)).toBeInTheDocument();
    });

    // Ask 60+ senior question via Enter key
    fireEvent.change(input, { target: { value: 'What about 60+ seniors who cannot read tech?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/For seniors & non-tech workers: You do NOT need any computer degree/i)).toBeInTheDocument();
    });

    // Ask freelancer question
    fireEvent.change(input, { target: { value: 'How does it help a freelancer?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/For Freelancers: We guarantee transparent rate floors/i)).toBeInTheDocument();
    });

    // Ask industrialist question
    fireEvent.change(input, { target: { value: 'What is the ROI for a business owner?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/For Business Owners & Industrialists: FuturaSculptAI delivers a 6.25x net ROI multiple/i)).toBeInTheDocument();
    });

    // Ask general question (default response)
    fireEvent.change(input, { target: { value: 'Tell me general information' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/FuturaSculptAI Workforce Sanctuary: We transform work ethically/i)).toBeInTheDocument();
    });

    // Ask 1y, 3y, 5y, 10y roadmap question
    fireEvent.change(input, { target: { value: 'What is the 1y, 3y, 5y, 10y future work transformation roadmap?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/1Y, 3Y, 5Y & 10Y Transformation Roadmap/i)).toBeInTheDocument();
    });

    // Test jump to Task Sculptor button inside message
    const jumpTaskSculptorBtns = screen.getAllByRole('button', { name: /🧬 Task Sculptor/i });
    expect(jumpTaskSculptorBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpTaskSculptorBtns[0]);
    expect(onNav).toHaveBeenCalledWith('task_sculptor');

    // Reopen modal and test jump to sector focus button inside message
    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));
    const jumpSectorBtns = screen.getAllByRole('button', { name: /Sector Focus/i });
    expect(jumpSectorBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpSectorBtns[0]);
    expect(onNav).toHaveBeenCalledWith('task_sculptor');
    expect(onSelectSector).toHaveBeenCalledWith('logistics');

    // Reopen modal and test jump to SAIF
    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));
    const jumpSaifBtns = screen.getAllByRole('button', { name: /SAIF Posture/i });
    expect(jumpSaifBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpSaifBtns[0]);
    expect(onNav).toHaveBeenCalledWith('governance');

    // Reopen modal and test synth speak error catch
    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));
    (window.speechSynthesis.speak as any).mockImplementationOnce(() => {
      throw new Error('synth error');
    });
    fireEvent.change(screen.getByPlaceholderText(/Ask Aura anything/i), { target: { value: 'Test synth error catch' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    // Test close button
    const closeBtn = screen.getByLabelText(/Close Aura Assistant/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Aura — 3D Virtual Live Assistant/i)).not.toBeInTheDocument();
  });

  it('triggers quick prompt pills for UPI QR, Uber drivers, and Cinema industry', async () => {
    render(
      <AuraHologramAssistant
        currentLanguage="ta"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    // Click UPI QR pill
    const upiPill = screen.getByRole('button', { name: /💳 UPI & QR Payment Safety/i });
    fireEvent.click(upiPill);

    await waitFor(() => {
      expect(screen.getByText(/For UPI & QR Payments: FuturaSculptAI sculpts retail cashiers into Digital Trust Sentinels/i)).toBeInTheDocument();
    });

    // Click Uber/Ola driver pill
    const uberPill = screen.getByRole('button', { name: /🚖 Uber \/ Ola Driver Future/i });
    fireEvent.click(uberPill);

    await waitFor(() => {
      expect(screen.getByText(/For Uber & Ola Drivers: When autonomous robotaxis arrive/i)).toBeInTheDocument();
    });

    // Click Movie/Cinema pill
    const moviePill = screen.getByRole('button', { name: /🎬 Movie & Cinema Industry/i });
    fireEvent.click(moviePill);

    await waitFor(() => {
      expect(screen.getByText(/For Cinema & Movie Industry: Camera crew, dubbing artists/i)).toBeInTheDocument();
    });
  });

  it('handles speech recognition events, unsupported alerts, and backdrop clicks', async () => {
    let capturedRecognition: any = null;
    const mockStart = vi.fn();
    const mockStop = vi.fn();

    const MockSpeechRecognition = vi.fn().mockImplementation(() => {
      capturedRecognition = {
        start: mockStart,
        stop: mockStop,
        continuous: false,
        interimResults: true,
        lang: 'en-US',
        onresult: null,
        onerror: null,
        onend: null,
      };
      return capturedRecognition;
    });
    (window as any).SpeechRecognition = MockSpeechRecognition;

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    // Start listening
    const startMicBtn = screen.getByLabelText(/Start speaking with microphone/i);
    fireEvent.click(startMicBtn);
    expect(mockStart).toHaveBeenCalled();

    // Verify button transitioned to Stop recording voice
    const stopMicBtn = await screen.findByLabelText(/Stop recording voice/i);
    expect(stopMicBtn).toBeInTheDocument();

    // Click stop listening
    fireEvent.click(stopMicBtn);
    expect(mockStop).toHaveBeenCalled();

    // Simulate recognition onresult, onerror, and onend
    expect(capturedRecognition).not.toBeNull();
    capturedRecognition.onresult({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: 'Hello Aura' }], { isFinal: true }),
      ],
    });
    capturedRecognition.onerror();
    capturedRecognition.onend();

    // Test speech synthesis error event
    if (mockUtteranceInstance && mockUtteranceInstance.onerror) {
      mockUtteranceInstance.onerror();
    }

    // Test speaking state visualization (covers isSpeaking branch)
    (window.speechSynthesis.speak as any).mockImplementationOnce((utterance: any) => {
      mockUtteranceInstance = utterance;
      if (utterance.onstart) utterance.onstart();
    });
    const testInput = screen.getByPlaceholderText(/Ask Aura anything/i);
    fireEvent.change(testInput, { target: { value: 'Activate speaking node' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));
    if (mockUtteranceInstance && mockUtteranceInstance.onend) {
      mockUtteranceInstance.onend();
    }

    // Test microphone start exception catch
    mockStart.mockImplementationOnce(() => {
      throw new Error('mic start failure');
    });
    fireEvent.click(screen.getByLabelText(/Start speaking with microphone/i));

    // Test backdrop overlay click to close
    const overlay = screen.getByText(/Aura Quantum Holo-Node/i).closest('.modal-overlay');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    expect(screen.queryByText(/Aura — 3D Virtual Live Assistant/i)).not.toBeInTheDocument();
  });

  it('shows browser alert when SpeechRecognition is unsupported', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    const micBtn = screen.getByLabelText(/Start speaking with microphone/i);
    fireEvent.click(micBtn);

    expect(alertSpy).toHaveBeenCalledWith('Speech Recognition is not supported by your current browser.');
  });

  it('falls back to en-US for unsupported language in SpeechRecognition and SpeechSynthesis', () => {
    let capturedRecognition: any = null;
    const MockSpeechRecognition = vi.fn().mockImplementation(() => {
      capturedRecognition = {
        start: vi.fn(),
        stop: vi.fn(),
        continuous: false,
        interimResults: true,
        lang: '',
      };
      return capturedRecognition;
    });
    (window as any).SpeechRecognition = MockSpeechRecognition;

    render(
      <AuraHologramAssistant
        currentLanguage={'unsupported_lang' as any}
        onNavigateTab={vi.fn()}
      />
    );

    expect(capturedRecognition.lang).toBe('en-US');

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));
    expect(mockUtteranceInstance.lang).toBe('en-US');
  });

  it('handles null canvas 2d context and null speech synthesis gracefully', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    Object.defineProperty(window, 'speechSynthesis', {
      value: null,
      writable: true,
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    // Send text when speechSynthesis is null (covers if (!synthRef.current) return)
    const input = screen.getByPlaceholderText(/Ask Aura anything/i);
    fireEvent.change(input, { target: { value: 'Test without speech synthesis' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    expect(screen.getByText(/Test without speech synthesis/i)).toBeInTheDocument();
  });

  it('switches between gemini-3.8-live and gemini-3.8-live-extended-thinking and configures reasoning budget', () => {
    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    // Initially general-purpose live model is selected
    expect(screen.getByRole('button', { name: /⚡ models\/gemini-3.8-live/i })).toBeInTheDocument();
    const extendedThinkingBtn = screen.getByRole('button', { name: /🧠 models\/gemini-3.8-live-extended-thinking/i });
    expect(extendedThinkingBtn).toBeInTheDocument();

    // Reasoning budget selector not visible until extended thinking selected
    expect(screen.queryByText(/Reasoning Budget:/i)).not.toBeInTheDocument();

    // Select extended thinking
    fireEvent.click(extendedThinkingBtn);
    expect(screen.getByText(/Reasoning Budget:/i)).toBeInTheDocument();

    // Click 4096 tokens budget
    const budget4096 = screen.getByRole('button', { name: /4096 tokens/i });
    expect(budget4096).toBeInTheDocument();
    fireEvent.click(budget4096);
  });

  it('invokes api.geminiLiveDialogue and renders reasoning trace and model badge', async () => {
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValueOnce({
      response_text: 'Live dialogue synthesis from Gemini 3.8 Live Extended Thinking.',
      model_used: 'models/gemini-3.8-live-extended-thinking',
      voice_persona: 'kore',
      reasoning_trace: 'Step 1: Analyzed workforce safety criteria.\nStep 2: Formulated wage protection response.',
      latency_ms: 124.5,
      input_tokens: 35,
      output_tokens: 42,
      estimated_cost_usd: 0.00018,
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i));

    // Switch to extended thinking model
    fireEvent.click(screen.getByRole('button', { name: /🧠 models\/gemini-3.8-live-extended-thinking/i }));

    const input = screen.getByPlaceholderText(/Ask Aura anything/i);
    fireEvent.change(input, { target: { value: 'How does Gemini Live safeguard workers?' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'How does Gemini Live safeguard workers?',
          model: 'models/gemini-3.8-live-extended-thinking',
          voice_persona: 'kore',
          reasoning_budget: 2048,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Live dialogue synthesis from Gemini 3.8 Live Extended Thinking./i)).toBeInTheDocument();
      expect(screen.getByText(/Cognitive Reasoning Trace \(Extended Thinking\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 1: Analyzed workforce safety criteria/i)).toBeInTheDocument();
    });

    liveDialogueSpy.mockRestore();
  });
});

