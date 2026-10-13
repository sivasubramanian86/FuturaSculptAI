import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GuidedTourModal, TOUR_STEPS } from '../../components/GuidedTourModal';

describe('GuidedTourModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <GuidedTourModal isOpen={false} onClose={vi.fn()} onNavigateTab={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders step 1, displays badge and key features, and navigates forwards and backwards', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();

    render(<GuidedTourModal isOpen={true} onClose={onClose} onNavigateTab={onNavigateTab} />);

    // Step 1 check
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/STAGE 1: SEED & PERSONA/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Industry Simulation & Multi-Tenant Personas/i })).toBeInTheDocument();
    expect(screen.getByText(/Multi-industry scenario presets/i)).toBeInTheDocument();

    // Back button should be disabled on first step
    const backBtn = screen.getByRole('button', { name: /← Back/i });
    expect(backBtn).toBeDisabled();

    // Next step button
    const nextBtn = screen.getByRole('button', { name: /Next Step →/i });
    fireEvent.click(nextBtn);

    // Step 2 check
    expect(screen.getByText(/STAGE 2: SCULPT/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Task Sculptor & 6-Taxonomy Allocation/i })).toBeInTheDocument();

    // Now Back button should be enabled
    expect(backBtn).not.toBeDisabled();
    fireEvent.click(backBtn);
    expect(screen.getByText(/STAGE 1: SEED & PERSONA/i)).toBeInTheDocument();
  });

  it('jumps directly to a step using dot indicators and navigates to section', () => {
    const onClose = vi.fn();
    const onNavigateTab = vi.fn();

    render(<GuidedTourModal isOpen={true} onClose={onClose} onNavigateTab={onNavigateTab} />);

    // Click step 3 dot indicator
    const step3Dot = screen.getByLabelText(/Go to step 3/i);
    fireEvent.click(step3Dot);
    expect(screen.getByText(/STAGE 3: MOBILITY/i)).toBeInTheDocument();

    // Click Jump to Section button
    const jumpBtn = screen.getByRole('button', { name: /Jump to Opportunity Section/i });
    fireEvent.click(jumpBtn);
    expect(onNavigateTab).toHaveBeenCalledWith('opportunity');
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates to the last step and completes the tour', () => {
    const onClose = vi.fn();

    render(<GuidedTourModal isOpen={true} onClose={onClose} onNavigateTab={vi.fn()} />);

    // Jump directly to last step (Step 6)
    const step6Dot = screen.getByLabelText(`Go to step ${TOUR_STEPS.length}`);
    fireEvent.click(step6Dot);

    expect(screen.getByText(/STAGE 6: GOVERN & PROVE/i)).toBeInTheDocument();
    const finishBtn = screen.getByRole('button', { name: /✓ Finish Tour/i });
    expect(finishBtn).toBeInTheDocument();
    fireEvent.click(finishBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation via ArrowRight, ArrowLeft, and Escape keys', () => {
    const onClose = vi.fn();

    render(<GuidedTourModal isOpen={true} onClose={onClose} onNavigateTab={vi.fn()} />);

    // ArrowRight advances to step 2
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/STAGE 2: SCULPT/i)).toBeInTheDocument();

    // ArrowLeft goes back to step 1
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/STAGE 1: SEED & PERSONA/i)).toBeInTheDocument();

    // Escape closes modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Close button click
    const closeBtn = screen.getByLabelText('Close Tour');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

