import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MultiModalMediaStudio } from '../../components/MultiModalMediaStudio';
import { getTranslations } from '../../i18n';

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

  it('handles selecting different samples and runs analysis with onAnalyze callback', async () => {
    const mockAnalyze = vi.fn().mockResolvedValue({
      asset_id: 'SMP-IMG-02',
      category: 'image',
      title: 'Manual Palletizing Joint Strain Snapshot',
      source: 'Packaging Telemetry',
      snippet: 'Operator bending at 48 degrees',
      detected_tasks: ['Joint Flexion Tracking', 'Heavy Pallet Lift'],
      ergonomic_risk: 'CRITICAL (88/100)',
      automation_potential: 85,
      recommended_pathway: 'Manual Palletizer Operator -> Cobotic Palletizing Supervisor',
      model_used: 'Vertex AI Gemini 2.5 Flash (Multimodal)',
      model_attributed: 'Google Vertex AI Gemini 2.5 Flash Multimodal',
      reasoning_trace: 'Ergonomic joint strain exceeds OSHA threshold. Recommend cobotic palletizer installation.',
      sha256: '99aa88bb77cc',
    });

    render(<MultiModalMediaStudio i18n={i18n} onAnalyze={mockAnalyze} />);

    // Change company context
    const enterpriseSelect = screen.getByRole('combobox');
    fireEvent.change(enterpriseSelect, { target: { value: 'tesla' } });

    // Change prompt directive
    const promptInput = screen.getByPlaceholderText(/Enter dynamic analysis directive/i);
    fireEvent.change(promptInput, { target: { value: 'Quantify battery cell insertion ergonomic hazards.' } });

    // Select second image sample
    const sample2 = screen.getByText(/Manual Palletizing Joint Strain Snapshot/i);
    fireEvent.click(sample2);

    expect(screen.getByText(/Operator bending at 48 degrees/i)).toBeInTheDocument();

    // Run Gemini analysis
    const analyzeBtn = screen.getByRole('button', { name: /Run Gemini Multimodal Analysis/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          company_context: 'tesla',
          prompt_directive: 'Quantify battery cell insertion ergonomic hazards.',
        })
      );
    });
  });

  it('handles custom file upload', () => {
    render(<MultiModalMediaStudio i18n={i18n} />);

    const file = new File(['mock content'], 'test_factory.jpg', { type: 'image/jpeg' });
    const input = document.getElementById('media-file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Attached: test_factory.jpg/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom File: test_factory.jpg/i)).toBeInTheDocument();
  });

  it('renders healthcare radiology and TPU cluster diagrams and exercises audio speech playback', () => {
    let capturedUtterance: any = null;
    const mockSpeak = vi.fn((u) => { capturedUtterance = u; });
    const mockCancel = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: mockSpeak, cancel: mockCancel },
      writable: true,
    });
    class MockUtterance {
      text: string;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockUtterance;
    (globalThis as any).SpeechSynthesisUtterance = MockUtterance;

    render(<MultiModalMediaStudio i18n={i18n} />);

    // Select Healthcare Radiology image
    const radiologySample = screen.getByText(/Clinical Chest Radiography/i);
    fireEvent.click(radiologySample);
    expect(screen.getByText(/94% NODULE/i)).toBeInTheDocument();

    // Select TPU Architecture diagram
    const tpuSample = screen.getByText(/Google TPU v5e Cluster Architecture Diagram/i);
    fireEvent.click(tpuSample);
    expect(screen.getByText(/RING BUS: 4.8 TB\/s INTERCONNECT/i)).toBeInTheDocument();

    // Switch to audio tab and exercise speech play and pause
    fireEvent.click(screen.getByRole('tab', { name: /Voice & Acoustic/i }));
    const playBtn = screen.getByRole('button', { name: /Play Memo/i });
    fireEvent.click(playBtn);
    expect(mockSpeak).toHaveBeenCalled();

    const pauseBtn = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseBtn);
    expect(mockCancel).toHaveBeenCalled();

    if (capturedUtterance?.onend) capturedUtterance.onend();
    if (capturedUtterance?.onerror) capturedUtterance.onerror();
  });
});

