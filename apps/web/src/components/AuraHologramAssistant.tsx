import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../i18n';

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

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null;

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

  // Initial Welcome Message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'msg-welcome',
        sender: 'aura',
        text: '✨ Hello! I am Aura, your 3D Holographic Sanctuary Assistant. I am here to guide workers, seniors, kids, freelancers, movie artists, and industrialists in any language. Tap a question or talk to me!',
      };
      setMessages([welcome]);
      speakText(welcome.text);
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

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = BCP47_MAP[currentLanguage] || 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

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

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
    };

    const replyText = generateAuraResponse(text);
    const auraMsg: ChatMessage = {
      id: `aura-${Date.now() + 1}`,
      sender: 'aura',
      text: replyText,
    };

    setMessages((prev) => [...prev, userMsg, auraMsg]);
    setInputText('');
    speakText(replyText);
  };

  const QUICK_PROMPTS = [
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
        aria-label="Launch Aura 3D Virtual Live Assistant"
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
        title="✨ Aura 3D Hologram Live Assistant"
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
              setIsOpen(false);
              if (synthRef.current) synthRef.current.cancel();
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
                    Aura &mdash; 3D Virtual Live Assistant
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
                  onClick={() => {
                    setIsOpen(false);
                    if (synthRef.current) synthRef.current.cancel();
                  }}
                  className="btn-subtle"
                  style={{ padding: '6px 12px', borderRadius: '50%', fontSize: '14px' }}
                  aria-label="Close Aura Assistant"
                >
                  ✕
                </button>
              </div>
            </div>

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
                  Aura Quantum Holo-Node • 60 FPS Engine
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
                    <div>{m.text}</div>
                    {m.sender === 'aura' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
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
                placeholder="Ask Aura anything (e.g. 5yo kid, 60+ senior, UPI QR safety, Uber drivers, movies)..."
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
