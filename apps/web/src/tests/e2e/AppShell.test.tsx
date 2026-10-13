import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppShell } from '../../components/AppShell';
import { getTranslations } from '../../i18n';

describe('AppShell Component', () => {
  const i18n = getTranslations('en');

  it('renders topbar, sidebar items, and toggles collapse state', () => {
    const onTabChange = vi.fn();
    const onChangeLang = vi.fn();
    const onToggleMode = vi.fn();
    const onBootstrap = vi.fn();
    const onRefresh = vi.fn();

    render(
      <AppShell
        activeTab="overview"
        onTabChange={onTabChange}
        currentLanguage="en"
        onChangeLanguage={onChangeLang}
        isCitizenMode={true}
        onToggleCitizenMode={onToggleMode}
        tenantId="tenant-food-mfg-01"
        sector="food_manufacturing"
        trustScore={94.3}
        onOpenOnboard={onBootstrap}
        onRefresh={onRefresh}
        i18n={i18n}
      >
        <div data-testid="child-content">Main View Content</div>
      </AppShell>
    );

    expect(screen.getByText('Main View Content')).toBeInTheDocument();
    expect(screen.getAllByText(/FuturaSculptAI/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Trust Score: 94.3/i)).toBeInTheDocument();

    // Toggle sidebar
    const toggleBtn = screen.getByTitle('Toggle Sidebar');
    fireEvent.click(toggleBtn);

    // Switch tab
    const taskSculptorNav = screen.getByTitle(/Task Sculptor/i);
    fireEvent.click(taskSculptorNav);
    expect(onTabChange).toHaveBeenCalledWith('task_sculptor');

    // Toggle persona mode
    const personaBtn = screen.getByRole('button', { name: /Citizen \/ Worker View/i });
    fireEvent.click(personaBtn);
    expect(onToggleMode).toHaveBeenCalledWith(false);

    // Switch language
    const langSelect = screen.getByLabelText(/Select Interface Language/i);
    fireEvent.change(langSelect, { target: { value: 'ta' } });
    expect(onChangeLang).toHaveBeenCalledWith('ta');

    // Switch IAM Persona
    const personaSelect = screen.getByLabelText(/Select IAM Persona/i);
    expect(personaSelect).toBeInTheDocument();
    fireEvent.change(personaSelect, { target: { value: 'investor' } });

    // Click refresh
    const refreshBtn = screen.getByTitle('Refresh Data');
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();

    // Click bootstrap
    const bootstrapBtn = screen.getByRole('button', { name: /Bootstrap/i });
    fireEvent.click(bootstrapBtn);
    expect(onBootstrap).toHaveBeenCalled();
  });

  it('handles guided tour launch and industry sector selection', () => {
    const onOpenTour = vi.fn();
    const onSelectSector = vi.fn();

    render(
      <AppShell
        activeTab="overview"
        onTabChange={vi.fn()}
        currentLanguage="en"
        onChangeLanguage={vi.fn()}
        isCitizenMode={true}
        onToggleCitizenMode={vi.fn()}
        tenantId="tenant-food-mfg-01"
        sector="food_manufacturing"
        onOpenOnboard={vi.fn()}
        onRefresh={vi.fn()}
        onOpenTour={onOpenTour}
        onSelectSector={onSelectSector}
        i18n={i18n}
      >
        <div>Content</div>
      </AppShell>
    );

    const tourBtn = screen.getByTitle('Launch Guided Tour');
    expect(tourBtn).toBeInTheDocument();
    fireEvent.click(tourBtn);
    expect(onOpenTour).toHaveBeenCalledTimes(1);

    const sectorSelect = screen.getByLabelText('Select Industry Simulation Sector');
    expect(sectorSelect).toBeInTheDocument();
    fireEvent.change(sectorSelect, { target: { value: 'automotive_manufacturing' } });
    expect(onSelectSector).toHaveBeenCalledWith('automotive_manufacturing');
  });

  it('renders enterprise architect mode, handles brand click, and navigates across all categories', () => {
    const onTabChange = vi.fn();
    const onToggleMode = vi.fn();

    render(
      <AppShell
        activeTab="overview"
        onTabChange={onTabChange}
        currentLanguage="en"
        onChangeLanguage={vi.fn()}
        isCitizenMode={false}
        onToggleCitizenMode={onToggleMode}
        tenantId="tenant-food-mfg-01"
        sector="food_manufacturing"
        onOpenOnboard={vi.fn()}
        onRefresh={vi.fn()}
        i18n={i18n}
      >
        <div>Content</div>
      </AppShell>
    );

    // Verify architect mode pill
    expect(screen.getByRole('button', { name: /Enterprise Architect View/i })).toBeInTheDocument();

    // Click brand logo to trigger onTabChange('overview')
    const brandLogo = screen.getByText('FuturaSculptAI');
    fireEvent.click(brandLogo);
    expect(onTabChange).toHaveBeenCalledWith('overview');

    // Click category items
    fireEvent.click(screen.getByTitle(/MultiModal Studio/i));
    expect(onTabChange).toHaveBeenCalledWith('multimodal');

    fireEvent.click(screen.getByTitle(/Governance TrustBoard/i));
    expect(onTabChange).toHaveBeenCalledWith('governance');

    fireEvent.click(screen.getByTitle(/FAQ & Help/i));
    expect(onTabChange).toHaveBeenCalledWith('faq_help');
  });

  it('handles Google login and sign-out actions', () => {
    const onGoogleSignIn = vi.fn();
    const onGoogleSignOut = vi.fn();

    const { rerender } = render(
      <AppShell
        activeTab="overview"
        onTabChange={vi.fn()}
        currentLanguage="en"
        onChangeLanguage={vi.fn()}
        isCitizenMode={true}
        onToggleCitizenMode={vi.fn()}
        onOpenOnboard={vi.fn()}
        onRefresh={vi.fn()}
        onGoogleSignIn={onGoogleSignIn}
        onGoogleSignOut={onGoogleSignOut}
        i18n={i18n}
      >
        <div>Content</div>
      </AppShell>
    );

    const loginBtn = screen.getByRole('button', { name: /Google Login/i });
    fireEvent.click(loginBtn);
    expect(onGoogleSignIn).toHaveBeenCalledTimes(1);

    rerender(
      <AppShell
        activeTab="overview"
        onTabChange={vi.fn()}
        currentLanguage="en"
        onChangeLanguage={vi.fn()}
        isCitizenMode={true}
        onToggleCitizenMode={vi.fn()}
        onOpenOnboard={vi.fn()}
        onRefresh={vi.fn()}
        googleUser={{ displayName: 'Dr. Siva', email: 'siva@example.com' }}
        onGoogleSignIn={onGoogleSignIn}
        onGoogleSignOut={onGoogleSignOut}
        i18n={i18n}
      >
        <div>Content</div>
      </AppShell>
    );

    expect(screen.getByText('Dr. Siva')).toBeInTheDocument();
    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);
    expect(onGoogleSignOut).toHaveBeenCalledTimes(1);
  });
});

