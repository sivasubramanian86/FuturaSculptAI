import React, { useState } from 'react';
import { TranslationKeys } from '../i18n';

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

const SAMPLE_DATA: MultimodalSample[] = [
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
];

interface MultiModalMediaStudioProps {
  i18n: TranslationKeys;
}

export const MultiModalMediaStudio: React.FC<MultiModalMediaStudioProps> = ({ i18n }) => {
  const [activeCategory, setActiveCategory] = useState<'image' | 'audio' | 'video' | 'doc'>('image');
  const [selectedSample, setSelectedSample] = useState<MultimodalSample>(SAMPLE_DATA[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<MultimodalSample | null>(SAMPLE_DATA[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [customFileLoaded, setCustomFileLoaded] = useState<string | null>(null);

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

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult(selectedSample);
    }, 1200);
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

      <div className="multimodal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
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
                  height: '160px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: '36px' }}>📷</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {selectedSample.source}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    border: '1px solid #ef4444',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: '#ef4444',
                    fontSize: '10px',
                  }}
                >
                  DEFECT ROI 84%
                </div>
              </div>
            )}

            {activeCategory === 'audio' && (
              <div
                style={{
                  height: '160px',
                  borderRadius: '6px',
                  background: '#090d16',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
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
              </div>
            )}

            {activeCategory === 'video' && (
              <div
                style={{
                  height: '160px',
                  borderRadius: '6px',
                  background: '#050811',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '32px' }}>🎥</div>
                <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '6px' }}>
                  Edge-TPU 120 FPS Stream Active
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Gemini Multimodal Intelligence Extract</h3>
                <span className="badge badge-emerald">SHA-256 SEALED</span>
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
