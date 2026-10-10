import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Header } from './Header';

describe('Header Component', () => {
  it('renders branding, tenant, and food manufacturing sector title', () => {
    const onOpen = vi.fn();
    const onRefresh = vi.fn();

    render(
      <Header
        tenantId="tenant-food-mfg-01"
        sector="food_manufacturing"
        onOpenOnboard={onOpen}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
    expect(screen.getByText(/Sector: Food Manufacturing/i)).toBeInTheDocument();
    expect(screen.getByText('tenant-food-mfg-01')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders custom sector without formatting and triggers actions', () => {
    const onOpen = vi.fn();
    const onRefresh = vi.fn();

    render(
      <Header
        tenantId="tenant-healthcare-02"
        sector="healthcare"
        onOpenOnboard={onOpen}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText(/Sector: healthcare/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: /Refresh Data/i });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const onboardBtn = screen.getByRole('button', { name: /Onboard Organization/i });
    fireEvent.click(onboardBtn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
