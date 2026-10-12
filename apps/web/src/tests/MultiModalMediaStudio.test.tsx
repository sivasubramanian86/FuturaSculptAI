import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MultiModalMediaStudio } from '../components/MultiModalMediaStudio';
import { getTranslations } from '../i18n';

describe('MultiModalMediaStudio Component', () => {
  const i18n = getTranslations('en');

  it('renders studio tabs and image category by default', () => {
    render(<MultiModalMediaStudio i18n={i18n} />);
    expect(screen.getByRole('heading', { name: /MultiModal Media Studio/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Packaging Line 4 Optical Sorter Feed/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches between audio, video, and doc categories', () => {
    render(<MultiModalMediaStudio i18n={i18n} />);

    // Switch to audio tab
    fireEvent.click(screen.getByRole('tab', { name: /Voice & Acoustic/i }));
    expect(screen.getAllByText(/Shift Operator Voice Memo/i).length).toBeGreaterThanOrEqual(1);

    // Toggle audio playback
    const playBtn = screen.getByRole('button', { name: /Play Memo/i });
    fireEvent.click(playBtn);
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();

    // Switch to video tab
    fireEvent.click(screen.getByRole('tab', { name: /Video & Cam/i }));
    expect(screen.getAllByText(/High-Speed Diverter Video Telemetry/i).length).toBeGreaterThanOrEqual(1);

    // Switch to doc tab
    fireEvent.click(screen.getByRole('tab', { name: /SOP Scans/i }));
    expect(screen.getAllByText(/HACCP Food Safety SOP Revision 4.2/i).length).toBeGreaterThanOrEqual(1);

    // Switch back to image tab
    fireEvent.click(screen.getByRole('tab', { name: /Images/i }));
    expect(screen.getAllByText(/Packaging Line 4 Optical Sorter Feed/i).length).toBeGreaterThanOrEqual(1);
  });

  it('handles selecting different samples and runs analysis', () => {
    vi.useFakeTimers();
    render(<MultiModalMediaStudio i18n={i18n} />);

    // Select second image sample
    const sample2 = screen.getByText(/Manual Palletizing Joint Strain Snapshot/i);
    fireEvent.click(sample2);

    expect(screen.getByText(/Operator bending at 48 degrees/i)).toBeInTheDocument();

    // Run Gemini analysis
    const analyzeBtn = screen.getByRole('button', { name: /Run Gemini Multimodal Analysis/i });
    fireEvent.click(analyzeBtn);

    expect(screen.getByText(i18n.analyzingLabel)).toBeInTheDocument();

    // Fast-forward timers
    vi.runAllTimers();

    expect(screen.getByText(/Manual Palletizer Operator -> Cobotic Palletizing Supervisor/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('handles custom file upload', () => {
    render(<MultiModalMediaStudio i18n={i18n} />);

    const file = new File(['mock content'], 'test_factory.jpg', { type: 'image/jpeg' });
    const input = document.getElementById('media-file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Attached: test_factory.jpg/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom File: test_factory.jpg/i)).toBeInTheDocument();
  });
});
