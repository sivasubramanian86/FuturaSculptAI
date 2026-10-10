import React from 'react';

interface HeaderProps {
  tenantId: string;
  sector: string;
  onOpenOnboard: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenantId,
  sector,
  onOpenOnboard,
  onRefresh,
}) => {
  return (
    <header className="glass-panel header-bar">
      <div className="brand-wrapper">
        <div className="brand-logo" aria-hidden="true">FS</div>
        <div>
          <h1 className="brand-title">FuturaSculptAI</h1>
          <p className="brand-tagline">Predict change. Sculpt work. Create opportunity.</p>
        </div>
      </div>

      <div className="header-controls">
        <span className="badge badge-sector" title="Active Sector Capsule">
          Sector: {sector === 'food_manufacturing' ? 'Food Manufacturing' : sector}
        </span>
        <span className="badge badge-tenant" title="Active Tenant Scope">
          {tenantId}
        </span>
        <span className="badge badge-status" title="System Health">
          <span className="status-dot"></span> Online
        </span>
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          title="Refresh Graph and Scenarios"
          aria-label="Refresh Data"
        >
          ↻ Refresh
        </button>
        <button
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
