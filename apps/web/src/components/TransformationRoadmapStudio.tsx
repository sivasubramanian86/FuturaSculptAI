import React, { useState } from 'react';
import { TranslationKeys } from '../i18n';

export interface TransformationRoadmapStudioProps {
  i18n: TranslationKeys;
  initialText?: string;
  simulationDelayMs?: number;
}

export interface HorizonModel {
  year: string;
  badge: string;
  headline: string;
  workStyle: string;
  workerExperience: string;
  firmMetrics: {
    revenueMultiple: string;
    netMargin: string;
    creativeTimePct: number;
    wageIncrease: string;
    turnaround: string;
  };
  keyMilestones: string[];
}

export interface TransformationRoadmapResult {
  firmTitle: string;
  sourceType: 'unstructured_text' | 'website_url' | 'preset';
  executiveSummary: string;
  horizons: {
    baseline: HorizonModel;
    year1: HorizonModel;
    year3: HorizonModel;
    year5: HorizonModel;
    year10: HorizonModel;
  };
}

export const PRESET_BUSINESSES = [
  {
    id: 'bakery',
    name: '🍞 Family Bakery & Packaged Foods',
    snippet: 'We run a 14-person bakery and snack packaging unit. Orders come via WhatsApp and phone calls. Bakers mix and bake by memory and manual timers. Packaging is done by hand into plastic pouches. Supervisors write daily inventory numbers on paper log sheets. Invoicing is done in Excel at night. We face order delays, inventory mismatches, and overtime fatigue.',
  },
  {
    id: 'automotive',
    name: '🚗 Auto Repair & Precision Workshop',
    snippet: 'We operate an independent automotive repair and machining workshop with 16 mechanics. Jobs are tracked on paper clipboard job cards. Technicians inspect parts with manual calipers and write notes in a logbook. Parts ordering is done by phone with local distributors. Invoicing is keyed into legacy desktop software. Customers call frequently for status updates.',
  },
  {
    id: 'transport',
    name: '🚖 Taxi & Regional Transport Fleet',
    snippet: 'We manage a fleet of 25 cabs and commercial delivery vans. Drivers receive trip allocations through manual phone calls and group chats. Fuel receipts and trip logs are turned in as paper receipts at week end. Drivers face long idle waits, night-shift fatigue, and vehicle maintenance is reactive after breakdowns occur.',
  },
  {
    id: 'cinema',
    name: '🎬 Independent Film & Creative Production',
    snippet: 'We are a boutique video and movie production house with 12 editors, animators, and camera crew. Call sheets and shot logs are printed on paper. Footage tagging and color grading are done manually clip by clip. Rotoscoping takes weeks of frame-by-frame drawing. Freelance billing and royalty tracking are messy spreadsheets.',
  },
  {
    id: 'retail',
    name: '🏪 Retail & Wholesale Grocery Merchant',
    snippet: 'We run a busy neighborhood wholesale and retail store with 10 shop assistants. Customer credit and daily sales are recorded in a traditional physical ledger (bahi-khata). Stock checking is done by walking aisles and counting boxes. We struggle with expired goods, misplaced boxes, and long billing queues at the counter.',
  },
  {
    id: 'clinic',
    name: '🏥 Community Health & Diagnostic Clinic',
    snippet: 'We operate an outpatient clinic with 4 doctors, 6 nurses, and 3 receptionists. Patient history is stored in paper folders. Appointments are booked over the telephone. Doctors handwrite prescriptions. Diagnostic test results are typed manually into templates. Patients wait 45 minutes and insurance claims take days.',
  },
];

