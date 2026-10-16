import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../i18n';
import { api } from '../services/api';

interface AuraHologramAssistantProps {
  currentLanguage: LanguageCode;
  onNavigateTab: (tabId: string) => void;
  onSelectSector?: (sector: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'aura' | 'user';
  text: string;
  category?: string;
  audioPrompt?: string;
  modelUsed?: string;
  reasoningTrace?: string;
  latencyMs?: number;
  voicePersona?: string;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  orbitRadius: number;
}

const BCP47_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  es: 'es-ES',
  ja: 'ja-JP',
  fr: 'fr-FR',
  de: 'de-DE',
};

export interface GuidedTourStep {
  step: number;
  tabId: string;
  title: string;
  badge: string;
  icon: string;
  prompt: string;
  description: string;
  highlights: string[];
}

export const FUTURA_TOUR_STEPS: GuidedTourStep[] = [
  {
    step: 1,
    tabId: 'overview',
    title: 'Executive Cockpit & Citizen Overview',
    badge: 'STAGE 1: COCKPIT & SECTORS',
    icon: '📊',
    prompt:
      'Explain Stage 1: The Executive Cockpit and Citizen Overview in FuturaSculptAI. Mention our 94.3% ethical trust score, multi-sector switching between food processing, automotive EV, healthcare, and robotics, and zero-layoff workforce guarantees.',
    description:
      'Unified executive and citizen cockpit tracking real-time workforce health, 94.3% trust scores, 18 active transformation tasks, and instantaneous multi-sector digital twin switching.',
    highlights: ['94.3% TrustBoard Governance Score', 'Multi-Sector Presets (Food, EV, Healthcare, Robotics)', 'Citizen Worker Simple Voice & Visual Mode'],
  },
  {
    step: 2,
    tabId: 'worktwins',
    title: 'Futura WorkTwin Fabric',
    badge: 'STAGE 2: DIGITAL TWINS',
    icon: '👥',
    prompt:
      'Explain Stage 2: The Futura WorkTwin Fabric. Explain the three governed twin classes: RoleTwin archetype (default), PersonalWorkTwin (consent-based and revocable), and OrganizationTwin (scenario simulation), emphasizing that we never create unrestricted AI clones.',
    description:
      'Governed workforce digital twins. RoleTwin provides synthetic role archetypes; PersonalWorkTwin offers opt-in, revocable employee task delegation; and OrganizationTwin models systemic enterprise workflows.',
    highlights: ['RoleTwin synthetic role archetypes', 'PersonalWorkTwin consent & purpose binding', 'OrganizationTwin systemic enterprise simulations'],
  },
  {
    step: 3,
    tabId: 'task_sculptor',
    title: 'Task Sculptor & 6-Part Taxonomy',
    badge: 'STAGE 3: WORK REBALANCING',
    icon: '🧬',
    prompt:
      'Explain Stage 3: Task Sculptor in FuturaSculptAI. Describe how we decompose workflows into Automate, Augment, Assist, Retain, Redesign, and Retire, while enforcing the A2 Human Sign-Off Gate for supervisor approval.',
    description:
      'Deconstruct jobs into granular tasks categorized across our 6-part taxonomy. Rebalance human agency and AI autonomy with mandatory A2 Human Sign-Off Gates.',
    highlights: ['6-Taxonomy allocation (Augment, Automate, Retain, etc.)', 'A2 Supervisor Sign-Off gate', 'Worker cognitive load rebalancing'],
  },
  {
    step: 4,
    tabId: 'opportunity',
    title: 'Opportunity Engine & Mobility',
    badge: 'STAGE 4: CAREER MOBILITY',
    icon: '🚀',
    prompt:
      'Explain Stage 4: The Opportunity Engine and Career Mobility. Explain deterministic Role Resilience Indices, +15% to +38% wage mobility trajectories, sponsored reskilling pathways, and k>=10 differential privacy.',
    description:
      'Deterministic indices (RRI, TCI, HVI, SRI) matching displaced tasks to sponsored career mobility pathways protected by k>=10 differential privacy and statutory right of appeal.',
    highlights: ['Deterministic Role Resilience Index (RRI)', '+15% to +38% wage increase trajectories', 'k>=10 Differential Privacy protection'],
  },
  {
    step: 5,
    tabId: 'workgraph',
    title: 'Temporal WorkGraph & Scenarios',
    badge: 'STAGE 5: TEMPORAL SIMULATION',
    icon: '🌐',
    prompt:
      'Explain Stage 5: The Temporal WorkGraph and Scenario Simulations. Explain how we project organizational impact across T0, T+30, T+90, and Year 3 horizons, evaluating blast radius before automating.',
    description:
      '8-layer enterprise graph connecting Outcomes, Capabilities, Workflows, Tasks, Roles, Skills, Systems, and Agents. Simulate multi-year automation blast radius before deploying.',
    highlights: ['8-layer enterprise ontology', 'T0 to Year 3 temporal horizon forecasting', 'Automation blast radius cascade visualizer'],
  },
  {
    step: 6,
    tabId: 'multimodal',
    title: 'MultiModal Media Studio',
    badge: 'STAGE 6: MULTIMODAL INGESTION',
    icon: '🎙️',
    prompt:
      'Explain Stage 6: The MultiModal Media Studio. Describe how we ingest workplace audio memos, equipment schematics, camera feeds, and documents using Gemini 2.5 Pro and Gemini Flash Native Audio.',
    description:
      'Ingest and analyze real-world shift voice recordings, factory equipment blueprints, CCTV ergonomics feeds, and standard operating procedure documents in real time.',
    highlights: ['Voice & acoustic shift note transcription', 'Equipment schematic visual grounding', 'Gemini Flash Native Audio narration'],
  },
  {
    step: 7,
    tabId: 'agent_swarm',
    title: 'Google ADK 7-Agent Swarm Console',
    badge: 'STAGE 7: MULTI-AGENT SWARM',
    icon: '🤖',
    prompt:
      'Explain Stage 7: The Google ADK Multi-Agent Swarm Console. Describe our 7 neuro-symbolic specialist agents collaborating with the Adversarial Safety Critic and consensus voting.',
    description:
      '7 specialized Google ADK agents (Task Decomposer, Skills Mobility, FinOps, WorkGraph Architect, Adversarial Critic, etc.) collaborating with verifiable tool trajectories and consensus voting.',
    highlights: ['7 Google ADK neuro-symbolic specialists', 'Adversarial Safety Critic red-line verification', 'Live reasoning traces and tool trajectory inspection'],
  },
  {
    step: 8,
    tabId: 'governance',
    title: 'TrustBoard Governance & Evidence Vault',
    badge: 'STAGE 8: GOVERNANCE & PROOF',
    icon: '🛡️',
    prompt:
      'Explain Stage 8: TrustBoard Governance and Cryptographic Evidence. Explain our 8 Well-Architected pillars, 16 Google SAIF security controls, Cloud DLP PII protection, and SHA-256 evidence vault.',
    description:
      'Rigorous AI governance scoring 8 Well-Architected pillars, 16 Google SAIF security controls, and Cloud DLP crypto-hashing, with tamper-evident SHA-256 evidence packages for audit compliance.',
    highlights: ['8 Well-Architected governance pillars', '16 Google SAIF security matrix controls', 'Cryptographic SHA-256 Evidence Vault'],
  },
];

