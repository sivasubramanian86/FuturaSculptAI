import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OnboardingModal } from './OnboardingModal';

describe('OnboardingModal Component', () => {
  it('returns null when isOpen is false', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const { container } = render(
      <OnboardingModal isOpen={false} onClose={onClose} onSubmit={onSubmit} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal form and submits valid payload', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<OnboardingModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByText(/Onboard Enterprise Transformation/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Apex Consumer Foods Group')).toBeInTheDocument();

    // Fill form fields
    const orgInput = screen.getByDisplayValue('Apex Consumer Foods Group');
    fireEvent.change(orgInput, { target: { value: 'Delta Robotics Ltd' } });

    const sectorSelect = screen.getByDisplayValue('Food Manufacturing');
    fireEvent.change(sectorSelect, { target: { value: 'banking' } });

    const headcountInput = screen.getByDisplayValue('450');
    fireEvent.change(headcountInput, { target: { value: '1200' } });

    const goalInput = screen.getByDisplayValue(/Achieve zero defect recalls/i);
    fireEvent.change(goalInput, { target: { value: 'Complete robotic overhaul' } });

    const emailInput = screen.getByDisplayValue('transformation@apexfoods.com');
    fireEvent.change(emailInput, { target: { value: 'lead@deltarobotics.com' } });

    const submitBtn = screen.getByRole('button', { name: /Bootstrap Digital Twin/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        organization_name: 'Delta Robotics Ltd',
        sector: 'banking',
        headcount: 1200,
        primary_strategic_goal: 'Complete robotic overhaul',
        contact_email: 'lead@deltarobotics.com',
        consent_granted: true,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays error message when onSubmit rejects with and without message', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Headcount validation failed'));

    render(<OnboardingModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Bootstrap Digital Twin/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Headcount validation failed')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();

    // Rejection without message
    onSubmit.mockRejectedValueOnce({});
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Onboarding failed')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('triggers onClose when close button or Cancel button is clicked', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(<OnboardingModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
