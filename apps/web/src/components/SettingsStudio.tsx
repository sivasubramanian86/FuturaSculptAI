import React, { useState } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, TranslationKeys } from '../i18n';

interface SettingsStudioProps {
  currentLanguage: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isCitizenMode: boolean;
  onToggleCitizenMode: (mode: boolean) => void;
  tenantId: string;
  onChangeTenant: (tenant: string) => void;
  sector: string;
  onChangeSector: (sector: string) => void;
  i18n: TranslationKeys;
}

export const SettingsStudio: React.FC<SettingsStudioProps> = ({
  currentLanguage,
  onChangeLanguage,
  isCitizenMode,
  onToggleCitizenMode,
  tenantId,
  onChangeTenant,
  sector,
  onChangeSector,
  i18n,
}) => {
  const [modelFlash, setModelFlash] = useState<string>('gemini-2.5-flash');
  const [modelPro, setModelPro] = useState<string>('gemini-2.5-pro');
  const [modelThinking, setModelThinking] = useState<string>('gemini-2.5-thinking');
  const [showToast, setShowToast] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="settings-container glass-panel panel-card" style={{ padding: '32px' }} aria-label="Studio Settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚙️</span>
            <span>{i18n.settingsTitle}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {i18n.settingsDesc}
          </p>
        </div>
        {showToast && (
          <div
            className="badge badge-emerald"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '20px' }}
          >
            ✓ {i18n.settingsSavedToast}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Global Language (i18n) */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            🌐 {i18n.languageSection}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Select your preferred interface language. Supports 22 global and Indian regional languages:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onChangeLanguage(lang.code)}
                className={`btn-subtle ${currentLanguage === lang.code ? 'active' : ''}`}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: currentLanguage === lang.code ? 'var(--accent-indigo)' : 'var(--border-subtle)',
                  background: currentLanguage === lang.code ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Persona Interface Mode */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            👤 {i18n.appearanceSection}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Toggle between non-technical citizen/worker view and advanced enterprise architect view:
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="button"
              onClick={() => onToggleCitizenMode(true)}
              className={`btn-subtle ${isCitizenMode ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '14px',
                textAlign: 'left',
                borderRadius: '8px',
                background: isCitizenMode ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                borderColor: isCitizenMode ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                👥 Citizen / Worker View
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Friendly, empathetic explanations, career opportunity pathways, and rights protection.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onToggleCitizenMode(false)}
              className={`btn-subtle ${!isCitizenMode ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '14px',
                textAlign: 'left',
                borderRadius: '8px',
                background: !isCitizenMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                borderColor: !isCitizenMode ? 'var(--accent-indigo)' : 'var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                🏢 Enterprise Architect View
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Full C4 container topologies, NetworkX blast radius, SAIF controls, and FinOps models.
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Enterprise Tenant & Sector */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              🏢 Enterprise Tenant ID:
            </label>
            <select
              value={tenantId}
              onChange={(e) => onChangeTenant(e.target.value)}
              className="select-custom"
              aria-label="Enterprise Tenant Select"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <option value="tenant-food-mfg-01">Apex Food Manufacturing (Packaging Line 4)</option>
              <option value="tenant-health-01">Metropolitan Hospital (ICU Clinical Handoff)</option>
              <option value="tenant-bank-01">Apex Global Bank (Level-2 AML Triage)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              🏭 Industry Sector:
            </label>
            <select
              value={sector}
              onChange={(e) => onChangeSector(e.target.value)}
              className="select-custom"
              aria-label="Industry Sector Select"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <option value="food_manufacturing">Food Manufacturing & Packaging</option>
              <option value="healthcare">Healthcare & Clinical Operations</option>
              <option value="financial_services">Financial Services & Compliance</option>
            </select>
          </div>
        </div>

        {/* Section 4: Vertex AI Model Gateway */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            🤖 {i18n.aiModelSection}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Routing tiers for Google Agent Development Kit swarm:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Flash Tier (80% Routing):</label>
              <input
                type="text"
                aria-label="Flash Model Input"
                value={modelFlash}
                onChange={(e) => setModelFlash(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pro Tier (Complex Reasoning):</label>
              <input
                type="text"
                aria-label="Pro Model Input"
                value={modelPro}
                onChange={(e) => setModelPro(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thinking Tier (Critic Defense):</label>
              <input
                type="text"
                aria-label="Thinking Model Input"
                value={modelThinking}
                onChange={(e) => setModelThinking(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '12px 24px', alignSelf: 'flex-start' }}>
          ✓ {i18n.saveSettingsBtn}
        </button>
      </form>
    </div>
  );
};
