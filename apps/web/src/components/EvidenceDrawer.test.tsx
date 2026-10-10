import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EvidenceDrawer } from './EvidenceDrawer';
import { EvidenceEnvelope } from '../types';

describe('EvidenceDrawer Component', () => {
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

  it('renders evidence ledger list and selects items to display details', () => {
    const onUpload = vi.fn();
    render(<EvidenceDrawer evidenceLedger={mockEvidenceList} onUploadFile={onUpload} />);

    expect(screen.getByText('Packaging QA Team')).toBeInTheDocument();
    expect(screen.getByText('HR Operations')).toBeInTheDocument();
    expect(screen.getByText(/Seal bar temperature must be maintained/i)).toBeInTheDocument();

    // Click on second evidence item
    fireEvent.click(screen.getByText('HR Operations'));
    expect(screen.getByText(/Evidence Detail:/i)).toBeInTheDocument();
    expect(screen.getByText('gs://futurasculpt-evidence/food_manufacturing/roles_catalog.csv')).toBeInTheDocument();
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
});
