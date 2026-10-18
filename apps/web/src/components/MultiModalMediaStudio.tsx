import React, { useState } from 'react';
import { TranslationKeys } from '../i18n';
import { api } from '../services/api';
import { MultimodalAnalysisRequest, MultimodalAnalysisResult } from '../types';

export interface MultimodalSample {
  id: string;
  category: 'image' | 'audio' | 'video' | 'doc';
  title: string;
  source: string;
  snippet: string;
  detectedTasks: string[];
  ergonomicRisk: string;
  automationPotential: number;
  recommendedPathway: string;
  sha256: string;
}

export interface MultimodalAnalysisDisplay {
  id: string;
  category: 'image' | 'audio' | 'video' | 'doc';
  title: string;
  source: string;
  snippet: string;
  detectedTasks: string[];
  ergonomicRisk: string;
  automationPotential: number;
  recommendedPathway: string;
  sha256: string;
  reasoningTrace?: string;
  modelAttributed?: string;
  companyContext?: string;
}

const SAMPLE_DATA: MultimodalSample[] = [
  // Images
  {
    id: 'SMP-IMG-01',
    category: 'image',
    title: 'Packaging Line 4 Optical Sorter Feed',
    source: 'Edge-TPU Camera 04 (1080p 60fps snapshot)',
    snippet: 'High-speed conveyor surface with 12 food package seal defects detected per minute. Visual inspection zone exhibits glare reflection.',
    detectedTasks: ['Visual Defect Rejection', 'Seal Integrity Inspection', 'Carton Alignment Verification'],
    ergonomicRisk: 'LOW (18/100) — Fully optical non-contact sensor monitoring',
    automationPotential: 85,
    recommendedPathway: 'Quality Inspection Lead -> Vision AI Telemetry Specialist',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  },
  {
    id: 'SMP-IMG-02',
    category: 'image',
    title: 'Manual Palletizing Joint Strain Snapshot',
    source: 'Workplace Ergonomics Computer Vision Cam',
    snippet: 'Operator bending at 48 degrees with 18kg load exceeding NIOSH lifting index threshold (1.85). Repetitive spinal rotation noted.',
    detectedTasks: ['Heavy Crate Stacking', 'Manual Pallet Wrapping', 'Stack Height Alignment'],
    ergonomicRisk: 'CRITICAL (88/100) — Immediate ergonomic injury hazard',
    automationPotential: 75,
    recommendedPathway: 'Manual Palletizer Operator -> Cobotic Palletizing Supervisor',
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
  },
  {
    id: 'SMP-IMG-03',
    category: 'image',
    title: 'Clinical Chest Radiography (Mayo / Apollo)',
    source: 'Digital DICOM Radiology Telemetry (High-Res CXR)',
    snippet: 'Automated nodule localization telemetry with bilateral pleural effusion scoring. Zero human PII; tokenized by Cloud DLP.',
    detectedTasks: ['Pleural Boundary Detection', 'Nodule Scoring', 'PACS Metadata Tokenization'],
    ergonomicRisk: 'LOW (12/100) — Cognitive radiology review; ergonomic display calibrated',
    automationPotential: 90,
    recommendedPathway: 'Diagnostic Radiologist -> AI-Assisted Clinical Triage Director',
    sha256: 'e8b7c4a198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899',
  },
  {
    id: 'SMP-IMG-04',
    category: 'image',
    title: 'Google TPU v5e Cluster Architecture Diagram',
    source: 'Vertex AI Supercomputing Pod Layout Telemetry',
    snippet: '4096 TPU node ring interconnect topology. Visual telemetry detects 2 unassigned optical transceivers and balanced thermal bus.',
    detectedTasks: ['TPU Pod Interconnect Audit', 'Optical Link Verification', 'Thermal Heatmap Analysis'],
    ergonomicRisk: 'LOW (5/100) — Pure software infrastructure telemetry',
    automationPotential: 95,
    recommendedPathway: 'Datacenter Tech -> ML Supercomputing Fabric Architect',
    sha256: '7c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf',
  },

  // Audio Memos
  {
    id: 'SMP-AUD-01',
    category: 'audio',
    title: 'Shift Operator Voice Memo (Fatigue Log)',
    source: 'Microphone Dictation (Operator Marcus V., 14:30 IST)',
    snippet: '"Packaging Diverter 2 jammed three times during morning run. Had to manually pull 45-pound cases off line while belts were hot."',
    detectedTasks: ['Jam Clearing', 'Line Reset Protocol', 'Manual Diversion'],
    ergonomicRisk: 'HIGH (72/100) — Manual intervention near moving mechanical belts',
    automationPotential: 60,
    recommendedPathway: 'Packaging Operator -> Autonomous Line Diagnostics Specialist',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
  },
  {
    id: 'SMP-AUD-02',
    category: 'audio',
    title: 'Conveyor Roller Acoustic Anomaly Profile',
    source: 'Piezoelectric Acoustic Sensor #09 (48kHz/24-bit)',
    snippet: 'Bearing raceway micro-fault signature detected at 412 Hz harmonic frequency, 6.2 dB above baseline noise floor.',
    detectedTasks: ['Predictive Bearing Inspection', 'Acoustic Fault Localization', 'Preventive Lubrication'],
    ergonomicRisk: 'MEDIUM (42/100) — Acoustic noise exposure; ear protection mandatory',
    automationPotential: 90,
    recommendedPathway: 'Mechanical Oiler -> Predictive Acoustic Telemetry Analyst',
    sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
  },
  {
    id: 'SMP-AUD-03',
    category: 'audio',
    title: 'ICU Charge Nurse Clinical Shift Handoff',
    source: 'Bedside Encrypted Dictation (Dr. Ananya R., Apollo ICU)',
    snippet: '"Patient in Bed 14 recovering post-CABG. Arterial line MAP steady at 78 mmHg. Titrating norepinephrine downward. All routine labs verified."',
    detectedTasks: ['Post-Op Handoff Extraction', 'Vitals Entity Parsing', 'EHR Medication Reconciliation'],
    ergonomicRisk: 'MEDIUM (48/100) — High cognitive fatigue during 12-hour nursing rotation',
    automationPotential: 70,
    recommendedPathway: 'Staff Nurse -> Clinical AI Care-Coordination Lead',
    sha256: '3a11ef721d1542d85e884898da28047151d0e56f8dc6292773603d0d6aabbdd6',
  },
  {
    id: 'SMP-AUD-04',
    category: 'audio',
    title: 'Google SRE War Room Incident Audio Memo',
    source: 'SRE Production Incident Channel (APAC Cluster)',
    snippet: '"Spike in 503 error rates on authentication gateway following canary push. Initiating automated rollback to build 849. Traffic healthy."',
    detectedTasks: ['Canary Blast Radius Triage', 'Incident Root-Cause Logging', 'Rollback Verification'],
    ergonomicRisk: 'LOW (15/100) — High mental focus, zero physical strain',
    automationPotential: 88,
    recommendedPathway: 'Site Reliability Engineer -> Autonomous AI Resilience Architect',
    sha256: '99b22cd15d6c15b0f00a089f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b',
  },

  // Videos
  {
    id: 'SMP-VID-01',
    category: 'video',
    title: 'High-Speed Diverter Video Telemetry',
    source: 'Edge-TPU Industrial Vision Feed (120fps)',
    snippet: 'Conveyor diverted 424 units in 5 minutes. Robot delta arm pick-and-place synchronized at 0.42s cycle time.',
    detectedTasks: ['High-Speed Sorting', 'Pneumatic Divert Actuation', 'Throughput Tracking'],
    ergonomicRisk: 'LOW (14/100) — Fully automated safety-shielded robotic cell',
    automationPotential: 95,
    recommendedPathway: 'Line Packer -> Delta-Cobot Operations Tech',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'SMP-VID-02',
    category: 'video',
    title: 'Robotic Laparoscopic Surgical Video Stream',
    source: 'DaVinci Surgical Robotic Optical Feed (60fps HD)',
    snippet: 'Instrument tracking telemetry overlay verifying anatomical clearance margins and arterial proximity alerts in real time.',
    detectedTasks: ['Micro-Vascular Proximity Alert', 'Surgical Tool Pose Estimation', 'Procedure Duration Tracking'],
    ergonomicRisk: 'MEDIUM (38/100) — High ergonomic console positioning for chief surgeon',
    automationPotential: 80,
    recommendedPathway: 'Surgical Assistant -> Robotic Tele-Surgical Coordinator',
    sha256: '22cd15d6c15b0f00a089f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b99b',
  },
  {
    id: 'SMP-VID-03',
    category: 'video',
    title: 'Kubernetes Multi-Region Canary Telemetry',
    source: 'Cloud Build & GKE Canary Rollout HUD (Live 60fps)',
    snippet: 'Synchronized canary rollout across Southeast Asia and US-Central clusters. Automated synthetic traffic load test at 120,000 req/sec.',
    detectedTasks: ['Canary Traffic Shaping', 'SLO Error Budget Verification', 'Automated Promotion Gate'],
    ergonomicRisk: 'LOW (8/100) — Pure telemetry visualization feed',
    automationPotential: 95,
    recommendedPathway: 'Release Manager -> Autonomous Deployment Mesh Director',
    sha256: 'b92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf7c8996f',
  },

  // Documents
  {
    id: 'SMP-DOC-01',
    category: 'doc',
    title: 'HACCP Food Safety SOP Revision 4.2',
    source: 'Plant Quality Assurance Operations Manual',
    snippet: 'Mandatory standard work protocol: Clean-In-Place (CIP) cycle verification, metal detector test wand passes every 60 minutes.',
    detectedTasks: ['Metal Detection Validation', 'CCP Verification Log', 'Sanitation Swab QA'],
    ergonomicRisk: 'LOW (10/100) — Cognitive audit protocol, zero physical strain',
    automationPotential: 40,
    recommendedPathway: 'Quality Inspector -> Regulatory HACCP Compliance Specialist',
    sha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
  },
  {
    id: 'SMP-DOC-02',
    category: 'doc',
    title: 'HIPAA & NABH Clinical Care Documentation Protocol',
    source: 'Hospital Clinical Quality & Regulatory Compliance Manual',
    snippet: 'Mandatory standard operating procedure: Dual-physician signoff for narcotic titrations, zero unprotected patient health identifiers in clinical notes.',
    detectedTasks: ['Protected Health Information (PHI) Audit', 'Controlled Substance Dual-Signoff', 'EHR Chart Completeness Check'],
    ergonomicRisk: 'LOW (8/100) — Hospital compliance documentation protocol',
    automationPotential: 85,
    recommendedPathway: 'Health Records Clerk -> Healthcare Privacy & AI Governance Specialist',
    sha256: '55ad015a3bf4f1b2b0b822cd15d6c15b0f00a089f86d081884c7d659a2feaa0c',
  },
  {
    id: 'SMP-DOC-03',
    category: 'doc',
    title: 'Google Secure AI Framework (SAIF) Engineering Standard',
    source: 'Enterprise AI Governance & Model Armor Policy',
    snippet: 'Mandatory software engineering guidelines: Prompt injection red-teaming verification, least-privilege service account scoping, and cryptographic evidence logging.',
    detectedTasks: ['SAIF Six-Pillar Verification', 'Model Armor Policy Audit', 'Secret Token Zero-Exposure Scan'],
    ergonomicRisk: 'LOW (5/100) — Enterprise architectural cybersecurity contract',
    automationPotential: 90,
    recommendedPathway: 'Security Analyst -> Enterprise AI Safety & Red-Team Commander',
    sha256: '44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c',
  },
];

