import React, { useState } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, TranslationKeys } from '../i18n';

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
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const navItems: NavItem[] = [
    // Core Transformation
    { id: 'overview', label: i18n.navOverview, icon: '🏠', category: 'core', badge: 'CITIZEN' },
    { id: 'task_sculptor', label: i18n.navTaskSculptor, icon: '🧬', category: 'core', badge: '6-TAX' },
    { id: 'opportunity', label: i18n.navOpportunity, icon: '🚀', category: 'core', badge: 'k>=10' },
    { id: 'workgraph', label: i18n.navWorkGraph, icon: '🌐', category: 'core' },

    // Intelligence & Media
    { id: 'multimodal', label: i18n.navMultimodal, icon: '👁️', category: 'media', badge: 'GEMINI' },
    { id: 'agent_swarm', label: i18n.navAgentSwarm, icon: '🤖', category: 'media', badge: '9-ADK' },

    // Governance & Trust
    { id: 'governance', label: i18n.navGovernance, icon: '🛡️', category: 'trust', badge: 'SAIF' },
    { id: 'evidence', label: i18n.navEvidence, icon: '📁', category: 'trust', badge: 'SHA-256' },

    // Platform & Help
    { id: 'faq_help', label: i18n.navFaqHelp, icon: '❓', category: 'system' },
    { id: 'about', label: i18n.navAbout, icon: 'ℹ️', category: 'system' },
    { id: 'settings', label: i18n.navSettings, icon: '⚙️', category: 'system' },
  ];

  return (
    <div className={`app-shell-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Top Navigation Bar */}
      <header className="app-topbar glass-panel" role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            title="Toggle Sidebar"
          >
            ☰
          </button>

          <div
            className="brand-logo"
            onClick={() => onTabChange('overview')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              F
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {i18n.brandName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {sector.replace('_', ' ').toUpperCase()} • GOOGLE CLOUD
              </div>
            </div>
          </div>
        </div>

        {/* Topbar Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Persona View Mode Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleCitizenMode(!isCitizenMode)}
            className="btn-subtle"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isCitizenMode ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              borderColor: isCitizenMode ? 'var(--accent-cyan)' : 'var(--accent-indigo)',
              color: isCitizenMode ? 'var(--accent-cyan)' : 'var(--text-primary)',
            }}
          >
            <span>{isCitizenMode ? '👤' : '🏢'}</span>
            <span>{isCitizenMode ? i18n.citizenMode : i18n.architectMode}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              aria-label="Select Interface Language"
              value={currentLanguage}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              className="select-custom"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
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
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '20px',
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
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            ⚡ {i18n.onboardOrg}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="btn-subtle"
            style={{ padding: '6px 10px', fontSize: '12px' }}
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