export const TransformationRoadmapStudio: React.FC<TransformationRoadmapStudioProps> = ({
  i18n: _i18n,
  initialText = '',
  simulationDelayMs = 600,
}) => {
  const [inputText, setInputText] = useState<string>(initialText || PRESET_BUSINESSES[0].snippet);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [activeHorizon, setActiveHorizon] = useState<'baseline' | 'year1' | 'year3' | 'year5' | 'year10'>('year1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [roadmap, setRoadmap] = useState<TransformationRoadmapResult | null>(null);

  const generateRoadmapFromInput = () => {
    setIsGenerating(true);
    const execute = () => {
      const source = inputMode === 'url' && websiteUrl.trim() ? websiteUrl : inputText;
      const lower = source.toLowerCase();

      let detectedDomain = 'General Enterprise Operations';
      if (lower.includes('bakery') || lower.includes('food') || lower.includes('snack') || lower.includes('kitchen')) {
        detectedDomain = 'Food Processing & Artisan Bakery';
      } else if (lower.includes('auto') || lower.includes('mechanic') || lower.includes('repair') || lower.includes('machine')) {
        detectedDomain = 'Precision Automotive & Engineering Services';
      } else if (lower.includes('cab') || lower.includes('taxi') || lower.includes('transport') || lower.includes('fleet') || lower.includes('driver')) {
        detectedDomain = 'Mobility & Autonomous Fleet Logistics';
      } else if (lower.includes('film') || lower.includes('cinema') || lower.includes('video') || lower.includes('animation') || lower.includes('editor')) {
        detectedDomain = 'Creative Film & Digital Media Production';
      } else if (lower.includes('retail') || lower.includes('shop') || lower.includes('grocery') || lower.includes('wholesale') || lower.includes('store')) {
        detectedDomain = 'Modernized Retail & Omni-Channel Commerce';
      } else if (lower.includes('clinic') || lower.includes('health') || lower.includes('doctor') || lower.includes('patient') || lower.includes('nurse')) {
        detectedDomain = 'Digital Health & Community Clinical Care';
      }

      const generated: TransformationRoadmapResult = {
        firmTitle: detectedDomain,
        sourceType: inputMode === 'url' ? 'website_url' : 'unstructured_text',
        executiveSummary: `Through an ethical, human-first transformation, ${detectedDomain} shifts from manual clerical toil into an empowered, high-margin, scalable enterprise. Routine paper-logging, repetitive counting, and high-fatigue chores are eliminated. Frontline employees are elevated into high-dignity supervisory coordinators with guaranteed salary bonds, 0 layoffs, and up to +65% wage increases. Firm valuation expands over 5x within 10 years.`,
        horizons: {
          baseline: {
            year: 'Now (Traditional Style)',
            badge: 'TRADITIONAL BASELINE',
            headline: 'Manual toil, paper bottleneck & growth ceiling',
            workStyle: '68% of staff time is consumed by routine manual paperwork, phone coordination, hand counting, and error double-checking.',
            workerExperience: 'High physical and mental fatigue. Frequent unpaid overtime, constant phone interruptions, fear of being blamed for missing logs.',
            firmMetrics: {
              revenueMultiple: '1.0x (Baseline)',
              netMargin: '11% - 14%',
              creativeTimePct: 15,
              wageIncrease: '0% (Standard)',
              turnaround: '24 - 48 Hours',
            },
            keyMilestones: [
              'Manual paper logs, clipboards, or messy Excel sheets',
              'Single-person dependency; work halts when senior staff are away',
              'Capacity capped by manual working hours with high error rate (8-12%)',
            ],
          },
          year1: {
            year: 'Year 1 (Digital Relief)',
            badge: 'FOUNDATION & RELIEF',
            headline: 'Immediate automation of routine tasks & paperwork relief',
            workStyle: 'Orders and jobs intake automatically via simple voice memos and digital smart cards. Zero paper logs. Routine clerical chores drop by 45%.',
            workerExperience: 'Overtime cut by 30%. 90-Day Legal Wage Protection Escrow active. Workers complete 2-minute mobile tutorials in their mother tongue.',
            firmMetrics: {
              revenueMultiple: '1.28x Revenue',
              netMargin: '18% - 22%',
              creativeTimePct: 42,
              wageIncrease: '+15% Wage Hike',
              turnaround: '12 Hours (50% Faster)',
            },
            keyMilestones: [
              'Voice-guided digital intake replaces paper notebooks and clipboards',
              'Real-time automated inventory tracking with zero lost items',
              'Frontline team certified on easy tablet/mobile copilot assistants',
            ],
          },
          year3: {
            year: 'Year 3 (Intelligent Synergy)',
            badge: 'COLLABORATION & UPSKILLING',
            headline: 'Human-AI copilot synergy & frontline worker upskilling',
            workStyle: 'Workers no longer do repetitive execution. They supervise intelligent digital agents that flag exceptions, predict shortages, and generate drafts.',
            workerExperience: 'Frontline workers promoted to Certified Digital Supervisors with recognized career credentials and significant pay boosts.',
            firmMetrics: {
              revenueMultiple: '1.85x Revenue',
              netMargin: '26% - 30%',
              creativeTimePct: 68,
              wageIncrease: '+38% Wage Hike',
              turnaround: '3 - 4 Hours',
            },
            keyMilestones: [
              'Staff transition from manual laborers to High-Value Quality Arbiters',
              'Fulfillment capacity expands 2x without increasing headcount stress',
              'Firm captures high-value regional enterprise client contracts',
            ],
          },
          year5: {
            year: 'Year 5 (Autonomous Scale)',
            badge: 'AUTONOMOUS OPERATIONS',
            headline: 'Autonomous self-optimizing pipelines & high-margin expansion',
            workStyle: 'Core supply, scheduling, and client requests execute autonomously end-to-end. Human team focuses 100% on high-touch relationships and creative design.',
            workerExperience: 'Zero mundane grind. Employees enjoy flexible 4-day working shifts, profit-sharing incentives, and 98% career retention.',
            firmMetrics: {
              revenueMultiple: '2.65x Revenue',
              netMargin: '34% - 38%',
              creativeTimePct: 86,
              wageIncrease: '+65% Wage Hike',
              turnaround: '30 Minutes',
            },
            keyMilestones: [
              'Predictive demand forecasting eliminates waste and stockouts completely',
              'Multi-city regional expansion managed with effortless agility',
              'Zero involuntary layoffs; existing team forms core leadership circle',
            ],
          },
          year10: {
            year: 'Year 10 (Cognitive Leadership)',
            badge: 'COGNITIVE ENTERPRISE',
            headline: 'Next-gen cognitive enterprise & durable industry benchmark',
            workStyle: 'Self-adapting cognitive business model. The firm continuously invents new products and services using synthetic simulations and real-time community feedback.',
            workerExperience: 'Employees are senior directors, system architects, and equity profit-shareholders with generational livelihood security.',
            firmMetrics: {
              revenueMultiple: '5.8x Valuation',
              netMargin: '42% - 48%',
              creativeTimePct: 95,
              wageIncrease: '+120% Total Earnings',
              turnaround: 'Instant / Real-time',
            },
            keyMilestones: [
              'Firm operates as an accredited regional innovation powerhouse',
              'Automated circular economy and zero-waste sustainable production',
              'Protected against economic disruptions through agile digital infrastructure',
            ],
          },
        },
      };

      setRoadmap(generated);
      setIsGenerating(false);
    };

    if (simulationDelayMs === 0) {
      execute();
    } else {
      setTimeout(execute, simulationDelayMs);
    }
  };

  const handlePresetClick = (snippet: string) => {
    setInputText(snippet);
    setInputMode('text');
  };

  const handleCopyNarrative = () => {
    if (!roadmap) return;
    const current = roadmap.horizons[activeHorizon];
    const textToCopy = `FUTURASCULPTAI TRANSFORMATION ROADMAP: ${roadmap.firmTitle}\n\nHORIZON: ${current.year} (${current.badge})\nHEADLINE: ${current.headline}\n\nWORK STYLE: ${current.workStyle}\nWORKER EXPERIENCE: ${current.workerExperience}\n\nFIRM GROWTH METRICS:\n- Revenue Multiple: ${current.firmMetrics.revenueMultiple}\n- Net Margin: ${current.firmMetrics.netMargin}\n- Creative Freedom: ${current.firmMetrics.creativeTimePct}%\n- Wage Growth: ${current.firmMetrics.wageIncrease}\n- Turnaround Speed: ${current.firmMetrics.turnaround}\n\nKEY MILESTONES:\n${current.keyMilestones.map((m) => `• ${m}`).join('\n')}\n\nEXECUTIVE SUMMARY:\n${roadmap.executiveSummary}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSpeakNarrative = () => {
    if (!roadmap) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      window.speechSynthesis.cancel();
      const current = roadmap.horizons[activeHorizon];
      const speech = `${roadmap.firmTitle}. ${current.year}. ${current.headline}. Work Style: ${current.workStyle}. Worker Experience: ${current.workerExperience}. Revenue growth: ${current.firmMetrics.revenueMultiple}.`;

      const Utterance = (window as any).SpeechSynthesisUtterance || (globalThis as any).SpeechSynthesisUtterance;
      if (Utterance) {
        const u = new Utterance(speech);
        u.rate = 0.95;
        u.onend = () => setIsPlayingAudio(false);
        u.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
        setIsPlayingAudio(true);
      }
    }
  };

  const currentHorizonData = roadmap ? roadmap.horizons[activeHorizon] : null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '32px 36px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Studio Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>🔮</span>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Future Work Transformation Simulator
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Dump any unstructured work notes or enter a website URL — Get an instant 1Y, 3Y, 5Y & 10Y work style narrative & firm growth projection
            </p>
          </div>
        </div>
      </div>

      {/* Input Options Track */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className="btn-subtle"
            style={{
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: inputMode === 'text' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: inputMode === 'text' ? 'var(--accent-cyan)' : 'transparent',
              color: inputMode === 'text' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}
          >
            📝 Paste Traditional Work Notes
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className="btn-subtle"
            style={{
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: inputMode === 'url' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: inputMode === 'url' ? 'var(--accent-indigo)' : 'transparent',
              color: inputMode === 'url' ? '#a5b4fc' : 'var(--text-secondary)',
            }}
          >
            🌐 Enter Company Website URL
          </button>
        </div>

        {/* 1-Click Quick Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Or pick a traditional business preset:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_BUSINESSES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.snippet)}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Controls */}
        {inputMode === 'text' ? (
          <textarea
            aria-label="Traditional Work Description or Unstructured Notes"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder="Paste your traditional work processes, employee tasks, manual paperwork, or pain points here..."
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '16px',
              background: 'rgba(10, 14, 24, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '13px',
              lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
            }}
          />
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="url"
              aria-label="Company Website URL"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example-traditional-firm.com or https://city-taxicabs.in"
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'rgba(10, 14, 24, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
          <button
            type="button"
            onClick={generateRoadmapFromInput}
            disabled={isGenerating}
            className="btn-primary"
            style={{
              borderRadius: '9999px',
              padding: '12px 28px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{isGenerating ? '⏳' : '✨'}</span>
            <span>{isGenerating ? 'Simulating Multi-Horizon Transformation...' : 'Generate 1Y, 3Y, 5Y & 10Y Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* Generated Results Stage */}
      {roadmap && currentHorizonData && (
        <div
          style={{
            marginTop: '12px',
            padding: '24px',
            borderRadius: '20px',
            background: 'rgba(6, 182, 212, 0.03)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Result Header & Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '11px', borderRadius: '9999px', padding: '4px 12px' }}>
                  {roadmap.firmTitle}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Verified Human-First Transformation
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                Transformation Narrative & Strategic Horizons
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSpeakNarrative}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  color: isPlayingAudio ? '#f43f5e' : '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isPlayingAudio ? '⏹️' : '🔊'}</span>
                <span>{isPlayingAudio ? 'Stop Voice' : 'Listen to Narrative'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyNarrative}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  color: isCopied ? 'var(--accent-emerald)' : 'var(--text-primary)',
                  borderColor: isCopied ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{isCopied ? '✓' : '📋'}</span>
                <span>{isCopied ? 'Copied Brief' : 'Copy Brief'}</span>
              </button>
            </div>
          </div>

          {/* Executive Narrative Paragraph */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderLeft: '4px solid var(--accent-cyan)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#fff' }}>Executive Transformation Summary: </strong>
            {roadmap.executiveSummary}
          </div>

          {/* Horizon Selector Pill Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
              Select Horizon:
            </span>
            {(
              [
                { key: 'baseline', label: 'Now: Traditional Baseline' },
                { key: 'year1', label: '1 Year: Digital Relief' },
                { key: 'year3', label: '3 Years: Intelligent Synergy' },
                { key: 'year5', label: '5 Years: Autonomous Scale' },
                { key: 'year10', label: '10 Years: Cognitive Leader' },
              ] as const
            ).map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => setActiveHorizon(h.key)}
                className="btn-subtle"
                style={{
                  borderRadius: '9999px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: activeHorizon === h.key ? 700 : 500,
                  background: activeHorizon === h.key ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: activeHorizon === h.key ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                  color: activeHorizon === h.key ? '#fff' : 'var(--text-secondary)',
                  boxShadow: activeHorizon === h.key ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
                }}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Active Horizon Detailed Stage Card */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span className="badge badge-emerald" style={{ fontSize: '11px', borderRadius: '9999px', padding: '3px 10px' }}>
                  {currentHorizonData.badge}
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                  {currentHorizonData.year} — {currentHorizonData.headline}
                </h4>
              </div>
            </div>

            {/* Work Style & Worker Experience Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  🧑‍🏭 Future Daily Work Style
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {currentHorizonData.workStyle}
                </p>
              </div>

              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '6px' }}>
                  🛡️ Employee Dignity & Protection
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {currentHorizonData.workerExperience}
                </p>
              </div>
            </div>

            {/* Key Growth Metrics Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                paddingTop: '6px',
              }}
            >
              <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue / Scale</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  {currentHorizonData.firmMetrics.revenueMultiple}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Margin</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  {currentHorizonData.firmMetrics.netMargin}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Human Creative Time</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
                  {currentHorizonData.firmMetrics.creativeTimePct}%
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Worker Wage Raise</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#a7f3d0', marginTop: '4px' }}>
                  {currentHorizonData.firmMetrics.wageIncrease}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fulfillment Speed</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#c084fc', marginTop: '4px' }}>
                  {currentHorizonData.firmMetrics.turnaround}
                </div>
              </div>
            </div>

            {/* Milestones Checklist */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                📌 Key Concrete Milestones:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {currentHorizonData.keyMilestones.map((m, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent-emerald)', fontSize: '14px' }}>✓</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
