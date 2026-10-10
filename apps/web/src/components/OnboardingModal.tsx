import React, { useState } from 'react';
import { OnboardingPayload } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="glass-panel modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            🚀 Onboard Enterprise Transformation
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ORGANIZATION NAME</label>
            <input
              className="form-input"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">INDUSTRY SECTOR</label>
              <select
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
              <label className="form-label">WORKFORCE HEADCOUNT</label>
              <input
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
            <label className="form-label">PRIMARY STRATEGIC TRANSFORMATION GOAL</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">LEAD TRANSFORMATION CONTACT EMAIL</label>
            <input
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
