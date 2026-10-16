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
      getVoices: vi.fn().mockReturnValue([
        { name: 'Google UK English Female', lang: 'en-GB' },
      ]),
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

    class MockAudio {
      src = '';
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play = vi.fn().mockResolvedValue(undefined);
      pause = vi.fn();
      constructor(src: string) {
        this.src = src;
      }
    }
    (window as any).Audio = MockAudio;
    (globalThis as any).Audio = MockAudio;

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

    const triggerBtn = screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i);
    expect(triggerBtn).toBeInTheDocument();

    // Click trigger to open modal
    fireEvent.click(triggerBtn);

    expect(screen.getByText(/(?:Aura|Futura) — 3D Virtual Live Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello! I am (?:Aura|Futura)/i)).toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    const input = screen.getByPlaceholderText(/Ask (?:Aura|Futura) anything/i);
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

    // Ask Agentic RAG / Company Intelligence question
    fireEvent.change(input, { target: { value: 'Explain agentic rag company headcount and profit' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Agentic RAG & MCP Company Intelligence Grounding/i)).toBeInTheDocument();
    });

    // Test jump to Task Sculptor button inside message
    const jumpTaskSculptorBtns = screen.getAllByRole('button', { name: /🧬 Task Sculptor/i });
    expect(jumpTaskSculptorBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpTaskSculptorBtns[0]);
    expect(onNav).toHaveBeenCalledWith('task_sculptor');

    // Reopen modal and test jump to sector focus button inside message
    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));
    const jumpSectorBtns = screen.getAllByRole('button', { name: /Sector Focus/i });
    expect(jumpSectorBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpSectorBtns[0]);
    expect(onNav).toHaveBeenCalledWith('task_sculptor');
    expect(onSelectSector).toHaveBeenCalledWith('logistics');

    // Reopen modal and test jump to SAIF
    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));
    const jumpSaifBtns = screen.getAllByRole('button', { name: /SAIF Posture/i });
    expect(jumpSaifBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpSaifBtns[0]);
    expect(onNav).toHaveBeenCalledWith('governance');

    // Reopen modal and test synth speak error catch
    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));
    (window.speechSynthesis.speak as any).mockImplementationOnce(() => {
      throw new Error('synth error');
    });
    fireEvent.change(screen.getByPlaceholderText(/Ask (?:Aura|Futura) anything/i), { target: { value: 'Test synth error catch' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    // Test close button
    const closeBtn = screen.getByLabelText(/Close (?:Aura|Futura) Assistant/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/(?:Aura|Futura) — 3D Virtual Live Assistant/i)).not.toBeInTheDocument();
  });

  it('triggers quick prompt pills for UPI QR, Uber drivers, and Cinema industry', async () => {
    render(
      <AuraHologramAssistant
        currentLanguage="ta"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

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

    // Click 5yo pill
    const kidPill = screen.getByRole('button', { name: /👶 5-Year-Old Explanation/i });
    fireEvent.click(kidPill);
    await waitFor(() => {
      expect(screen.getByText(/friendly robot helper, like WALL-E or Baymax/i)).toBeInTheDocument();
    });

    // Click Senior pill
    const seniorPill = screen.getByRole('button', { name: /🧓 60\+ Senior \/ Non-Tech/i });
    fireEvent.click(seniorPill);
    await waitFor(() => {
      expect(screen.getByText(/For seniors & non-tech workers: You do NOT need any computer degree/i)).toBeInTheDocument();
    });

    // Click Industrialist pill
    const indPill = screen.getByRole('button', { name: /🏭 Industrialist & ROI Value/i });
    fireEvent.click(indPill);
    await waitFor(() => {
      expect(screen.getByText(/For Business Owners & Industrialists: FuturaSculptAI delivers a 6.25x net ROI multiple/i)).toBeInTheDocument();
    });

    // Click Agentic RAG pill
    const ragPill = screen.getByRole('button', { name: /🏢 Agentic RAG Corporate Intel/i });
    fireEvent.click(ragPill);
    await waitFor(() => {
      expect(screen.getByText(/Agentic RAG & MCP Company Intelligence Grounding/i)).toBeInTheDocument();
    });

    // Click Roadmap pill
    const roadmapPill = screen.getByRole('button', { name: /🔮 1Y, 3Y, 5Y & 10Y Roadmap/i });
    fireEvent.click(roadmapPill);
    await waitFor(() => {
      expect(screen.getByText(/1Y, 3Y, 5Y & 10Y Transformation Roadmap/i)).toBeInTheDocument();
    });

    // Click WorkTwin Fabric quick prompt pill
    const twinPromptPill = screen.getByRole('button', { name: /👥 WorkTwin Fabric Tour/i });
    fireEvent.click(twinPromptPill);

    // Test Jump to WorkTwin Fabric button inside message
    const jumpWorkTwinBtns = screen.getAllByRole('button', { name: /👥 WorkTwin Fabric/i });
    expect(jumpWorkTwinBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpWorkTwinBtns[0]);
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

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

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
    const testInput = screen.getByPlaceholderText(/Ask (?:Aura|Futura) anything/i);
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
    const overlay = screen.getByText(/(?:Aura|Futura) Quantum Holo-Node/i).closest('.modal-overlay');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    expect(screen.queryByText(/(?:Aura|Futura) — 3D Virtual Live Assistant/i)).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    const micBtn = screen.getByLabelText(/Start speaking with microphone/i);
    fireEvent.click(micBtn);

    expect(alertSpy).toHaveBeenCalledWith('Speech Recognition is not supported by your current browser.');
  });

  it('falls back to en-US for unsupported language in SpeechRecognition', () => {
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

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    // Send text when speechSynthesis is null (covers if (!synthRef.current) return)
    const input = screen.getByPlaceholderText(/Ask (?:Aura|Futura) anything/i);
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

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

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
      audio_base64: 'UklGRgAAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=',
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

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    // Switch to extended thinking model
    fireEvent.click(screen.getByRole('button', { name: /🧠 models\/gemini-3.8-live-extended-thinking/i }));

    const input = screen.getByPlaceholderText(/Ask (?:Aura|Futura) anything/i);
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

  it('handles voice persona switching between Kore and Aoede with audio playback and fallback', async () => {
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValue({
      response_text: 'Switched persona',
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'aoede',
      audio_base64: 'UklGRgAAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=',
      latency_ms: 80,
      input_tokens: 10,
      output_tokens: 20,
      estimated_cost_usd: 0.00001,
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    // Click Aoede (warm melodic)
    const aoedeBtn = screen.getByRole('button', { name: /Aoede \(Warm\)/i });
    fireEvent.click(aoedeBtn);

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          voice_persona: 'aoede',
        })
      );
    });

    // Test rejection fallback for Kore
    liveDialogueSpy.mockRejectedValueOnce(new Error('Network offline'));
    const koreBtn = screen.getByRole('button', { name: /Kore \(Crisp\)/i });
    fireEvent.click(koreBtn);

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          voice_persona: 'kore',
        })
      );
    });

    // Test resolution without audio_base64
    liveDialogueSpy.mockResolvedValueOnce({
      response_text: 'Voice changed',
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'kore',
      audio_base64: '',
      latency_ms: 70,
      input_tokens: 10,
      output_tokens: 15,
      estimated_cost_usd: 0.00001,
    });
    fireEvent.click(koreBtn);

    // Test Aoede resolution without audio_base64
    liveDialogueSpy.mockResolvedValueOnce({
      response_text: 'Aoede voice changed',
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'aoede',
      audio_base64: '',
      latency_ms: 70,
      input_tokens: 10,
      output_tokens: 15,
      estimated_cost_usd: 0.00001,
    });
    fireEvent.click(aoedeBtn);

    liveDialogueSpy.mockRestore();
  });

  it('triggers Gemini Flash Native Audio dialogue on launch and updates welcome message', async () => {
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValueOnce({
      response_text: 'Welcome to FuturaSculptAI! I am Futura, your 3D Holographic AI Workforce Sanctuary Assistant.',
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'kore',
      audio_base64: 'UklGRgAAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=',
      latency_ms: 95.0,
      input_tokens: 28,
      output_tokens: 32,
      estimated_cost_usd: 0.0001,
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context_topic: 'welcome',
          model: 'models/gemini-3.8-live',
          voice_persona: 'kore',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Welcome to FuturaSculptAI! I am Futura/i)).toBeInTheDocument();
    });

    liveDialogueSpy.mockRestore();
  });

  it('executes interactive spoken guided tour across all 8 modules and synchronizes tabs', async () => {
    const onNav = vi.fn();
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockImplementation(async (req) => ({
      response_text: `Live commentary for ${req.context_topic || req.message}`,
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'kore',
      audio_base64: 'UklGRgAAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=',
      latency_ms: 110.0,
      input_tokens: 30,
      output_tokens: 35,
      estimated_cost_usd: 0.00012,
    }));

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={onNav}
      />
    );

    fireEvent.click(screen.getByLabelText(/Launch (?:Aura|Futura) 3D Virtual Live Assistant/i));

    // Start tour from the guided tour banner button
    const startTourBtn = screen.getAllByRole('button', { name: /Start Spoken Guided Tour/i })[0];
    expect(startTourBtn).toBeInTheDocument();
    fireEvent.click(startTourBtn);

    // Verify Stage 1 is active (overview tab)
    await waitFor(() => {
      expect(onNav).toHaveBeenCalledWith('overview');
      expect(screen.getByText(/STEP 1 OF 8/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Executive Cockpit & Citizen Overview/i).length).toBeGreaterThan(0);
    });

    // Advance to Stage 2 (worktwins tab)
    const nextBtn = screen.getByRole('button', { name: /Next Step ⏩/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(onNav).toHaveBeenCalledWith('worktwins');
      expect(screen.getByText(/STEP 2 OF 8/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Futura WorkTwin Fabric/i).length).toBeGreaterThan(0);
    });

    // Test Previous button navigates back to Stage 1 (overview tab)
    const prevBtn = screen.getByRole('button', { name: /⏪ Prev/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(onNav).toHaveBeenCalledWith('overview');
      expect(screen.getByText(/STEP 1 OF 8/i)).toBeInTheDocument();
    });

    // Test Replay voice button on current step
    const replayBtn = screen.getByRole('button', { name: /🔊 Replay Voice/i });
    fireEvent.click(replayBtn);

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalled();
    });

    // Advance through stages 2 to 8
    const tabSequence = ['worktwins', 'task_sculptor', 'opportunity', 'workgraph', 'multimodal', 'agent_swarm', 'governance'];
    for (let i = 0; i < tabSequence.length; i++) {
      const stepNextBtn = screen.getByRole('button', { name: i === tabSequence.length - 1 ? /Finish Tour 🏁|Next Step ⏩/i : /Next Step ⏩/i });
      fireEvent.click(stepNextBtn);
      await waitFor(() => {
        expect(onNav).toHaveBeenCalledWith(tabSequence[i]);
      });
    }

    // On Stage 8, click Finish Tour
    const finishTourBtn = screen.getByRole('button', { name: /Finish Tour 🏁/i });
    fireEvent.click(finishTourBtn);

    await waitFor(() => {
      expect(screen.getByText(/You have completed the FuturaSculptAI Spoken Guided Tour/i)).toBeInTheDocument();
    });

    // Test Exit Tour functionality
    const startTourAgain = screen.getAllByRole('button', { name: /Start Spoken Guided Tour/i })[0];
    fireEvent.click(startTourAgain);
    await waitFor(() => {
      expect(screen.getByText(/STEP 1 OF 8/i)).toBeInTheDocument();
    });
    const exitTourBtn = screen.getByRole('button', { name: /✕ Exit/i });
    fireEvent.click(exitTourBtn);

    await waitFor(() => {
      expect(screen.queryByText(/STEP 1 OF 8/i)).not.toBeInTheDocument();
    });

    liveDialogueSpy.mockRestore();
  });

  it('renders ambient smart pill when modal is closed, explains screen on demand, and dismisses on click', async () => {
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValue({
      response_text: 'Live explanation of the WorkTwin Fabric.',
      audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      model_used: 'gemini-2.5-flash',
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
        activeTab="worktwins"
      />
    );

    // Verify ambient pill is visible when modal is closed
    const ambientPill = document.getElementById('futura-ambient-pill');
    expect(ambientPill).toBeInTheDocument();
    expect(screen.getByText(/WorkTwin Fabric & Boardroom/i)).toBeInTheDocument();

    // Click Explain Screen on ambient pill
    const explainBtn = screen.getByRole('button', { name: /Explain Screen Ambient/i });
    fireEvent.click(explainBtn);

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalled();
    });

    // Test dismiss button
    const dismissBtn = screen.getByRole('button', { name: /Dismiss ambient pill/i });
    fireEvent.click(dismissBtn);

    expect(ambientPill).toHaveStyle({ display: 'none' });

    liveDialogueSpy.mockRestore();
  });

  it('renders in-view context banner inside modal and triggers live screen explanation', async () => {
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValue({
      response_text: 'Live explanation for Task Sculptor screen.',
      audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      model_used: 'gemini-2.5-flash',
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
        activeTab="task_sculptor"
      />
    );

    // Open modal via beacon orb
    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Verify modal context banner is present
    const contextBanner = document.getElementById('futura-modal-context-banner');
    expect(contextBanner).toBeInTheDocument();
    expect(screen.getByText(/CURRENT SCREEN: TASK SCULPTOR & 6-PART TAXONOMY/i)).toBeInTheDocument();

    // Trigger modal explain screen live
    const modalExplainBtn = screen.getByRole('button', { name: /Explain Screen Live/i });
    fireEvent.click(modalExplainBtn);

    await waitFor(() => {
      expect(liveDialogueSpy).toHaveBeenCalled();
    });

    liveDialogueSpy.mockRestore();
  });

  it('exercises voice selection algorithm across natural, OS female, and persona pitches', async () => {
    const customVoices = [
      { name: 'Microsoft Jenny Online (Natural) - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'David Male', lang: 'en-US' },
    ];
    (window.speechSynthesis.getVoices as any).mockReturnValue(customVoices);

    const { unmount } = render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Click Aoede persona button
    const aoedeBtn = screen.getByRole('button', { name: /Aoede/i });
    fireEvent.click(aoedeBtn);

    // Click Kore persona button
    const koreBtn = screen.getByRole('button', { name: /Kore/i });
    fireEvent.click(koreBtn);

    unmount();
  });

  it('navigates tour steps forward, backward, exits tour, and exercises fallback on API failure', async () => {
    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockRejectedValue(new Error('Audio network timeout'));

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Launch guided tour
    const tourBtn = screen.getAllByRole('button', { name: /Start Spoken Guided Tour/i })[0];
    fireEvent.click(tourBtn);

    await waitFor(() => {
      expect(screen.getByText(/STEP 1 OF 8/i)).toBeInTheDocument();
    });

    // Next step
    const nextBtn = screen.getByRole('button', { name: /Next Step ⏩/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/STEP 2 OF 8/i)).toBeInTheDocument();
    });

    // Prev step
    const prevBtn = screen.getByRole('button', { name: /⏪ Prev/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByText(/STEP 1 OF 8/i)).toBeInTheDocument();
    });

    // Exit tour
    const exitBtn = screen.getByRole('button', { name: /✕ Exit/i });
    fireEvent.click(exitBtn);

    liveDialogueSpy.mockRestore();
  });

  it('handles speech synthesis speaking state with real-time waveform and voice engine branches', async () => {
    let capturedUtterance: any = null;
    (window.speechSynthesis.speak as any).mockImplementation((utt: any) => {
      capturedUtterance = utt;
    });

    const { unmount } = render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    // Exercise onvoiceschanged
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'));
    }

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Exercise voice selection with modern OS female
    (window.speechSynthesis.getVoices as any).mockReturnValue([
      { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
    ]);
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'));
    }

    // Exercise voice selection with non-gTTS voice
    (window.speechSynthesis.getVoices as any).mockReturnValue([
      { name: 'Alex', lang: 'en-US' },
    ]);
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'));
    }

    // Exercise voice selection with non-robotic fallback
    (window.speechSynthesis.getVoices as any).mockReturnValue([
      { name: 'Generic Non Robotic', lang: 'fr-FR' },
    ]);
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'));
    }

    // Exercise voice selection with empty voices
    (window.speechSynthesis.getVoices as any).mockReturnValue([]);
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'));
    }

    unmount();
  });

  it('exercises HTML5 Audio constructor playback, pause on modal close, onended, onerror, and rejection', async () => {
    const mockAudioInstance: any = {
      play: vi.fn().mockReturnValue(Promise.resolve()),
      pause: vi.fn(),
      onended: null,
      onerror: null,
    };
    const audioSpy = vi.fn().mockImplementation(() => mockAudioInstance);
    vi.stubGlobal('Audio', audioSpy);

    const liveDialogueSpy = vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValue({
      response_text: 'Gemini live test speech audio',
      model_used: 'models/gemini-3.8-live',
      latency_ms: 120,
      reasoning_trace: 'Testing audio base64 path',
      voice_persona: 'kore',
      audio_base64: 'A'.repeat(6000),
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Trigger guided tour to activate audio playback
    const tourBtn = screen.getAllByRole('button', { name: /Start Spoken Guided Tour/i })[0];
    fireEvent.click(tourBtn);

    await waitFor(() => {
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    // Test onended callback
    if (mockAudioInstance.onended) {
      mockAudioInstance.onended();
    }

    // Trigger second step to test pause on close
    const nextBtn = screen.getByRole('button', { name: /Next Step ⏩/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockAudioInstance.play).toHaveBeenCalledTimes(2);
    });

    // Close modal while audio is playing (covers lines 1012-1014)
    const closeBtn = screen.getByRole('button', { name: /✕/i });
    fireEvent.click(closeBtn);
    expect(mockAudioInstance.pause).toHaveBeenCalled();

    // Reopen and test onerror callback and play promise rejection
    fireEvent.click(openBtn);
    mockAudioInstance.play.mockReturnValueOnce(Promise.reject(new Error('Audio playback failed')));
    fireEvent.click(screen.getAllByRole('button', { name: /Start Spoken Guided Tour/i })[0]);

    await waitFor(() => {
      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    if (mockAudioInstance.onerror) {
      mockAudioInstance.onerror(new Event('error'));
    }

    liveDialogueSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('completes the entire guided tour through all 8 steps and finishes tour', async () => {
    vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValue({
      response_text: 'Live step response',
      model_used: 'models/gemini-3.8-live',
      latency_ms: 50,
      voice_persona: 'kore',
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Launch tour
    const tourBtn = screen.getAllByRole('button', { name: /Start Spoken Guided Tour/i })[0];
    fireEvent.click(tourBtn);

    // Advance 7 times to reach step 8 (final step)
    for (let step = 1; step <= 7; step++) {
      await waitFor(() => {
        expect(screen.getByText(new RegExp(`STEP ${step} OF 8`, 'i'))).toBeInTheDocument();
      });
      const nextBtn = screen.getByRole('button', { name: /Next Step ⏩/i });
      fireEvent.click(nextBtn);
    }

    // On Step 8, button should say Finish Tour 🏁
    await waitFor(() => {
      expect(screen.getByText(/STEP 8 OF 8/i)).toBeInTheDocument();
    });
    const finishBtn = screen.getByRole('button', { name: /Finish Tour 🏁/i });
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(screen.getByText(/Congratulations! You have completed the FuturaSculptAI Spoken Guided Tour/i)).toBeInTheDocument();
    });
  });

  it('exercises all knowledge query responses across stages, agentic RAG, and persona prompts', async () => {
    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    const input = screen.getByPlaceholderText(/Ask Futura anything/i);
    const sendBtn = screen.getByRole('button', { name: /^Send$/i });

    const queries = [
      'tour guide platform overview',
      'stage 1 cockpit overview',
      'stage 2 worktwin fabric',
      'stage 3 task sculptor',
      'stage 4 opportunity engine',
      'stage 5 temporal workgraph',
      'stage 6 multimodal',
      'stage 7 agent swarm',
      'stage 8 trustboard governance',
      'tell me about agentic rag corporate intel and employee count',
      'how would you explain this to a 5-year-old kid?',
      'how does this assist a 60+ senior non-tech worker?',
      'tell me about the 1y 3y 5y roadmap',
    ];

    for (const q of queries) {
      fireEvent.change(input, { target: { value: q } });
      fireEvent.click(sendBtn);
    }

    await waitFor(() => {
      expect(screen.getByText(/Stage 1: Executive Cockpit/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 2: Futura WorkTwin Fabric/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 3: Task Sculptor/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 4: Opportunity Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 5: Temporal WorkGraph/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 6: MultiModal Media Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 7: Google ADK 7-Agent Swarm/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 8: TrustBoard Governance/i)).toBeInTheDocument();
    });
  });

  it('stops live audio on close when live audio is playing', async () => {
    vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValueOnce({
      response_text: 'Live audio test response',
      audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA' + 'A'.repeat(6000),
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'kore',
      latency_ms: 120,
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    const input = screen.getByPlaceholderText(/Ask Futura anything/i);
    const sendBtn = screen.getByRole('button', { name: /^Send$/i });

    fireEvent.change(input, { target: { value: 'Explain live audio testing' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Live audio test response/i)).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /Close Futura Assistant/i });
    fireEvent.click(closeBtn);
  });

  it('falls back to speech synthesis speakText when window.Audio is undefined', async () => {
    const origAudio = (window as any).Audio;
    delete (window as any).Audio;

    vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValueOnce({
      response_text: 'Fallback speech synthesis announcement',
      audio_base64: 'A'.repeat(6000),
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'aoede',
      latency_ms: 100,
    });

    render(
      <AuraHologramAssistant
        currentLanguage="en"
        onNavigateTab={vi.fn()}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Launch Futura 3D Virtual Live Assistant/i });
    fireEvent.click(openBtn);

    // Switch to Aoede persona to exercise Aoede pitch/rate branch in speakText
    const aoedeBtn = screen.getByRole('button', { name: /Aoede/i });
    fireEvent.click(aoedeBtn);

    const input = screen.getByPlaceholderText(/Ask Futura anything/i);
    const sendBtn = screen.getByRole('button', { name: /^Send$/i });

    fireEvent.change(input, { target: { value: 'Speak via speech synthesis' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Fallback speech synthesis announcement/i)).toBeInTheDocument();
    });

    // Also exercise speakText catch branch when synthesis throws
    (window.speechSynthesis.speak as any).mockImplementationOnce(() => {
      throw new Error('Speech synthesis device error');
    });
    vi.spyOn(api, 'geminiLiveDialogue').mockResolvedValueOnce({
      response_text: 'Error recovery test announcement',
      audio_base64: 'A'.repeat(6000),
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'kore',
      latency_ms: 50,
    });
    fireEvent.change(input, { target: { value: 'Speak with synthesis error' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Error recovery test announcement/i)).toBeInTheDocument();
    });

    (window as any).Audio = origAudio;
  });
});

