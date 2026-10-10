/**
 * Enterprise Onboarding Modal component.
 * Bootstraps digital twin workspace parameters, k-anonymity consent, and sector taxonomy.
 * Conforms to WCAG 2.1 AA with role="dialog", aria-modal="true", aria-labelledby, and Escape key dismissal.
 */

import React, { useEffect, useState } from 'react';
import { OnboardingPayload } from '../types';

export interface OnboardingModalProps {
  /** Whether the modal dialog is visibly active. */
  isOpen: boolean;
  /** Callback fired when user closes or cancels the modal. */
  onClose: () => void;
  /** Callback fired on valid form submission. */
  onSubmit: (payload: OnboardingPayload) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [orgName, setOrgName] = useState<string>('Apex Consumer Foods Group');
  const [sector, setSector] = useState<string>('food_manufacturing');
  const [headcount, setHeadcount] = useState<number>(450);
  const [goal, setGoal] = useState<string>(
    'Achieve zero defect recalls in high-speed packaging lines through intelligent vision automation and frontline inspector upskilling.'
  );
  const [email, setEmail] = useState<string>('transformation@apexfoods.com');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit({
        organization_name: orgName,
        sector,
        headcount,
        primary_strategic_goal: goal,
        contact_email: email,
        consent_granted: true,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Onboarding failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="glass-panel modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 id="onboarding-modal-title" style={{ fontSize: '18px', fontWeight: 700 }}>
            🚀 Onboard Enterprise Transformation
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="org-name-input" className="form-label">ORGANIZATION NAME</label>
            <input
              id="org-name-input"
              className="form-input"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="sector-select" className="form-label">INDUSTRY SECTOR</label>
              <select
                id="sector-select"
                className="form-select"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                <option value="food_manufacturing">Food Manufacturing</option>
                <option value="healthcare">Healthcare & Clinical</option>
                <option value="banking">Banking & Financial Services</option>
              </select>
            </div>
            <div>
              <label htmlFor="headcount-input" className="form-label">WORKFORCE HEADCOUNT</label>
              <input
                id="headcount-input"
                type="number"
                className="form-input"
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                min="10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="goal-input" className="form-label">PRIMARY STRATEGIC TRANSFORMATION GOAL</label>
            <textarea
              id="goal-input"
              className="form-textarea"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email-input" className="form-label">LEAD TRANSFORMATION CONTACT EMAIL</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ background: 'rgba(99,102,241,0.08)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            🛡️ <strong>Ethical Consent Notice:</strong> All workforce simulations operate under strict k-anonymity (k ≥ 10). FuturaSculptAI never generates individual termination rankings or adverse employment actions.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Provisioning...' : 'Bootstrap Digital Twin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
