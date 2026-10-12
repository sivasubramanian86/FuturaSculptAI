import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsStudio } from '../components/SettingsStudio';
import { getTranslations } from '../i18n';

describe('SettingsStudio Component', () => {
  const i18n = getTranslations('en');

  it('renders settings options and responds to user modifications', () => {
    vi.useFakeTimers();
    const onChangeLang = vi.fn();
    const onToggleMode = vi.fn();
    const onChangeTenant = vi.fn();
    const onChangeSector = vi.fn();

    render(
      <SettingsStudio
        currentLanguage="en"
        onChangeLanguage={onChangeLang}
        isCitizenMode={true}
        onToggleCitizenMode={onToggleMode}
        tenantId="tenant-food-mfg-01"
        onChangeTenant={onChangeTenant}
        sector="food_manufacturing"
        onChangeSector={onChangeSector}
        i18n={i18n}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: /Studio Settings & Preferences/i })).toBeInTheDocument();

    // Select language
    const tamilBtn = screen.getByRole('button', { name: /தமிழ்/i });
    fireEvent.click(tamilBtn);
    expect(onChangeLang).toHaveBeenCalledWith('ta');

    // Toggle persona mode
    const architectBtn = screen.getByRole('button', { name: /Enterprise Architect View/i });
    fireEvent.click(architectBtn);
    expect(onToggleMode).toHaveBeenCalledWith(false);

    const citizenBtn = screen.getByRole('button', { name: /Citizen \/ Worker View/i });
    fireEvent.click(citizenBtn);
    expect(onToggleMode).toHaveBeenCalledWith(true);

    // Tenant select
    const tenantSelect = screen.getByLabelText(/Enterprise Tenant Select/i);
    fireEvent.change(tenantSelect, { target: { value: 'tenant-health-01' } });
    expect(onChangeTenant).toHaveBeenCalledWith('tenant-health-01');

    // Sector select
    const sectorSelect = screen.getByLabelText(/Industry Sector Select/i);
    fireEvent.change(sectorSelect, { target: { value: 'healthcare' } });
    expect(onChangeSector).toHaveBeenCalledWith('healthcare');

    // Model inputs
    const flashInput = screen.getByLabelText(/Flash Model Input/i);
    fireEvent.change(flashInput, { target: { value: 'gemini-2.5-flash-custom' } });

    const proInput = screen.getByLabelText(/Pro Model Input/i);
    fireEvent.change(proInput, { target: { value: 'gemini-2.5-pro-custom' } });

    const thinkInput = screen.getByLabelText(/Thinking Model Input/i);
    fireEvent.change(thinkInput, { target: { value: 'gemini-2.5-thinking-custom' } });

    // Save preferences
    const saveBtn = screen.getByRole('button', { name: /Save Preferences/i });
    fireEvent.click(saveBtn);
    expect(screen.getByText(/Preferences saved successfully/i)).toBeInTheDocument();

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('renders correctly when enterprise architect view is initial mode', () => {
    render(
      <SettingsStudio
        currentLanguage="en"
        onChangeLanguage={vi.fn()}
        isCitizenMode={false}
        onToggleCitizenMode={vi.fn()}
        tenantId="tenant-bank-01"
        onChangeTenant={vi.fn()}
        sector="financial_services"
        onChangeSector={vi.fn()}
        i18n={i18n}
      />
    );

    expect(screen.getAllByText(/Enterprise Architect View/i).length).toBeGreaterThanOrEqual(1);
  });
});
