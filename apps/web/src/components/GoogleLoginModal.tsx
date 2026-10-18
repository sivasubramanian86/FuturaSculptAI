import React, { useEffect, useState } from 'react';

export interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => Promise<void>;
}

export const formatNameFromEmail = (emailStr: string): string =>
  emailStr.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async (): Promise<void> => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onLogin();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-login-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 8, 18, 0.82)',
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section className="glass-panel" style={{ width: '100%', maxWidth: 460, padding: 32, borderRadius: 24 }}>
        <button type="button" onClick={onClose} aria-label="Close Google Login modal" style={{ float: 'right' }}>✕</button>
        <div style={{ textAlign: 'center', margin: '16px 0 24px' }}>
          <div aria-hidden="true" style={{ fontSize: 38, marginBottom: 12 }}>🌐</div>
          <h3 id="google-login-modal-title" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Sign in with Google
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            Firebase Authentication will verify your Google account before granting API access.
          </p>
        </div>
        {errorMessage && (
          <div role="alert" style={{ color: '#fca5a5', marginBottom: 16, fontSize: 13, background: 'rgba(239, 68, 68, 0.12)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ⚠️ {errorMessage}
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleSignIn()}
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
        >
          {isSubmitting ? 'Signing in…' : 'Continue with Google'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-subtle"
          style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 12, borderRadius: 8 }}
        >
          Explore as Guest (Public Sanctuary Mode)
        </button>
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          🔒 Verified by Firebase Authentication
        </div>
      </section>
    </div>
  );
};
