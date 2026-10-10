import React, { useState } from 'react';
import { api } from '../services/api';
import {
  ClaimVerificationResult,
  EvidenceEnvelope,
  IntegrityCheckResult,
} from '../types';

interface EvidenceDrawerProps {
  evidenceLedger: EvidenceEnvelope[];
  onUploadFile: (file: File) => Promise<void>;
  onVerifyIntegrity?: (evidenceId: string) => Promise<IntegrityCheckResult>;
  onVerifyClaim?: (
    claimText: string,
    evidenceIds?: string[]
  ) => Promise<ClaimVerificationResult>;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  evidenceLedger,
  onUploadFile,
  onVerifyIntegrity,
  onVerifyClaim,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceEnvelope | null>(
    evidenceLedger.length > 0 ? evidenceLedger[0] : null
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Integrity verification state
  const [verifyingIntegrity, setVerifyingIntegrity] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [integrityError, setIntegrityError] = useState<string | null>(null);

  // Claim entailment audit state
  const [claimText, setClaimText] = useState<string>('');
  const [verifyingClaim, setVerifyingClaim] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<ClaimVerificationResult | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      await onUploadFile(file);
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyIntegrity = async (evidenceId: string) => {
    try {
      setVerifyingIntegrity(true);
      setIntegrityError(null);
      const fn = onVerifyIntegrity || ((id: string) => api.verifyIntegrity(id));
      const result = await fn(evidenceId);
      setIntegrityResult(result);
    } catch (err: any) {
      setIntegrityError(err.message || 'Integrity check failed');
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleVerifyClaim = async (evidenceId: string) => {
    if (!claimText.trim()) return;

    try {
      setVerifyingClaim(true);
      setClaimError(null);
      const fn =
        onVerifyClaim ||
        ((claim: string, ids?: string[]) => api.verifyClaim(claim, ids));
      const result = await fn(claimText, [evidenceId]);
      setClaimResult(result);
    } catch (err: any) {
      setClaimError(err.message || 'Claim verification failed');
    } finally {
      setVerifyingClaim(false);
    }
  };

  return (
    <div className="glass-panel panel-card" style={{ marginTop: '24px' }}>
      <div className="section-header">
        <h2 className="section-title">
          <span>📜</span> Cryptographic Evidence Ledger & Multimodal Ingestion
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            {isUploading ? 'Ingesting...' : '+ Ingest Evidence Asset'}
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".pdf,.csv,.json,.txt,.png,.jpg,.jpeg,.mp3,.mp4"
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <div
          style={{
            background: 'rgba(244,63,94,0.1)',
            color: 'var(--accent-rose)',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '14px',
          }}
        >
          {uploadError}
        </div>
      )}

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Immutable audit ledger of multimodal evidence (SOPs, telemetry CSVs, API schemas, vision captures).
        Every AI scenario recommendation cites SHA-256 cryptographic hashes verified against zero-hallucination policies.
      </p>

      {evidenceLedger.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No uploaded evidence yet. Use the upload button above to ingest a PDF or SOP file.
        </div>
      ) : (
        <div
          className="grid-cards"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            marginBottom: '16px',
          }}
        >
          {evidenceLedger.map((item) => (
            <div
              key={item.evidence_id}
              className="node-item"
              onClick={() => {
                setSelectedEvidence(item);
                setIntegrityResult(null);
                setIntegrityError(null);
              }}
              style={{
                borderColor:
                  selectedEvidence?.evidence_id === item.evidence_id
                    ? 'var(--accent-cyan)'
                    : undefined,
                background:
                  selectedEvidence?.evidence_id === item.evidence_id
                    ? 'rgba(6,182,212,0.1)'
                    : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span className="node-tag tag-agent">{item.source_type.toUpperCase()}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {Math.round(item.provenance.confidence * 100)}% Conf
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                {item.provenance.author_or_source}
              </div>
              <div className="hash-pill" title={item.sha256_hash}>
                SHA: {item.sha256_hash.slice(0, 16)}...
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvidence && (
        <div className="drawer-panel" style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              Evidence Detail:{' '}
              <span style={{ color: 'var(--accent-cyan)' }}>
                {selectedEvidence.evidence_id}
              </span>
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge badge-tenant">
                {selectedEvidence.sensitivity.toUpperCase()}
              </span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={() => handleVerifyIntegrity(selectedEvidence.evidence_id)}
                disabled={verifyingIntegrity}
              >
                {verifyingIntegrity ? 'Verifying...' : '🛡️ Verify SHA-256 Ledger'}
              </button>
            </div>
          </div>

          {integrityError && (
            <div
              style={{
                background: 'rgba(244,63,94,0.1)',
                color: 'var(--accent-rose)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '10px',
              }}
            >
              {integrityError}
            </div>
          )}

          {integrityResult && (
            <div
              style={{
                background: integrityResult.is_valid
                  ? 'rgba(16,185,129,0.12)'
                  : 'rgba(244,63,94,0.15)',
                border: `1px solid ${
                  integrityResult.is_valid
                    ? 'rgba(16,185,129,0.4)'
                    : 'rgba(244,63,94,0.4)'
                }`,
                color: integrityResult.is_valid
                  ? 'var(--accent-emerald, #10b981)'
                  : 'var(--accent-rose, #f43f5e)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '12px',
              }}
            >
              <strong>
                {integrityResult.is_valid
                  ? '✓ Cryptographic Ledger Integrity Confirmed'
                  : '✗ Tamper Warning: Hash Mismatch Detected'}
              </strong>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
                Computed: <code>{integrityResult.computed_sha256}</code>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              CANONICAL URI:{' '}
            </span>
            <code style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
              {selectedEvidence.source_uri}
            </code>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              CRYPTOGRAPHIC SHA-256 HASH:{' '}
            </span>
            <span className="hash-pill">{selectedEvidence.sha256_hash}</span>
          </div>

          {selectedEvidence.content.entities &&
            selectedEvidence.content.entities.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  DISCOVERED DOMAIN ENTITIES & STANDARDS
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedEvidence.content.entities.map((ent, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: '#a5b4fc',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {ent.name} ({ent.entity_type})
                    </span>
                  ))}
                </div>
              </div>
            )}

          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}
          >
            EXTRACTED SEGMENTS ({selectedEvidence.content.segments.length})
          </div>
          <div
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.2)',
              padding: '10px',
              borderRadius: '6px',
            }}
          >
            {selectedEvidence.content.segments.map((seg) => (
              <div
                key={seg.segment_id}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <strong style={{ color: '#a5b4fc' }}>[{seg.segment_id}]:</strong>{' '}
                {seg.text}
              </div>
            ))}
          </div>

          {/* Real-Time Claim Entailment Audit Section */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              🔍 Anti-Hallucination Claim Entailment Audit
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Enter claim statement to verify against ingested evidence..."
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
                disabled={verifyingClaim}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleVerifyClaim(selectedEvidence.evidence_id)}
                disabled={verifyingClaim}
                style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                {verifyingClaim ? 'Auditing...' : 'Audit Claim'}
              </button>
            </div>

            {claimError && (
              <div
                style={{
                  background: 'rgba(244,63,94,0.1)',
                  color: 'var(--accent-rose)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {claimError}
              </div>
            )}

            {claimResult && (
              <div
                style={{
                  background:
                    claimResult.verdict === 'supported'
                      ? 'rgba(16,185,129,0.12)'
                      : claimResult.verdict === 'contradicted'
                      ? 'rgba(244,63,94,0.12)'
                      : 'rgba(245,158,11,0.12)',
                  border: `1px solid ${
                    claimResult.verdict === 'supported'
                      ? 'rgba(16,185,129,0.3)'
                      : claimResult.verdict === 'contradicted'
                      ? 'rgba(244,63,94,0.3)'
                      : 'rgba(245,158,11,0.3)'
                  }`,
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  marginTop: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      color:
                        claimResult.verdict === 'supported'
                          ? 'var(--accent-emerald, #10b981)'
                          : claimResult.verdict === 'contradicted'
                          ? 'var(--accent-rose, #f43f5e)'
                          : 'var(--accent-amber, #f59e0b)',
                    }}
                  >
                    VERDICT: {claimResult.verdict.toUpperCase()} (
                    {Math.round(claimResult.confidence * 100)}% Conf)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Cited IDs: {claimResult.cited_evidence_ids.join(', ') || 'None'}
                  </span>
                </div>
                <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                  {claimResult.explanation}
                </div>
                {claimResult.cited_segments.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '11px' }}>
                    <strong style={{ color: '#a5b4fc' }}>Supporting Citation:</strong>{' '}
                    <em>"{claimResult.cited_segments[0].text}"</em>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
