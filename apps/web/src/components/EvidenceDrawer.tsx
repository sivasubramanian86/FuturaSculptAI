import React, { useState } from 'react';
import { EvidenceEnvelope } from '../types';

interface EvidenceDrawerProps {
  evidenceLedger: EvidenceEnvelope[];
  onUploadFile: (file: File) => Promise<void>;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  evidenceLedger,
  onUploadFile,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceEnvelope | null>(
    evidenceLedger.length > 0 ? evidenceLedger[0] : null
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  return (
    <div className="glass-panel panel-card" style={{ marginTop: '24px' }}>
      <div className="section-header">
        <h2 className="section-title">
          <span>📜</span> Evidence Ledger & Provenance
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            {isUploading ? 'Ingesting...' : '+ Upload Evidence File'}
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".pdf,.csv,.json,.txt"
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <div style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
          {uploadError}
        </div>
      )}

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Cryptographically signed ledger of all ingested strategy memos, SOP documents, and process data. Every AI recommendation cites evidence IDs below.
      </p>

      {evidenceLedger.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No uploaded evidence yet. Use the upload button above to ingest a PDF or SOP file.
        </div>
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginBottom: '16px' }}>
          {evidenceLedger.map((item) => (
            <div
              key={item.evidence_id}
              className="node-item"
              onClick={() => setSelectedEvidence(item)}
              style={{
                borderColor: selectedEvidence?.evidence_id === item.evidence_id ? 'var(--accent-cyan)' : undefined,
                background: selectedEvidence?.evidence_id === item.evidence_id ? 'rgba(6,182,212,0.1)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="node-tag tag-agent">{item.source_type}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.provenance.confidence * 100}% Conf</span>
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
        <div className="drawer-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              Evidence Detail: <span style={{ color: 'var(--accent-cyan)' }}>{selectedEvidence.evidence_id}</span>
            </h3>
            <span className="badge badge-tenant">{selectedEvidence.sensitivity.toUpperCase()}</span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CANONICAL URI: </span>
            <code style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{selectedEvidence.source_uri}</code>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CRYPTOGRAPHIC SHA-256 HASH: </span>
            <span className="hash-pill">{selectedEvidence.sha256_hash}</span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            EXTRACTED SEGMENTS ({selectedEvidence.content.segments.length})
          </div>
          <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
            {selectedEvidence.content.segments.map((seg) => (
              <div key={seg.segment_id} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <strong style={{ color: '#a5b4fc' }}>[{seg.segment_id}]:</strong> {seg.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
