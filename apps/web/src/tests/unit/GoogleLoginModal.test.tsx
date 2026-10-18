import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GoogleLoginModal, formatNameFromEmail } from '../../components/GoogleLoginModal';

describe('GoogleLoginModal', () => {
  it('stays hidden when closed', () => {
    render(<GoogleLoginModal isOpen={false} onClose={vi.fn()} onLogin={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts verified Google sign-in and closes after success', async () => {
    const onClose = vi.fn();
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<GoogleLoginModal isOpen onClose={onClose} onLogin={onLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows Firebase sign-in errors', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Popup blocked'));
    render(<GoogleLoginModal isOpen onClose={vi.fn()} onLogin={onLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Popup blocked');
  });

  it('formats a fallback display name', () => {
    expect(formatNameFromEmail('maya.lin@example.com')).toBe('Maya Lin');
  });

  it('closes on escape key, backdrop click, close button, and guest exploration button', () => {
    const onClose = vi.fn();
    const { rerender } = render(<GoogleLoginModal isOpen onClose={onClose} onLogin={vi.fn()} />);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Click backdrop
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(2);

    // Click Close ✕ button
    fireEvent.click(screen.getByRole('button', { name: 'Close Google Login modal' }));
    expect(onClose).toHaveBeenCalledTimes(3);

    // Click Explore as Guest
    fireEvent.click(screen.getByRole('button', { name: 'Explore as Guest (Public Sanctuary Mode)' }));
    expect(onClose).toHaveBeenCalledTimes(4);

    // Ignore other keys
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(4);

    // Unmount cleans up listener
    rerender(<GoogleLoginModal isOpen={false} onClose={onClose} onLogin={vi.fn()} />);
  });

  it('handles non-Error rejection during sign-in', async () => {
    const onLogin = vi.fn().mockRejectedValue('unknown string rejection');
    render(<GoogleLoginModal isOpen onClose={vi.fn()} onLogin={onLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Google sign-in failed.');
  });
});

