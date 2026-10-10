import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EvidenceDrawer } from './EvidenceDrawer';
import { EvidenceEnvelope } from '../types';
import { api } from '../services/api';

describe('EvidenceDrawer Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockEvidenceList: EvidenceEnvelope[] = [
    {
      evidence_id: 'EV-001',
      sha256_hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      source_uri: 'gs://futurasculpt-evidence/food_manufacturing/sop_thermal_seal.pdf',
      source_type: 'pdf',
      sensitivity: 'internal',
      provenance: {
        author_or_source: 'Packaging QA Team',
        publication_date: '2026-03-01',
        freshness_horizon_days: 180,
        confidence: 0.98,
      },
      content: {
        language: 'en',
        normalized_text: 'Full text preview of thermal seal procedure.',
        segments: [
          { segment_id: 'seg-1', text: 'Seal bar temperature must be maintained at 185°C.' },
          { segment_id: 'seg-2', text: 'Perform visual inspection every 15 minutes.' },
        ],
        entities: [
          { name: 'SOP-401', entity_type: 'standard_code', confidence: 0.98 },
          { name: '185°C', entity_type: 'metric', confidence: 0.95 },
        ],
      },
      acl: ['role:analyst'],
      ingested_at: '2026-03-01T10:00:00Z',
    },
    {
      evidence_id: 'EV-002',
      sha256_hash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012',
      source_uri: 'gs://futurasculpt-evidence/food_manufacturing/roles_catalog.csv',
      source_type: 'csv',
      sensitivity: 'confidential',
      provenance: {
        author_or_source: 'HR Operations',
        publication_date: '2026-02-15',
        freshness_horizon_days: 365,
        confidence: 0.95,
      },
      content: {
        language: 'en',
        normalized_text: 'Roles catalog CSV preview.',
        segments: [{ segment_id: 'seg-csv-1', text: 'Frontline Packaging Operator' }],
      },
      acl: ['role:hr'],
      ingested_at: '2026-02-15T12:00:00Z',
    },
  ];

  it('renders empty message when evidence ledger has zero items', () => {
    const onUpload = vi.fn();
    render(<EvidenceDrawer evidenceLedger={[]} onUploadFile={onUpload} />);
    expect(screen.getByText(/No uploaded evidence yet/i)).toBeInTheDocument();
  });

  it('renders evidence ledger list, entity badges, and selects items to display details', () => {
    const onUpload = vi.fn();
    render(<EvidenceDrawer evidenceLedger={mockEvidenceList} onUploadFile={onUpload} />);

    expect(screen.getByText('Packaging QA Team')).toBeInTheDocument();
    expect(screen.getByText('HR Operations')).toBeInTheDocument();
    expect(screen.getByText(/Seal bar temperature must be maintained/i)).toBeInTheDocument();
    expect(screen.getByText(/SOP-401 \(standard_code\)/i)).toBeInTheDocument();

    // Click on second evidence item
    fireEvent.click(screen.getByText('HR Operations'));
    expect(screen.getByText(/Evidence Detail:/i)).toBeInTheDocument();
    expect(
      screen.getByText('gs://futurasculpt-evidence/food_manufacturing/roles_catalog.csv')
    ).toBeInTheDocument();
  });

  it('handles successful file upload', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <EvidenceDrawer evidenceLedger={mockEvidenceList} onUploadFile={onUpload} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const file = new File(['sample doc'], 'sop.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file);
    });
  });

  it('handles upload failure and displays error message with and without error text', async () => {
    const onUpload = vi.fn().mockRejectedValueOnce(new Error('Network upload failed'));
    const { container } = render(
      <EvidenceDrawer evidenceLedger={mockEvidenceList} onUploadFile={onUpload} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['sample doc'], 'sop.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Network upload failed')).toBeInTheDocument();
    });

    // Rejection without error message
    onUpload.mockRejectedValueOnce({});
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('File upload failed')).toBeInTheDocument();
    });
  });

  it('ignores file change if files list is empty', async () => {
    const onUpload = vi.fn();
    const { container } = render(
      <EvidenceDrawer evidenceLedger={mockEvidenceList} onUploadFile={onUpload} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('verifies SHA-256 integrity: valid match, invalid mismatch, and error handling', async () => {
    const onUpload = vi.fn();
    const onVerifyIntegrity = vi.fn();

    // 1. Valid integrity result
    onVerifyIntegrity.mockResolvedValueOnce({
      evidence_id: 'EV-001',
      is_valid: true,
      computed_sha256: 'a1b2c3d4e5f6',
      stored_sha256: 'a1b2c3d4e5f6',
      checked_at: '2026-10-10T12:00:00Z',
    });

    render(
      <EvidenceDrawer
        evidenceLedger={mockEvidenceList}
        onUploadFile={onUpload}
        onVerifyIntegrity={onVerifyIntegrity}
      />
    );

    const verifyBtn = screen.getByText(/Verify SHA-256 Ledger/i);
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cryptographic Ledger Integrity Confirmed/i)).toBeInTheDocument();
      expect(screen.getByText('a1b2c3d4e5f6')).toBeInTheDocument();
    });

    // 2. Select another item resets integrity result
    fireEvent.click(screen.getByText('HR Operations'));
    expect(screen.queryByText(/Cryptographic Ledger Integrity Confirmed/i)).not.toBeInTheDocument();

    // 3. Invalid integrity result (tamper warning)
    onVerifyIntegrity.mockResolvedValueOnce({
      evidence_id: 'EV-002',
      is_valid: false,
      computed_sha256: 'deadbeef9999',
      stored_sha256: 'b2c3d4e5f678',
      checked_at: '2026-10-10T12:01:00Z',
    });

    const verifyBtn2 = screen.getByText(/Verify SHA-256 Ledger/i);
    fireEvent.click(verifyBtn2);

    await waitFor(() => {
      expect(screen.getByText(/Tamper Warning: Hash Mismatch Detected/i)).toBeInTheDocument();
    });

    // 4. Integrity check error with and without message
    onVerifyIntegrity.mockRejectedValueOnce(new Error('KMS connection timed out'));
    fireEvent.click(verifyBtn2);

    await waitFor(() => {
      expect(screen.getByText('KMS connection timed out')).toBeInTheDocument();
    });

    onVerifyIntegrity.mockRejectedValueOnce({});
    fireEvent.click(verifyBtn2);

    await waitFor(() => {
      expect(screen.getByText('Integrity check failed')).toBeInTheDocument();
    });
  });

  it('audits claim entailment: supported, contradicted, and error handling', async () => {
    const onUpload = vi.fn();
    const onVerifyClaim = vi.fn();

    // 1. Supported claim
    onVerifyClaim.mockResolvedValueOnce({
      claim_text: 'Temperature must be maintained at 185°C',
      verdict: 'supported',
      confidence: 0.98,
      cited_evidence_ids: ['EV-001'],
      cited_segments: [{ segment_id: 'seg-1', text: 'Seal bar temperature must be maintained at 185°C.' }],
      explanation: 'Directly supported by packaging line SOP.',
    });

    render(
      <EvidenceDrawer
        evidenceLedger={mockEvidenceList}
        onUploadFile={onUpload}
        onVerifyClaim={onVerifyClaim}
      />
    );

    const input = screen.getByPlaceholderText(/Enter claim statement to verify/i);
    const auditBtn = screen.getByText('Audit Claim');

    // Empty claim submit does nothing
    fireEvent.click(auditBtn);
    expect(onVerifyClaim).not.toHaveBeenCalled();

    // Fill claim text and submit
    fireEvent.change(input, { target: { value: 'Temperature must be maintained at 185°C' } });
    fireEvent.click(auditBtn);

    await waitFor(() => {
      expect(screen.getByText(/VERDICT: SUPPORTED/i)).toBeInTheDocument();
      expect(screen.getByText(/Directly supported by packaging line SOP./i)).toBeInTheDocument();
      expect(screen.getByText(/"Seal bar temperature must be maintained at 185°C."/i)).toBeInTheDocument();
    });

    // 2. Contradicted claim
    onVerifyClaim.mockResolvedValueOnce({
      claim_text: 'Zero visual inspections are needed',
      verdict: 'contradicted',
      confidence: 0.92,
      cited_evidence_ids: ['EV-001'],
      cited_segments: [],
      explanation: 'SOP mandates visual inspection every 15 minutes.',
    });

    fireEvent.change(input, { target: { value: 'Zero visual inspections are needed' } });
    fireEvent.click(auditBtn);

    await waitFor(() => {
      expect(screen.getByText(/VERDICT: CONTRADICTED/i)).toBeInTheDocument();
    });

    // 3. Claim verification error handling with and without message
    onVerifyClaim.mockRejectedValueOnce(new Error('Claim verification API down'));
    fireEvent.click(auditBtn);

    await waitFor(() => {
      expect(screen.getByText('Claim verification API down')).toBeInTheDocument();
    });

    onVerifyClaim.mockRejectedValueOnce({});
    fireEvent.click(auditBtn);

    await waitFor(() => {
      expect(screen.getByText('Claim verification failed')).toBeInTheDocument();
    });
  });

  it('uses default api methods when callbacks are not provided', async () => {
    const onUpload = vi.fn();
    vi.spyOn(api, 'verifyIntegrity').mockResolvedValueOnce({
      evidence_id: 'EV-001',
      is_valid: true,
      computed_sha256: 'abc',
      stored_sha256: 'abc',
      checked_at: '2026-10-10',
    });
    vi.spyOn(api, 'verifyClaim').mockResolvedValueOnce({
      claim_text: 'Test claim',
      verdict: 'insufficient_evidence',
      confidence: 0.0,
      cited_evidence_ids: [],
      cited_segments: [],
      explanation: 'No matching evidence found.',
    });

    render(<EvidenceDrawer evidenceLedger={mockEvidenceList} onUploadFile={onUpload} />);

    // Trigger integrity check
    fireEvent.click(screen.getByText(/Verify SHA-256 Ledger/i));
    await waitFor(() => {
      expect(api.verifyIntegrity).toHaveBeenCalledWith('EV-001');
    });

    // Trigger claim verification
    const input = screen.getByPlaceholderText(/Enter claim statement to verify/i);
    fireEvent.change(input, { target: { value: 'Test claim' } });
    fireEvent.click(screen.getByText('Audit Claim'));

    await waitFor(() => {
      expect(api.verifyClaim).toHaveBeenCalledWith('Test claim', ['EV-001']);
      expect(screen.getByText(/VERDICT: INSUFFICIENT_EVIDENCE/i)).toBeInTheDocument();
    });
  });
});
