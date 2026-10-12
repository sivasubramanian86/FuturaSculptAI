import React, { useState } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, TranslationKeys } from '../i18n';
import { PERSONA_PROFILES, UserRole } from '../services/firebase';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  category: 'core' | 'media' | 'trust' | 'system';
  badge?: string;
}

interface AppShellProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  currentLanguage: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isCitizenMode: boolean;
  onToggleCitizenMode: (mode: boolean) => void;
  tenantId: string;
  sector: string;
  trustScore?: number;
  onOpenOnboard: () => void;
  onRefresh: () => void;
  i18n: TranslationKeys;
  currentRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
  onOpenTour?: () => void;
  onSelectSector?: (sector: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  currentLanguage,
  onChangeLanguage,
  isCitizenMode,
  onToggleCitizenMode,
  sector,
  trustScore = 94.3,
  onOpenOnboard,
  onRefresh,
  i18n,
  currentRole = 'citizen_worker',
  onSelectRole,
  onOpenTour,
  onSelectSector,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const navItems: NavItem[] = [
    // Core Transformation
    { id: 'overview', label: i18n.navOverview, icon: '🏠', category: 'core' },
    { id: 'task_sculptor', label: i18n.navTaskSculptor, icon: '🧬', category: 'core' },
    { id: 'opportunity', label: i18n.navOpportunity, icon: '🚀', category: 'core' },
    { id: 'workgraph', label: i18n.navWorkGraph, icon: '🌐', category: 'core' },

    // Intelligence & Media
    { id: 'multimodal', label: i18n.navMultimodal, icon: '👁️', category: 'media' },
    { id: 'agent_swarm', label: i18n.navAgentSwarm, icon: '🤖', category: 'media' },

    // Governance & Trust
    { id: 'governance', label: i18n.navGovernance, icon: '🛡️', category: 'trust' },
    { id: 'evidence', label: i18n.navEvidence, icon: '📁', category: 'trust' },

    // Platform & Help
    { id: 'faq_help', label: i18n.navFaqHelp, icon: '❓', category: 'system' },
    { id: 'about', label: i18n.navAbout, icon: 'ℹ️', category: 'system' },
    { id: 'settings', label: i18n.navSettings, icon: '⚙️', category: 'system' },
  ];

  return (
    <div className={`app-shell-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Top Navigation Bar */}
      <header className="app-topbar glass-panel" role="banner">
        <div className="brand-header-area" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            title="Toggle Sidebar"
            style={{ flexShrink: 0 }}
          >
            ☰
          </button>

          <div
            className="brand-identity"
            onClick={() => onTabChange('overview')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            <div
              className="brand-orb-icon"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 50%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                animation: 'logo-shimmer 6s infinite ease-in-out',
                flexShrink: 0,
              }}
            >
              🔮
            </div>
            <div className="brand-text-block" style={{ display: 'flex', flexDirection: 'column', minWidth: 'max-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {i18n.brandName}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  SANCTUARY
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '1px' }}>
                Future Work & Transformation Operating System
              </div>
            </div>
          </div>
        </div>

        {/* Topbar Right Controls Track with Mobile Touch Scroll */}
        <div className="topbar-controls-track" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
          {/* Persona View Mode Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleCitizenMode(!isCitizenMode)}
            className="btn-subtle"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isCitizenMode ? 'rgba(6, 182, 212, 0.18)' : 'rgba(99, 102, 241, 0.18)',
              borderColor: isCitizenMode ? 'var(--accent-cyan)' : 'var(--accent-indigo)',
              color: isCitizenMode ? 'var(--accent-cyan)' : 'var(--text-primary)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span>{isCitizenMode ? '👤' : '🏢'}</span>
            <span>{isCitizenMode ? i18n.citizenMode : i18n.architectMode}</span>
          </button>

          {/* Industry Simulation Sector Switcher */}
          <div style={{ position: 'relative' }}>
            <select
              aria-label="Select Industry Simulation Sector"
              value={sector}
              onChange={(e) => onSelectSector?.(e.target.value)}
              className="select-custom"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                borderRadius: '9999px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              <option value="food_manufacturing">🍞 Food Manufacturing</option>
              <option value="automotive_manufacturing">🚗 Automotive EV</option>
              <option value="healthcare">🏥 Healthcare Clinical</option>
              <option value="advanced_manufacturing">⚙️ Precision Robotics</option>
              <option value="banking">💳 FinTech & UPI Payments</option>
              <option value="mobility_autonomous">🚖 Uber / Ola Autonomous Fleet</option>
              <option value="cinema_creative">🎬 Cinema & Creative Arts</option>
            </select>
          </div>

          {/* One-Click Interactive Guided Tour Button */}
          <button
            type="button"
            onClick={onOpenTour}
            className="btn-tour-pill"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(99, 102, 241, 0.4) 100%)',
              border: '1px solid var(--accent-cyan)',
              color: '#fff',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Launch Guided Tour"
          >
            <span>🚀</span>
            <span>Guided Tour</span>
          </button>
          <div style={{ position: 'relative' }}>
            <select
              aria-label="Select IAM Persona"
              value={currentRole}
              onChange={(e) => onSelectRole?.(e.target.value as UserRole)}
              className="select-custom"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                borderRadius: '9999px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {Object.values(PERSONA_PROFILES).map((persona) => (
                <option key={persona.role} value={persona.role}>
                  {persona.avatar} {persona.displayName} ({persona.title.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              aria-label="Select Interface Language"
              value={currentLanguage}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="select-custom"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                borderRadius: '9999px',
                background: 'rgba(15, 23, 42, 0.85)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Live Trust Score Pill */}
          <div
            className="badge badge-emerald"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span>{i18n.trustScore}: {trustScore}</span>
          </div>

          {/* Org Bootstrap Button */}
          <button
            type="button"
            onClick={onOpenOnboard}
            className="btn-subtle"
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '9999px' }}
          >
            ⚡ {i18n.onboardOrg}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="btn-subtle"
            style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '9999px' }}
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            🔄
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="app-shell-body">
        {/* Navigation Sidebar */}
        <aside
          className="app-sidebar glass-panel"
          role="navigation"
          aria-label="Primary Navigation"
        >
          <div className="sidebar-nav-scroll">
            {/* Category: Core */}
            {!isSidebarCollapsed && <div className="nav-group-label">{i18n.navCatCore}</div>}
            {navItems
              .filter((item) => item.category === 'core')
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isSidebarCollapsed && item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              ))}

            {/* Category: Intelligence & Media */}
            {!isSidebarCollapsed && <div className="nav-group-label">{i18n.navCatMedia}</div>}
            {navItems
              .filter((item) => item.category === 'media')
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isSidebarCollapsed && item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              ))}

            {/* Category: Governance & Trust */}
            {!isSidebarCollapsed && <div className="nav-group-label">{i18n.navCatTrust}</div>}
            {navItems
              .filter((item) => item.category === 'trust')
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isSidebarCollapsed && item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              ))}

            {/* Category: System & Help */}
            {!isSidebarCollapsed && <div className="nav-group-label">{i18n.navCatSystem}</div>}
            {navItems
              .filter((item) => item.category === 'system')
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              ))}
          </div>

          {!isSidebarCollapsed && (
            <div className="sidebar-footer">
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                FuturaSculptAI v1.0.0
              </div>
              <div style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>
                Google Cloud APAC 2026
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main id="main-content" className="app-main-content" role="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};