export const AuraHologramAssistant: React.FC<AuraHologramAssistantProps> = ({
  currentLanguage,
  onNavigateTab,
  onSelectSector,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState<
    'models/gemini-3.8-live' | 'models/gemini-3.8-live-extended-thinking'
  >('models/gemini-3.8-live');
  const [reasoningBudget, setReasoningBudget] = useState<number>(2048);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [selectedVoicePersona, setSelectedVoicePersona] = useState<'kore' | 'aoede'>('kore');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [activeVoiceEngine, setActiveVoiceEngine] = useState<string>('Detecting Voice...');
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleJumpToSection = (tabId: string, sectorId?: string) => {
    onNavigateTab(tabId);
    if (sectorId && onSelectSector) {
      onSelectSector(sectorId);
    }
    setIsOpen(false);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Speech Recognition & Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null;

      const loadVoices = () => {
        try {
          if (window.speechSynthesis) {
            const list = window.speechSynthesis.getVoices();
            if (list && list.length > 0) {
              setAvailableVoices(list);
            }
          }
        } catch {
          // ignore
        }
      };
      loadVoices();
      if (typeof window.speechSynthesis?.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = BCP47_MAP[currentLanguage] || 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputText(transcript);
          if (event.results[0].isFinal) {
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [currentLanguage]);

  // Initial Welcome Message with Gemini Flash Native Audio LLM
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText =
        '✨ Hello! I am Futura, your 3D Holographic Sanctuary Assistant powered by Gemini Live Native Audio. Welcome to FuturaSculptAI! I am here to guide workers, seniors, kids, freelancers, movie artists, and industrialists in any language. Tap "Start Guided Tour" below for an interactive spoken walkthrough, or tap a question to talk to me!';
      const welcome: ChatMessage = {
        id: 'msg-welcome',
        sender: 'aura',
        text: welcomeText,
        modelUsed: selectedModel,
        voicePersona: selectedVoicePersona,
      };
      setMessages([welcome]);

      setIsLoadingLive(true);
      api
        .geminiLiveDialogue({
          message:
            'Hello! Warmly introduce yourself as Futura, the 3D Holographic AI Workforce Sanctuary Assistant powered by Gemini Live Native Audio. Welcome the user to FuturaSculptAI, mention that you can give an interactive spoken guided tour of all 8 app modules, and invite them to explore.',
          model: selectedModel,
          voice_persona: selectedVoicePersona,
          language: currentLanguage,
          context_topic: 'welcome',
        })
        .then((res) => {
          if (res.response_text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === 'msg-welcome'
                  ? {
                      ...m,
                      text: res.response_text,
                      modelUsed: res.model_used,
                      reasoningTrace: res.reasoning_trace,
                      latencyMs: res.latency_ms,
                      voicePersona: res.voice_persona,
                    }
                  : m
              )
            );
          }
          if (res.audio_base64) {
            playAudioBase64(res.audio_base64, res.response_text || welcomeText);
          }
        })
        .catch(() => {
          // Keep welcome text visible without robotic speech fallback
        })
        .finally(() => {
          setIsLoadingLive(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 3D Canvas Particle Projection Engine
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current!;
    const ctx = canvas?.getContext?.('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth || 300);
    let height = (canvas.height = canvas.offsetHeight || 260);

    const particles: Particle3D[] = [];
    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#38bdf8', '#10b981', '#f59e0b'];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: 0,
        y: 0,
        z: (Math.random() - 0.5) * 180,
        size: Math.random() * 2.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: (Math.random() * 0.015 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        orbitRadius: Math.random() * 60 + 55,
      });
    }

    let rot = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 - 10;
      const boost = isSpeaking ? 18 : isListening ? 10 : 3;

      rot += isSpeaking ? 0.03 : 0.008;

      // Draw Conical Hologram Projector Beam from base
      const beamGrad = ctx.createLinearGradient(centerX, height, centerX, centerY);
      beamGrad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      beamGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
      beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

      ctx.beginPath();
      ctx.moveTo(centerX - 45, height);
      ctx.lineTo(centerX - 85, centerY - 20);
      ctx.lineTo(centerX + 85, centerY - 20);
      ctx.lineTo(centerX + 45, height);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // Render 3D Orbiting Hologram Particle Cloud
      particles.forEach((p, idx) => {
        p.angle += p.speed;
        const curR = p.orbitRadius + Math.sin(rot * 2 + idx) * boost;
        const x3d = Math.cos(p.angle) * curR;
        const z3d = Math.sin(p.angle) * curR + p.z;
        const y3d = Math.sin(p.angle * 2 + rot) * 22;

        const fov = 260;
        const scale = fov / (fov + z3d);
        const px = centerX + x3d * scale;
        const py = centerY + y3d * scale;
        const pSize = Math.max(0.6, p.size * scale);

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isSpeaking ? 16 : isListening ? 10 : 5;
        ctx.globalAlpha = Math.max(0.2, Math.min(0.95, scale));
        ctx.fill();

        // Connect holographic data lines
        if (idx % 5 === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = isSpeaking ? 0.28 : 0.08;
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, isSpeaking, isListening]);

  const pickFemaleVoice = (): any => {
    if (!synthRef.current) return null;
    const all = (synthRef.current.getVoices && synthRef.current.getVoices()) || availableVoices || [];
    if (!all || all.length === 0) return null;

    const langCode = BCP47_MAP[currentLanguage] || 'en-US';
    const langPrefix = langCode.split('-')[0];

    // Helper: Is this the legacy robotic 2012 Google US English (gTTS) voice?
    const isRoboticGtts = (v: any) => {
      if (!v || !v.name) return false;
      const n = v.name.toLowerCase();
      return (
        n === 'google us english' ||
        n.includes('google us english') ||
        n.includes('google uk english male') ||
        (n.startsWith('google') && !n.includes('natural') && !n.includes('neural') && !n.includes('studio') && !n.includes('journey'))
      );
    };

    // Priority 1: High-fidelity Natural / Neural female voices (Edge Natural, Chrome Studio/Journey, Wavenet)
    const premiumNaturalRegex = /natural|neural|online.*natural|journey|studio|jenny|aria|kore|aoede|wavenet/i;
    const premiumLang = all.find(
      (v: any) =>
        !isRoboticGtts(v) &&
        (v.lang === langCode || (v.lang && v.lang.startsWith(langPrefix))) &&
        premiumNaturalRegex.test(v.name)
    );
    if (premiumLang) {
      setActiveVoiceEngine(premiumLang.name);
      return premiumLang;
    }

    const anyPremium = all.find((v: any) => !isRoboticGtts(v) && premiumNaturalRegex.test(v.name));
    if (anyPremium) {
      setActiveVoiceEngine(anyPremium.name);
      return anyPremium;
    }

    // Priority 2: Standard modern operating system female voices (Windows Zira, macOS Samantha/Victoria, iOS Ava)
    const modernFemaleRegex = /zira|jenny|aria|samantha|victoria|karen|moira|veena|catherine|sonia|neerja|swara|ava|allison|female/i;
    const osFemale = all.find(
      (v: any) =>
        !isRoboticGtts(v) &&
        (v.lang === langCode || (v.lang && v.lang.startsWith(langPrefix))) &&
        modernFemaleRegex.test(v.name)
    );
    if (osFemale) {
      setActiveVoiceEngine(osFemale.name);
      return osFemale;
    }

    const anyModernFemale = all.find((v: any) => !isRoboticGtts(v) && modernFemaleRegex.test(v.name));
    if (anyModernFemale) {
      setActiveVoiceEngine(anyModernFemale.name);
      return anyModernFemale;
    }

    // Priority 3: Any non-robotic voice for this language (excluding male voices David, Mark, George)
    const nonGttsVoice = all.find(
      (v: any) =>
        !isRoboticGtts(v) &&
        (v.lang === langCode || (v.lang && v.lang.startsWith(langPrefix))) &&
        !v.name.toLowerCase().includes('david') &&
        !v.name.toLowerCase().includes('mark') &&
        !v.name.toLowerCase().includes('george')
    );
    if (nonGttsVoice) {
      setActiveVoiceEngine(nonGttsVoice.name);
      return nonGttsVoice;
    }

    // Priority 4: Any non-robotic voice at all
    const anyNonGtts = all.find((v: any) => !isRoboticGtts(v));
    if (anyNonGtts) {
      setActiveVoiceEngine(anyNonGtts.name);
      return anyNonGtts;
    }

    // Never pick legacy robotic gTTS voice as fallback
    const nonRoboticFallback = all.find((v: any) => !isRoboticGtts(v)) || null;
    if (nonRoboticFallback) {
      setActiveVoiceEngine(nonRoboticFallback.name);
      return nonRoboticFallback;
    }

    setActiveVoiceEngine(`Gemini Live Audio Native (${selectedVoicePersona.toUpperCase()})`);
    return null;
  };

  const playAudioBase64 = (base64Data: string, fallbackText?: string) => {
    try {
      if (typeof window === 'undefined') {
        if (fallbackText) speakText(fallbackText);
        return;
      }
      if (!base64Data || base64Data.trim() === '' || base64Data.length < 5000) {
        if (fallbackText && typeof (window as any).Audio === 'undefined') {
          speakText(fallbackText);
        }
        return;
      }
      if (liveAudioRef.current) {
        liveAudioRef.current.pause();
        liveAudioRef.current = null;
      }
      const AudioConstructor = (window as any).Audio;
      if (!AudioConstructor) {
        if (fallbackText) speakText(fallbackText);
        return;
      }
      const audio = new AudioConstructor(`data:audio/wav;base64,${base64Data}`);
      liveAudioRef.current = audio;
      setIsSpeaking(true);
      setActiveVoiceEngine(`Gemini Live Native Audio (${selectedVoicePersona.toUpperCase()})`);
      audio.onended = () => {
        setIsSpeaking(false);
        liveAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        liveAudioRef.current = null;
      };
      const playPromise = audio.play?.();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsSpeaking(false);
          liveAudioRef.current = null;
        });
      }
    } catch {
      setIsSpeaking(false);
      liveAudioRef.current = null;
      if (fallbackText && typeof (window as any).Audio === 'undefined') {
        speakText(fallbackText);
      }
    }
  };

  const handleStartTour = async (stepIdx: number = 0) => {
    const idx = Math.max(0, Math.min(stepIdx, FUTURA_TOUR_STEPS.length - 1));
    const step = FUTURA_TOUR_STEPS[idx];
    setIsTourActive(true);
    setTourStepIndex(idx);

    // Synchronize cockpit navigation tab
    onNavigateTab(step.tabId);

    const tourMsg: ChatMessage = {
      id: `tour-${step.step}-${Date.now()}`,
      sender: 'aura',
      text: `🎙️ Stage ${step.step}/8: ${step.title}\n\n${step.description}\n\nKey Capabilities:\n• ${step.highlights.join('\n• ')}`,
      category: 'guided_tour',
      modelUsed: selectedModel,
      voicePersona: selectedVoicePersona,
    };
    setMessages((prev) => [...prev, tourMsg]);
    setIsLoadingLive(true);

    try {
      const liveRes = await api.geminiLiveDialogue({
        message: step.prompt,
        model: selectedModel,
        voice_persona: selectedVoicePersona,
        language: currentLanguage,
        context_topic: step.tabId,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tourMsg.id
            ? {
                ...m,
                text: `🎙️ Stage ${step.step}/8: ${step.title}\n\n${liveRes.response_text}\n\nKey Capabilities:\n• ${step.highlights.join('\n• ')}`,
                modelUsed: liveRes.model_used,
                reasoningTrace: liveRes.reasoning_trace,
                latencyMs: liveRes.latency_ms,
                voicePersona: liveRes.voice_persona,
              }
            : m
        )
      );

      if (liveRes.audio_base64) {
        playAudioBase64(liveRes.audio_base64, liveRes.response_text);
      }
    } catch {
      // Offline fallback: use local knowledge text
      const fallbackReply = generateAuraResponse(step.prompt);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tourMsg.id
            ? {
                ...m,
                text: `🎙️ Stage ${step.step}/8: ${step.title}\n\n${fallbackReply}\n\nKey Capabilities:\n• ${step.highlights.join('\n• ')}`,
              }
            : m
        )
      );
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleNextTourStep = () => {
    if (tourStepIndex < FUTURA_TOUR_STEPS.length - 1) {
      handleStartTour(tourStepIndex + 1);
    } else {
      setIsTourActive(false);
      const completionMsg: ChatMessage = {
        id: `tour-complete-${Date.now()}`,
        sender: 'aura',
        text: '🎉 Congratulations! You have completed the FuturaSculptAI Spoken Guided Tour across all 8 modules. Feel free to explore any tab or ask me questions anytime!',
        modelUsed: selectedModel,
        voicePersona: selectedVoicePersona,
      };
      setMessages((prev) => [...prev, completionMsg]);
    }
  };

  const handlePrevTourStep = () => {
    if (tourStepIndex > 0) {
      handleStartTour(tourStepIndex - 1);
    }
  };

  const handleExitTour = () => {
    setIsTourActive(false);
    if (liveAudioRef.current) {
      liveAudioRef.current.pause();
      liveAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = BCP47_MAP[currentLanguage] || 'en-US';

      const voice = pickFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Gemini Live Audio Native female voice calibration:
      // Kore: crisp, natural female voice (pitch 1.15, rate 1.04)
      // Aoede: warm melodic female tone (pitch 1.22, rate 0.98)
      if (selectedVoicePersona === 'aoede') {
        utterance.pitch = 1.22;
        utterance.rate = 0.98;
      } else {
        utterance.pitch = 1.15;
        utterance.rate = 1.04;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const generateAuraResponse = (query: string): string => {
    const q = query.toLowerCase();

    // Spoken Guided Tour Keywords
    if (q.includes('tour') || q.includes('guide')) {
      return '🎙️ Welcome to the FuturaSculptAI Guided Tour! Across 8 integrated modules, we explore the Executive Cockpit, WorkTwin Fabric, Task Sculptor, Opportunity Engine, Temporal WorkGraph, MultiModal Media Studio, 7-Agent Swarm, and TrustBoard SAIF Governance. Tap Next Step to advance through the modules!';
    }
    if (q.includes('stage 1') || (q.includes('cockpit') && q.includes('overview'))) {
      return '📊 Stage 1: Executive Cockpit & Citizen Overview tracks 94.3% workforce trust scores, 18 active transformation tasks, and cross-sector digital twins for Food, Automotive, Healthcare, and Robotics with zero layoff guarantees.';
    }
    if (q.includes('stage 2') || q.includes('worktwin')) {
      return '👥 Stage 2: Futura WorkTwin Fabric provides governed digital work-twins across three classes: RoleTwin synthetic archetypes, consent-based PersonalWorkTwins, and OrganizationTwin enterprise simulations.';
    }
    if (q.includes('stage 3') || q.includes('task sculptor')) {
      return '🧬 Stage 3: Task Sculptor decomposes workflows into Automate, Augment, Assist, Retain, Redesign, and Retire categories with mandatory A2 Human Sign-Off supervisor gates.';
    }
    if (q.includes('stage 4') || q.includes('opportunity engine') || q.includes('mobility')) {
      return '🚀 Stage 4: Opportunity Engine calculates deterministic Role Resilience Indices and +15% to +38% wage mobility pathways protected by k>=10 differential privacy and statutory right of appeal.';
    }
    if (q.includes('stage 5') || q.includes('temporal workgraph') || q.includes('workgraph')) {
      return '🌐 Stage 5: Temporal WorkGraph projects organizational impact across T0, T+30, T+90, and Year 3 horizons to visualize automation blast radius before deployment.';
    }
    if (q.includes('stage 6') || q.includes('multimodal')) {
      return '🎙️ Stage 6: MultiModal Media Studio ingests workplace shift audio memos, equipment schematics, and camera feeds using Gemini 2.5 Pro and Gemini Flash Native Audio.';
    }
    if (q.includes('stage 7') || q.includes('agent swarm') || q.includes('swarm')) {
      return '🤖 Stage 7: Google ADK 7-Agent Swarm deploys neuro-symbolic specialist agents with an Adversarial Safety Critic, verifiable tool trajectories, and consensus voting.';
    }
    if (q.includes('stage 8') || q.includes('governance') || q.includes('trustboard') || q.includes('evidence')) {
      return '🛡️ Stage 8: TrustBoard Governance monitors 8 Well-Architected pillars, 16 Google SAIF security controls, and Cloud DLP crypto-hashing, with tamper-evident SHA-256 evidence packages.';
    }

    // Agentic RAG & MCP Company Intelligence Grounding
    if (q.includes('agentic rag') || q.includes('company') || q.includes('headcount') || q.includes('employee count') || q.includes('revenue') || q.includes('profit') || q.includes('moat') || q.includes('futuristic score')) {
      return '📊 Agentic RAG & MCP Company Intelligence Grounding: We query verified SEC 10-K filings, Bloomberg, and annual financial statements for real headcount, revenue, net profit, and competitive moats. For Google (182,500 employees, $307.4B revenue), our deterministic Futuristic Readiness Score is 94.4/100 (A+ Frontier Pioneer). Jump to the Transformation Studio to synthesize any enterprise!';
    }

    // 5yo kid
    if (q.includes('5 year') || q.includes('kid') || q.includes('child') || q.includes('baby')) {
      return '👶 For a 5-year-old: Think of AI like a friendly robot helper, like WALL-E or Baymax! The robots do messy chores so mom and dad have more playtime and storytime with you!';
    }

    // 60+ senior or illiterate
    if (q.includes('60') || q.includes('senior') || q.includes('elderly') || q.includes('illiterate') || q.includes('can\'t read') || q.includes('tech')) {
      return '🧓 For seniors & non-tech workers: You do NOT need any computer degree or tech skills! We guarantee your full salary for 90 days. You will get voice-guided micro lessons in your mother tongue, and robots will only do heavy lifting.';
    }

    // UPI / QR Code Transaction Safety
    if (q.includes('upi') || q.includes('qr') || q.includes('payment') || q.includes('gateway') || q.includes('transaction')) {
      return '💳 For UPI & QR Payments: FuturaSculptAI sculpts retail cashiers into Digital Trust Sentinels! We apply Google Cloud DLP to crypto-hash UPI IDs, zero-click biometric step-up authentication, and reverse QR spoofing detection before settlement.';
    }

    // Uber / Ola / Mobility / Autonomous Driving
    if (q.includes('uber') || q.includes('ola') || q.includes('driver') || q.includes('car') || q.includes('driving') || q.includes('auto') || q.includes('maps')) {
      return '🚖 For Uber & Ola Drivers: When autonomous robotaxis arrive, drivers are NOT laid off! FuturaSculptAI sculpts drivers into Fleet Tele-Operations Supervisors & Autonomous Safety Marshals with a 90-day wage protection bond and remote simulator training.';
    }

    // Cinema & Movie Industry
    if (q.includes('cinema') || q.includes('movie') || q.includes('film') || q.includes('actor') || q.includes('vfx') || q.includes('dubbing')) {
      return '🎬 For Cinema & Movie Industry: Camera crew, dubbing artists, and VFX editors are sculpted into Generative Prompt Directors and Synthetic IP Curators! We enforce SAG-AFTRA digital likeness contracts, cryptographic watermarks, and automated royalty splits.';
    }

    // 1Y, 3Y, 5Y, 10Y Future Work Transformation & Growth
    if (q.includes('1y') || q.includes('3y') || q.includes('5y') || q.includes('10y') || q.includes('roadmap') || q.includes('future work') || q.includes('growth') || q.includes('unstructured') || q.includes('transform')) {
      return '🔮 1Y, 3Y, 5Y & 10Y Transformation Roadmap: In Year 1, routine paper logging drops 45% and overtime falls 30% with guaranteed wage bonds (+15% pay). By Year 3, workers become Certified Digital Supervisors (+38% wage hike, 1.85x firm revenue). By Year 5, autonomous pipelines run smoothly and firm revenue hits 2.65x. By Year 10, the company achieves 5.8x valuation as a cognitive industry leader with workers as profit-sharing partners!';
    }

    // Freelancer / Gig Worker
    if (q.includes('freelance') || q.includes('gig') || q.includes('contract')) {
      return '💼 For Freelancers: We guarantee transparent rate floors, protection against unfair algorithmic account deactivations, and automated dispute appeals via our Right to Appeal protocol.';
    }

    // Industrialist / Business Owner
    if (q.includes('business') || q.includes('industrialist') || q.includes('roi') || q.includes('owner') || q.includes('cost')) {
      return '🏭 For Business Owners & Industrialists: FuturaSculptAI delivers a 6.25x net ROI multiple, reduces retraining costs by 48%, avoids costly union strikes, and satisfies all 16 Google SAIF security controls.';
    }

    // Default Sanctuary Guidance
    return '🛡️ FuturaSculptAI Workforce Sanctuary: We transform work ethically through task augmentation rather than replacement. Every worker gets zero layoff guarantees, transparent human-in-the-loop sign-offs, and 100% auditable evidence.';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoadingLive(true);

    try {
      const liveRes = await api.geminiLiveDialogue({
        message: text,
        model: selectedModel,
        voice_persona: selectedVoicePersona,
        reasoning_budget:
          selectedModel === 'models/gemini-3.8-live-extended-thinking'
            ? reasoningBudget
            : undefined,
        language: currentLanguage,
      });

      const auraMsg: ChatMessage = {
        id: `aura-${Date.now() + 1}`,
        sender: 'aura',
        text: liveRes.response_text,
        modelUsed: liveRes.model_used,
        reasoningTrace: liveRes.reasoning_trace,
        latencyMs: liveRes.latency_ms,
        voicePersona: liveRes.voice_persona,
      };

      setMessages((prev) => [...prev, auraMsg]);
      if (liveRes.audio_base64) {
        playAudioBase64(liveRes.audio_base64, liveRes.response_text);
      }
    } catch {
      // Offline / fallback response without robotic speech synthesis
      const replyText = generateAuraResponse(text);
      const auraMsg: ChatMessage = {
        id: `aura-${Date.now() + 1}`,
        sender: 'aura',
        text: replyText,
        modelUsed: selectedModel,
        voicePersona: selectedVoicePersona,
      };
      setMessages((prev) => [...prev, auraMsg]);
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsTourActive(false);
    if (synthRef.current) synthRef.current.cancel();
    if (liveAudioRef.current) {
      liveAudioRef.current.pause();
      liveAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const QUICK_PROMPTS = [
    { label: '🎙️ Spoken Guided Tour', prompt: 'Give me an interactive spoken guided tour of the entire FuturaSculptAI platform.' },
    { label: '👥 WorkTwin Fabric Tour', prompt: 'Explain the Futura WorkTwin Fabric and its three governed twin classes.' },
    { label: '🏢 Agentic RAG Corporate Intel', prompt: 'Tell me the real employee count, revenue, profit, moat, and futuristic score for Google using Agentic RAG!' },
    { label: '🔮 1Y, 3Y, 5Y & 10Y Roadmap', prompt: 'Tell me the future work style and firm growth roadmap for the next 1y, 3y, 5y, and 10y!' },
    { label: '👶 5-Year-Old Explanation', prompt: 'How would you explain this to a 5-year-old kid?' },
    { label: '🧓 60+ Senior / Non-Tech', prompt: 'Will an elderly 60+ person or non-tech worker lose their job?' },
    { label: '💳 UPI & QR Payment Safety', prompt: 'How does this app provide safety for UPI and QR code payments?' },
    { label: '🚖 Uber / Ola Driver Future', prompt: 'What happens to Uber and Ola drivers when autonomous robotaxis take over?' },
    { label: '🎬 Movie & Cinema Industry', prompt: 'How does FuturaSculptAI protect actors, VFX artists, and film crew?' },
    { label: '🏭 Industrialist & ROI Value', prompt: 'What is the ROI and business value for an enterprise industrialist?' },
  ];

  return (
    <>
      {/* Floating 3D Holographic Beacon Trigger Button */}
      <button
        id="btn-hologram-assistant"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Launch Futura 3D Virtual Live Assistant"
        className="hologram-trigger-orb"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #6366f1 50%, #ec4899 100%)',
          border: '2px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 0 24px rgba(6, 182, 212, 0.65), 0 8px 28px rgba(0, 0, 0, 0.5)',
          cursor: 'pointer',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '26px',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title="✨ Futura 3D Hologram Live Assistant"
      >
        <span style={{ animation: 'hologram-spin 8s linear infinite', display: 'inline-block' }}>🔮</span>
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: '2px dashed rgba(6, 182, 212, 0.5)',
            animation: 'hologram-pulse 2.5s infinite',
            pointerEvents: 'none',
          }}
        />
      </button>

      {/* Hologram Live Assistant Modal */}
      {isOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '92vh',
              borderRadius: '24px',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              boxShadow: '0 0 45px rgba(6, 182, 212, 0.3), 0 25px 60px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
            }}
          >
            {/* Hologram Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(6, 182, 212, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
                  }}
                >
                  🔮
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '17px', color: '#fff', letterSpacing: '-0.01em' }}>
                    Futura &mdash; 3D Virtual Live Assistant
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
                    Universal Workforce Sanctuary Guide • Multilingual Voice AI
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: isSpeaking ? 'rgba(236, 72, 153, 0.2)' : isListening ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isSpeaking ? '#f472b6' : isListening ? '#34d399' : '#94a3b8',
                    border: '1px solid currentColor',
                  }}
                >
                  {isSpeaking ? '🔊 Speaking...' : isListening ? '🎙️ Listening...' : '⚡ Standing By'}
                </span>

                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-subtle"
                  style={{ padding: '6px 12px', borderRadius: '50%', fontSize: '14px' }}
                  aria-label="Close Futura Assistant"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Gemini Live Model Switcher & Reasoning Budget Control Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 24px',
                background: 'rgba(15, 23, 42, 0.7)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Gemini Live Model:</span>
                <button
                  type="button"
                  onClick={() => setSelectedModel('models/gemini-3.8-live')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor:
                      selectedModel === 'models/gemini-3.8-live'
                        ? '#38bdf8'
                        : 'rgba(255, 255, 255, 0.15)',
                    background:
                      selectedModel === 'models/gemini-3.8-live'
                        ? 'rgba(56, 189, 248, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                    color: selectedModel === 'models/gemini-3.8-live' ? '#38bdf8' : '#cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                  title="General-purpose Gemini Live model"
                >
                  ⚡ models/gemini-3.8-live
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel('models/gemini-3.8-live-extended-thinking')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor:
                      selectedModel === 'models/gemini-3.8-live-extended-thinking'
                        ? '#c084fc'
                        : 'rgba(255, 255, 255, 0.15)',
                    background:
                      selectedModel === 'models/gemini-3.8-live-extended-thinking'
                        ? 'rgba(192, 132, 252, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                    color:
                      selectedModel === 'models/gemini-3.8-live-extended-thinking'
                        ? '#c084fc'
                        : '#cbd5e1',
                    transition: 'all 0.2s ease',
                  }}
                  title="Gemini Live model with adjustable reasoning budget"
                >
                  🧠 models/gemini-3.8-live-extended-thinking
                </button>
              </div>

              {selectedModel === 'models/gemini-3.8-live-extended-thinking' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>Reasoning Budget:</span>
                  {[1024, 2048, 4096].map((budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => setReasoningBudget(budget)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor:
                          reasoningBudget === budget ? '#c084fc' : 'rgba(255, 255, 255, 0.15)',
                        background:
                          reasoningBudget === budget
                            ? 'rgba(192, 132, 252, 0.25)'
                            : 'rgba(255, 255, 255, 0.04)',
                        color: reasoningBudget === budget ? '#f3e8ff' : '#94a3b8',
                      }}
                    >
                      {budget} tokens
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Guided Tour Banner / Active Tour Control Deck */}
            {isTourActive ? (
              <div
                id="tour-control-deck"
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.22) 0%, rgba(139, 92, 246, 0.22) 100%)',
                  borderBottom: '1px solid rgba(6, 182, 212, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{FUTURA_TOUR_STEPS[tourStepIndex].icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(6, 182, 212, 0.3)',
                            color: '#38bdf8',
                            border: '1px solid rgba(6, 182, 212, 0.5)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          STEP {tourStepIndex + 1} OF {FUTURA_TOUR_STEPS.length}: {FUTURA_TOUR_STEPS[tourStepIndex].badge}
                        </span>
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          Tab: <strong style={{ color: '#38bdf8' }}>{FUTURA_TOUR_STEPS[tourStepIndex].tabId}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                        {FUTURA_TOUR_STEPS[tourStepIndex].title}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      id="btn-tour-prev"
                      type="button"
                      disabled={tourStepIndex === 0}
                      onClick={handlePrevTourStep}
                      className="btn-subtle"
                      style={{
                        padding: '5px 12px',
                        fontSize: '11px',
                        borderRadius: '8px',
                        opacity: tourStepIndex === 0 ? 0.4 : 1,
                        cursor: tourStepIndex === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ⏪ Prev
                    </button>
                    <button
                      id="btn-tour-replay"
                      type="button"
                      onClick={() => handleStartTour(tourStepIndex)}
                      className="btn-subtle"
                      style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '8px' }}
                      title="Replay Spoken Audio for this step"
                    >
                      🔊 Replay Voice
                    </button>
                    <button
                      id="btn-tour-next"
                      type="button"
                      onClick={handleNextTourStep}
                      className="btn-primary"
                      style={{
                        padding: '5px 16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                      }}
                    >
                      {tourStepIndex === FUTURA_TOUR_STEPS.length - 1 ? 'Finish Tour 🏁' : 'Next Step ⏩'}
                    </button>
                    <button
                      id="btn-tour-exit"
                      type="button"
                      onClick={handleExitTour}
                      className="btn-subtle"
                      style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '8px', color: '#f43f5e' }}
                      title="Exit Guided Tour"
                    >
                      ✕ Exit
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${((tourStepIndex + 1) / FUTURA_TOUR_STEPS.length) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899)',
                      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '8px 24px',
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
                  borderBottom: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>✨</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#e0f2fe' }}>
                    Spoken Guided Tour: Let Futura speak on launch and guide you across all 8 app modules!
                  </span>
                </div>
                <button
                  id="btn-start-guided-tour"
                  type="button"
                  onClick={() => handleStartTour(0)}
                  className="btn-primary"
                  style={{
                    fontSize: '11px',
                    padding: '5px 14px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                    fontWeight: 700,
                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  🎙️ Start Spoken Guided Tour
                </button>
              </div>
            )}

            {/* Main Stage: Left 3D Hologram + Right Chat & Prompts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 320px) 1fr',
                gap: '16px',
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* 3D Hologram Projection Stage */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle at 50% 40%, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0.8) 70%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  padding: '16px',
                  position: 'relative',
                  minHeight: '300px',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: '240px',
                    pointerEvents: 'none',
                    display: 'block',
                  }}
                />

                {/* Central Holographic Avatar Core */}
                <div
                  style={{
                    position: 'absolute',
                    top: '38%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #38bdf8 0%, #6366f1 70%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '34px',
                    boxShadow: isSpeaking
                      ? '0 0 35px #ec4899, inset 0 0 15px #fff'
                      : '0 0 25px #06b6d4, inset 0 0 10px #fff',
                    transition: 'all 0.3s ease',
                  }}
                >
                  ✨
                </div>

                {/* Projector Base Plate */}
                <div
                  style={{
                    width: '120px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'linear-gradient(90deg, #06b6d4, #6366f1, #06b6d4)',
                    boxShadow: '0 0 18px rgba(6, 182, 212, 0.7)',
                    marginTop: '8px',
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  Futura Quantum Holo-Node • 60 FPS Engine
                </div>

                {/* Gemini Live Audio Profile Badge & Persona Toggles */}
                <div
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                      GEMINI LIVE AUDIO NATIVE • FEMALE VOICE
                    </span>
                  </div>

                  {/* Real-time Waveform Equalizer when speaking */}
                  {isSpeaking && (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '2px 0' }}
                      aria-label="Gemini Live Voice Waveform"
                    >
                      {[6, 14, 9, 18, 12, 16, 8, 13, 7].map((h, i) => (
                        <span
                          key={i}
                          style={{
                            width: '3px',
                            height: `${h}px`,
                            background: 'linear-gradient(180deg, #38bdf8, #ec4899)',
                            borderRadius: '2px',
                          }}
                        />
                      ))}
                      <span style={{ fontSize: '10px', color: '#f472b6', marginLeft: '4px' }}>Speaking (Live)</span>
                    </div>
                  )}

                  {/* Persona Selector */}
                  <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoicePersona('kore');
                        const msg = 'Switched to Kore, Gemini Live female voice persona.';
                        api
                          .geminiLiveDialogue({
                            message: msg,
                            model: selectedModel,
                            voice_persona: 'kore',
                            language: currentLanguage,
                          })
                          .then((res) => {
                            if (res.audio_base64) playAudioBase64(res.audio_base64, msg);
                          })
                          .catch(() => {});
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedVoicePersona === 'kore' ? 'linear-gradient(135deg, #0284c7, #6366f1)' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      title="Crisp, confident female voice"
                    >
                      Kore (Crisp)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoicePersona('aoede');
                        const msg = 'Switched to Aoede, warm melodic female voice persona.';
                        api
                          .geminiLiveDialogue({
                            message: msg,
                            model: selectedModel,
                            voice_persona: 'aoede',
                            language: currentLanguage,
                          })
                          .then((res) => {
                            if (res.audio_base64) playAudioBase64(res.audio_base64, msg);
                          })
                          .catch(() => {});
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedVoicePersona === 'aoede' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      title="Warm, empathetic melodic female voice"
                    >
                      Aoede (Warm)
                    </button>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      fontSize: '9px',
                      color: '#94a3b8',
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>Voice Persona:</span> {selectedVoicePersona === 'aoede' ? 'Aoede (Warm Melodic)' : 'Kore (Crisp High-Fidelity)'}
                    <div style={{ color: '#34d399', fontSize: '8.5px', marginTop: '1px' }}>
                      Engine: {activeVoiceEngine} (Non-gTTS)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJumpToSection('scenarios')}
                    style={{
                      width: '100%',
                      marginTop: '4px',
                      padding: '5px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#c4b5fd',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    🚀 Open Future Work Simulator
                  </button>
                </div>
              </div>

              {/* Chat Messages & Knowledge Stream */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  height: '340px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: m.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background:
                        m.sender === 'user'
                          ? 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)'
                          : 'rgba(255, 255, 255, 0.07)',
                      border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: '13px',
                      lineHeight: 1.55,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {m.sender === 'aura' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                          fontSize: '10px',
                          color: '#38bdf8',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>
                          {m.modelUsed || selectedModel}
                        </span>
                        {m.latencyMs && (
                          <span style={{ color: '#94a3b8' }}>• {m.latencyMs}ms</span>
                        )}
                        {m.voicePersona && (
                          <span style={{ color: '#f472b6' }}>• {m.voicePersona} female voice</span>
                        )}
                      </div>
                    )}
                    <div>{m.text}</div>
                    {m.reasoningTrace && (
                      <details
                        style={{
                          marginTop: '8px',
                          padding: '6px 10px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          borderRadius: '8px',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                        }}
                      >
                        <summary
                          style={{
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#a5b4fc',
                            outline: 'none',
                          }}
                        >
                          🧠 Cognitive Reasoning Trace (Extended Thinking)
                        </summary>
                        <pre
                          style={{
                            marginTop: '6px',
                            fontSize: '11px',
                            whiteSpace: 'pre-wrap',
                            color: '#cbd5e1',
                            fontFamily: 'monospace',
                            maxHeight: '140px',
                            overflowY: 'auto',
                          }}
                        >
                          {m.reasoningTrace}
                        </pre>
                      </details>
                    )}
                    {m.sender === 'aura' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {m.id === 'msg-welcome' && (
                          <button
                            id="btn-welcome-start-tour"
                            type="button"
                            onClick={() => handleStartTour(0)}
                            className="btn-primary"
                            style={{
                              padding: '4px 12px',
                              fontSize: '11px',
                              borderRadius: '9999px',
                              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🎙️ Start Spoken Guided Tour
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleJumpToSection('task_sculptor')}
                          className="btn-subtle"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}
                        >
                          🧬 Task Sculptor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToSection('worktwins')}
                          className="btn-subtle"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}
                        >
                          👥 WorkTwin Fabric
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToSection('task_sculptor', 'logistics')}
                          className="btn-subtle"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}
                        >
                          🚛 Sector Focus
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToSection('governance')}
                          className="btn-subtle"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}
                        >
                          🛡️ SAIF Posture
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {isLoadingLive && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: '20px 20px 20px 4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ animation: 'hologram-spin 2s linear infinite', display: 'inline-block' }}>🔮</span>
                    <span>Gemini Live ({selectedModel.replace('models/', '')}) is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Scenario & Persona Question Pills */}
            <div
              style={{
                padding: '12px 20px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.prompt)}
                  className="btn-subtle"
                  style={{
                    fontSize: '12px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: '#e2e8f0',
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input Bar with Mic & Send */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 20px',
                background: 'rgba(15, 23, 42, 0.9)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <button
                type="button"
                onClick={toggleMic}
                className={isListening ? 'btn-primary' : 'btn-secondary'}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  padding: 0,
                  flexShrink: 0,
                  boxShadow: isListening ? '0 0 18px #10b981' : undefined,
                }}
                aria-label={isListening ? 'Stop recording voice' : 'Start speaking with microphone'}
                title={isListening ? 'Listening... click to stop' : 'Tap to speak'}
              >
                {isListening ? '🔴' : '🎙️'}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask Futura anything (e.g. 5yo kid, 60+ senior, UPI QR safety, Uber drivers, movies)..."
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '30px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="btn-primary"
                style={{
                  padding: '10px 22px',
                  borderRadius: '30px',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const FuturaHologramAssistant = AuraHologramAssistant;
