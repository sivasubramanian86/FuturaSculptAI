import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoogleLoginModal, formatNameFromEmail } from '../../components/GoogleLoginModal';

describe('GoogleLoginModal Component', () => {
  it('formats display name from email correctly', () => {
    expect(formatNameFromEmail('sivasubramanian86@gmail.com')).toBe('Sivasubramanian86');
    expect(formatNameFromEmail('john.doe@apac.gov')).toBe('John Doe');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <GoogleLoginModal isOpen={false} onClose={vi.fn()} onLogin={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog and handles form submission with valid email', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn();

    render(
      <GoogleLoginModal
        isOpen={true}
        onClose={mockClose}
        onLogin={mockLogin}
        initialEmail="doctor.smith@mayoclinic.org"
        initialDisplayName="Dr. Smith"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Gmail or Google Account Email/i);
    expect(emailInput).toHaveValue('doctor.smith@mayoclinic.org');
    fireEvent.change(emailInput, { target: { value: 'doctor.jsmith@mayoclinic.org' } });

    const nameInput = screen.getByLabelText(/Full Name or Professional Title/i);
    expect(nameInput).toHaveValue('Dr. Smith');
    fireEvent.change(nameInput, { target: { value: 'Dr. John Smith MD' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In with Gmail/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('doctor.jsmith@mayoclinic.org', 'Dr. John Smith MD');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('shows error when email is empty or invalid', async () => {
    const mockLogin = vi.fn();
    const mockClose = vi.fn();

    render(<GoogleLoginModal isOpen={true} onClose={mockClose} onLogin={mockLogin} />);

    const submitBtn = screen.getByRole('button', { name: /Sign In with Gmail/i });
    const emailInput = screen.getByLabelText(/Gmail or Google Account Email/i);

    // Empty email
    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Please enter your Google \/ Gmail account email/i)).toBeInTheDocument();

    // Invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('derives display name from email when display name is not provided', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn();

    render(<GoogleLoginModal isOpen={true} onClose={mockClose} onLogin={mockLogin} />);

    const emailInput = screen.getByLabelText(/Gmail or Google Account Email/i);
    fireEvent.change(emailInput, { target: { value: 'alex.morgan@gmail.com' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In with Gmail/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alex.morgan@gmail.com', 'Alex Morgan');
    });
  });

  it('handles quick preset buttons and triggers one-tap OAuth button', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn();

    render(<GoogleLoginModal isOpen={true} onClose={mockClose} onLogin={mockLogin} />);

    const ownerBtn = screen.getByRole('button', { name: /Account Owner/i });
    fireEvent.click(ownerBtn);

    const emailInput = screen.getByLabelText(/Gmail or Google Account Email/i);
    expect(emailInput).toHaveValue('sivasubramanian86@gmail.com');

    const apacJudgeBtn = screen.getByRole('button', { name: /APAC Judge Account/i });
    fireEvent.click(apacJudgeBtn);
    expect(emailInput).toHaveValue('innovator@googlecloud.apac');

    // Test OAuth one-tap
    const oneTapBtn = screen.getByRole('button', { name: /Fast Google OAuth One-Tap Sign In/i });
    fireEvent.click(oneTapBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('triggers one-tap OAuth with default email and formatted name when inputs are empty', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn();

    render(<GoogleLoginModal isOpen={true} onClose={mockClose} onLogin={mockLogin} />);

    const oneTapBtn = screen.getByRole('button', { name: /Fast Google OAuth One-Tap Sign In/i });
    fireEvent.click(oneTapBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('sivasubramanian86@gmail.com', 'Sivasubramanian86');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('handles submission errors and displays error alert banner', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Firebase network timeout'));
    const mockClose = vi.fn();

    render(
      <GoogleLoginModal
        isOpen={true}
        onClose={mockClose}
        onLogin={mockLogin}
        initialEmail="user@gmail.com"
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In with Gmail/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Firebase network timeout');
    });

    // Test one tap failure
    const oneTapBtn = screen.getByRole('button', { name: /Fast Google OAuth One-Tap Sign In/i });
    fireEvent.click(oneTapBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Firebase network timeout');
    });
  });

  it('handles submission errors without message property and handles one-tap with non-empty email', async () => {
    const mockLogin = vi.fn().mockRejectedValue({});
    const mockClose = vi.fn();

    render(
      <GoogleLoginModal
        isOpen={true}
        onClose={mockClose}
        onLogin={mockLogin}
        initialEmail="custom.pilot@enterprise.com"
        initialDisplayName="Chief Pilot"
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In with Gmail/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to authenticate with Google.');
    });

    // One-tap with existing email and error without message
    const oneTapBtn = screen.getByRole('button', { name: /Fast Google OAuth One-Tap Sign In/i });
    fireEvent.click(oneTapBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Google OAuth prompt failed.');
    });
  });

  it('closes on Escape key press, backdrop click, and close button', () => {
    const mockClose = vi.fn();
    render(<GoogleLoginModal isOpen={true} onClose={mockClose} onLogin={vi.fn()} />);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(1);

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close Google Login modal/i });
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(2);

    // Backdrop click
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(mockClose).toHaveBeenCalledTimes(3);
  });
});
