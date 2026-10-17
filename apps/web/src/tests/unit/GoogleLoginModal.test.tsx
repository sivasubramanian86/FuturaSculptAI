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
});
