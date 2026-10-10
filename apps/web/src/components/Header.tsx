/**
 * Header component for FuturaSculptAI Enterprise Cockpit.
 * Renders brand identity, tenant & sector telemetry capsules, and global actions.
 * Conforms to WCAG 2.1 AA with role="banner" and accessible button labels.
 */

import React from 'react';

export interface HeaderProps {
  /** Active tenant identifier (e.g. tenant-food-mfg-01). */
  tenantId: string;
  /** Active enterprise industry sector. */
  sector: string;
  /** Callback opening enterprise onboarding modal. */
  onOpenOnboard: () => void;
  /** Callback triggering data refresh across all cockpit services. */
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenantId,
  sector,
  onOpenOnboard,
  onRefresh,
}) => {
  return (
    <header className="glass-panel header-bar" role="banner">
      <div className="brand-wrapper">
        <div className="brand-logo" aria-hidden="true">FS</div>
        <div>
          <h1 className="brand-title">FuturaSculptAI</h1>
          <p className="brand-tagline">Predict change. Sculpt work. Create opportunity.</p>
        </div>
      </div>

      <div className="header-controls">
        <span className="badge badge-sector" title="Active Sector Capsule" aria-label={`Sector: ${sector}`}>
          Sector: {sector === 'food_manufacturing' ? 'Food Manufacturing' : sector}
        </span>
        <span className="badge badge-tenant" title="Active Tenant Scope" aria-label={`Tenant: ${tenantId}`}>
          {tenantId}
        </span>
        <span className="badge badge-status" title="System Health" aria-label="System status: Online">
          <span className="status-dot" aria-hidden="true"></span> Online
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          title="Refresh Graph and Scenarios"
          aria-label="Refresh Data"
        >
          ↻ Refresh
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenOnboard}
          title="Onboard New Enterprise Workspace"
          aria-label="Onboard Organization"
        >
          + Onboard Organization
        </button>
      </div>
    </header>
  );
};