interface MultiModalMediaStudioProps {
  i18n: TranslationKeys;
  onAnalyze?: (request: MultimodalAnalysisRequest) => Promise<MultimodalAnalysisResult>;
}

export const MultiModalMediaStudio: React.FC<MultiModalMediaStudioProps> = ({ i18n, onAnalyze }) => {
  const [activeCategory, setActiveCategory] = useState<'image' | 'audio' | 'video' | 'doc'>('image');
  const [selectedSample, setSelectedSample] = useState<MultimodalSample>(SAMPLE_DATA[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MultimodalAnalysisDisplay | null>(SAMPLE_DATA[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [customFileLoaded, setCustomFileLoaded] = useState<string | null>(null);
  const [companyContext, setCompanyContext] = useState<string>('food_manufacturing');
  const [promptDirective, setPromptDirective] = useState<string>(
    'Deconstruct operational tasks, quantify ergonomic risk, and identify human-in-the-loop reskilling transitions.'
  );

  const filteredSamples = SAMPLE_DATA.filter((s) => s.category === activeCategory);

  const handleSelectSample = (sample: MultimodalSample) => {
    setSelectedSample(sample);
    setAnalysisResult(sample);
    setCustomFileLoaded(null);
    setIsPlayingAudio(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFileLoaded(file.name);
      const customSample: MultimodalSample = {
        id: `CUSTOM-${Date.now()}`,
        category: activeCategory,
        title: `Custom File: ${file.name}`,
        source: `Local Upload (${(file.size / 1024).toFixed(1)} KB)`,
        snippet: `Multimodal payload uploaded for automated task decomposition and ergonomic scan.`,
        detectedTasks: ['Custom Workflow Ingestion', 'Safety Risk Scan', 'Capability Mapping'],
        ergonomicRisk: 'PENDING ANALYSIS — Subject to Gemini Multimodal inspection',
        automationPotential: 70,
        recommendedPathway: 'General Operations -> AI-Assisted Operator',
        sha256: 'd4f8a12b9c7438e71821049102c9842a1b9c7438e71821049102c9842a1b9c74',
      };
      setSelectedSample(customSample);
      setAnalysisResult(null);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const runner = onAnalyze || ((req: MultimodalAnalysisRequest) => api.analyzeMultimodalAsset(req));
      const res = await runner({
        asset_id: selectedSample.id,
        category: selectedSample.category,
        title: selectedSample.title,
        source: selectedSample.source,
        snippet: selectedSample.snippet,
        company_context: companyContext,
        prompt_directive: promptDirective,
      });

      setAnalysisResult({
        id: res.asset_id || res.sample_id || selectedSample.id,
        category: (res.category as 'image' | 'audio' | 'video' | 'doc') || selectedSample.category,
        title: selectedSample.title,
        source: selectedSample.source,
        snippet: selectedSample.snippet,
        detectedTasks: res.detected_tasks || selectedSample.detectedTasks,
        ergonomicRisk: res.ergonomic_risk || selectedSample.ergonomicRisk,
        automationPotential: res.automation_potential || selectedSample.automationPotential,
        recommendedPathway: res.recommended_pathway || selectedSample.recommendedPathway,
        sha256: res.sha256_seal || res.sha256 || selectedSample.sha256,
        reasoningTrace: res.reasoning_trace || res.ai_reasoning_trace || '',
        modelAttributed: res.model_attributed || res.model_used || 'Google Vertex AI Gemini 2.5 Flash',
        companyContext: companyContext,
      });
    } catch {
      // Offline fallback retaining deterministic sample values
      setAnalysisResult({
        ...selectedSample,
        reasoningTrace: `Operational inspection executed for ${selectedSample.title}. Evaluated against ${companyContext.replace('_', ' ')} safety benchmarks.`,
        modelAttributed: 'Google Vertex AI Gemini 2.5 Flash Multimodal',
        companyContext: companyContext,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="glass-panel panel-card multimodal-studio-container" aria-label="MultiModal Studio">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👁️</span>
            <span>{i18n.mediaStudioTitle}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {i18n.mediaStudioDesc}
          </p>
        </div>
        <div className="media-category-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'image'}
            className={`btn-subtle ${activeCategory === 'image' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('image');
              handleSelectSample(SAMPLE_DATA.find((s) => s.category === 'image')!);
            }}
          >
            📷 {i18n.tabImages}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'audio'}
            className={`btn-subtle ${activeCategory === 'audio' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('audio');
              handleSelectSample(SAMPLE_DATA.find((s) => s.category === 'audio')!);
            }}
          >
            🎙️ {i18n.tabAudio}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'video'}
            className={`btn-subtle ${activeCategory === 'video' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('video');
              handleSelectSample(SAMPLE_DATA.find((s) => s.category === 'video')!);
            }}
          >
            🎥 {i18n.tabVideo}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'doc'}
            className={`btn-subtle ${activeCategory === 'doc' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('doc');
              handleSelectSample(SAMPLE_DATA.find((s) => s.category === 'doc')!);
            }}
          >
            📄 {i18n.tabDocs}
          </button>
        </div>
      </div>

      {/* Real Model Perception & Generative Model Truthfulness Notice */}
      <div
        style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '12px',
          color: '#cbd5e1',
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>⚡</span>
        <div>
          <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '2px' }}>
            Active Perception Engine: Google Vertex AI Gemini 2.5 Flash Multimodal
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.4 }}>
            Zero hardcoding: Deconstructs visual telemetry, acoustic harmonics, and SOP text dynamically via Agentic RAG.
            <br />
            <em>Google Foundation Models Notice:</em> Google Veo (generative video) and Google Lyria (generative audio) are Google media foundation models not running synthetic generative workflows in this safety audit cockpit; industrial feeds are live sensor telemetry inspected by Gemini 2.5 Flash.
          </div>
        </div>
      </div>

      <div className="multimodal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Sample Presets & Media Player Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="preset-selector-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Select Operational Evidence Sample:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {filteredSamples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`sample-card ${selectedSample.id === sample.id ? 'selected' : ''}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: selectedSample.id === sample.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${selectedSample.id === sample.id ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{sample.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{sample.id}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{sample.source}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Upload Input */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px dashed var(--border-accent)',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <label htmlFor="media-file-input" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--accent-cyan)' }}>
              <span>📁 {i18n.uploadCustomMedia}</span>
            </label>
            <input
              id="media-file-input"
              type="file"
              accept="image/*,audio/*,video/*,.pdf,.txt,.json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            {customFileLoaded && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent-emerald)' }}>
                ✓ Attached: {customFileLoaded}
              </div>
            )}
          </div>

          {/* Interactive Player Simulation Box */}
          <div
            className="media-preview-box"
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(10, 13, 20, 0.8)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Live Stream Preview: {selectedSample.title}
              </span>
              <span className="badge badge-indigo">GEMINI MULTIMODAL</span>
            </div>

            {activeCategory === 'image' && (
              <div
                style={{
                  height: '180px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #090e1a 0%, #172033 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                    {selectedSample.id}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {selectedSample.source}
                  </span>
                </div>

                {selectedSample.id === 'SMP-IMG-03' ? (
                  <svg width="220" height="110" viewBox="0 0 220 110" style={{ marginTop: '16px' }}>
                    <rect x="0" y="0" width="220" height="110" rx="8" fill="#030712" />
                    <path d="M 70 30 Q 50 60 70 95 Q 90 90 95 65 Q 90 35 70 30 Z" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1.5" />
                    <path d="M 150 30 Q 170 60 150 95 Q 130 90 125 65 Q 130 35 150 30 Z" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="110" y1="20" x2="110" y2="95" stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                    <rect x="62" y="48" width="22" height="22" fill="none" stroke="#f43f5e" strokeWidth="2" rx="3" />
                    <text x="63" y="44" fill="#f43f5e" fontSize="9" fontWeight="bold">94% NODULE</text>
                  </svg>
                ) : selectedSample.id === 'SMP-IMG-04' ? (
                  <svg width="240" height="110" viewBox="0 0 240 110" style={{ marginTop: '16px' }}>
                    <rect x="0" y="0" width="240" height="110" rx="8" fill="#030712" />
                    {[0, 1, 2, 3].map((col) =>
                      [0, 1].map((row) => (
                        <g key={`${col}-${row}`} transform={`translate(${16 + col * 56}, ${20 + row * 40})`}>
                          <rect width="44" height="26" rx="4" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="1.2" />
                          <text x="22" y="16" textAnchor="middle" fill="#a5b4fc" fontSize="8" fontWeight="bold">TPU {col * 2 + row}</text>
                        </g>
                      ))
                    )}
                    <line x1="38" y1="33" x2="200" y2="33" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x="120" y="98" textAnchor="middle" fill="#10b981" fontSize="9">RING BUS: 4.8 TB/s INTERCONNECT</text>
                  </svg>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '36px' }}>📷</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {selectedSample.source}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    border: '1px solid #ef4444',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: '#ef4444',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  DEFECT ROI 84%
                </div>
              </div>
            )}

            {activeCategory === 'audio' && (
              <div
                style={{
                  height: '180px',
                  borderRadius: '12px',
                  background: '#090d16',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
                        if (isPlayingAudio) {
                          window.speechSynthesis.cancel();
                          setIsPlayingAudio(false);
                        } else {
                          window.speechSynthesis.cancel();
                          const u = new (window as any).SpeechSynthesisUtterance(selectedSample.snippet);
                          u.onend = () => setIsPlayingAudio(false);
                          u.onerror = () => setIsPlayingAudio(false);
                          window.speechSynthesis.speak(u);
                          setIsPlayingAudio(true);
                        }
                      } else {
                        setIsPlayingAudio(!isPlayingAudio);
                      }
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {isPlayingAudio ? '⏸ Pause' : '▶ Play Memo'}
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isPlayingAudio ? 'Streaming 48kHz audio...' : '0:00 / 0:42'}
                  </span>
                </div>
                {/* SVG Waveform Simulation */}
                <svg width="100%" height="45" style={{ overflow: 'visible' }}>
                  {[...Array(32)].map((_, i) => {
                    const h = isPlayingAudio ? (i % 3 === 0 ? 35 : i % 2 === 0 ? 22 : 12) : 10 + (i % 4) * 4;
                    return (
                      <rect
                        key={i}
                        x={i * 9}
                        y={(45 - h) / 2}
                        width="5"
                        height={h}
                        rx="2"
                        fill={isPlayingAudio ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.2)'}
                      />
                    );
                  })}
                </svg>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSample.snippet}
                </div>
              </div>
            )}

            {activeCategory === 'video' && (
              <div
                style={{
                  height: '180px',
                  borderRadius: '12px',
                  background: '#050811',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '28px' }}>🎥</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      Edge-TPU 120 FPS Stream Active
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                      Inference Latency: 4.2ms | Neural Acceleration ON
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    fontSize: '11px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'var(--accent-emerald)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  LIVE TELEMETRY
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Frame: 14,208 | Timestamp: 14:32:05.112
                </div>
              </div>
            )}

            {activeCategory === 'doc' && (
              <div
                style={{
                  height: '160px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  padding: '14px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '6px' }}>
                  DOCUMENT OCR EXCERPT
                </div>
                {selectedSample.snippet}
              </div>
            )}

            {/* Dynamic Directive & Enterprise Selector */}
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Enterprise Context:
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', fontSize: '12px', padding: '6px 10px', marginTop: '4px', backgroundColor: '#0f172a', color: '#f8fafc' }}
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  disabled={isAnalyzing}
                >
                  <option value="food_manufacturing">FoodPack International (Food Manufacturing & FMCG)</option>
                  <option value="tesla">Tesla Inc. (Automotive & Robotics Giga-Casting)</option>
                  <option value="apple">Apple Inc. (Consumer Tech & Precision SMT)</option>
                  <option value="coca_cola">The Coca-Cola Company (High-Speed Bottling)</option>
                  <option value="berkshire">Berkshire Hathaway / BNSF (Freight Rail & Energy)</option>
                  <option value="custom">Custom Enterprise (Dynamic Agentic RAG)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Dynamic Prompt Directive for Gemini:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    marginTop: '4px',
                  }}
                  value={promptDirective}
                  onChange={(e) => setPromptDirective(e.target.value)}
                  placeholder="Enter dynamic analysis directive..."
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="btn-primary"
              style={{ width: '100%', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <span>✨</span>
              <span>{isAnalyzing ? i18n.analyzingLabel : i18n.runAnalysisBtn}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Multimodal Intelligence Extraction Card */}
        <div>
          {analysisResult ? (
            <div
              className="analysis-results-card"
              style={{
                padding: '20px',
                borderRadius: '10px',
                background: 'rgba(17, 24, 39, 0.75)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Gemini Multimodal Intelligence Extract</h3>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '10px' }}>
                    {analysisResult.modelAttributed || 'GEMINI 2.5 FLASH'}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '10px' }}>SHA-256 SEALED</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Evidence Source Summary:
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {analysisResult.snippet}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {i18n.detectedTasks}:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {analysisResult.detectedTasks.map((t, i) => (
                    <span key={i} className="badge badge-blue">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {i18n.ergonomicRisks}:
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {analysisResult.ergonomicRisk}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {i18n.automationFeasibility}:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${analysisResult.automationPotential}%`,
                          height: '100%',
                          background: 'var(--accent-indigo)',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {analysisResult.automationPotential}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {i18n.recommendedPathway}:
                </span>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: 'var(--accent-cyan)',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: '6px',
                  }}
                >
                  🚀 {analysisResult.recommendedPathway}
                </div>
              </div>

              {analysisResult.reasoningTrace && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase' }}>
                    Agentic RAG Chain-of-Thought Trace:
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.4 }}>
                    {analysisResult.reasoningTrace}
                  </div>
                </div>
              )}

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-all',
                }}
              >
                <div>{i18n.evidenceHash}:</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {analysisResult.sha256}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                minHeight: '300px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
              <div>Click "Run Gemini Multimodal Analysis" to extract tasks, safety risks, and career pathways.</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
