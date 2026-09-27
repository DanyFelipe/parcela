import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { FeatureHotspot } from '@/components/showroom/FeatureHotspot';

const baseFeature = {
  id: 'fs-1',
  view_id: 'front' as const,
  type: 'sales_office' as const,
  action: 'show_info' as const,
  target_view_id: null,
  title: 'Caseta de ventas',
  description: 'Atención personalizada.',
  icon: 'home',
  hotspot_x: 30,
  hotspot_y: 60,
};

describe('FeatureHotspot', () => {
  const onNavigate = vi.fn();
  const onShowInfo = vi.fn();

  afterEach(() => {
    document.body.innerHTML = '';
    onNavigate.mockReset();
    onShowInfo.mockReset();
  });

  it('renders at the given percentage coordinates', () => {
    const { container } = render(
      <FeatureHotspot feature={baseFeature} onNavigate={onNavigate} onShowInfo={onShowInfo} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveStyle({ left: '30%', top: '60%' });
  });

  it('dispatches show_info action by opening the info panel', () => {
    render(
      <FeatureHotspot feature={baseFeature} onNavigate={onNavigate} onShowInfo={onShowInfo} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));

    expect(onShowInfo).toHaveBeenCalledWith(baseFeature);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('dispatches navigate_to_view action by requesting a transition', () => {
    const navigateFeature = {
      ...baseFeature,
      type: 'lots_overview' as const,
      action: 'navigate_to_view' as const,
      target_view_id: 'top' as const,
      icon: 'layout-grid' as const,
    };

    render(
      <FeatureHotspot feature={navigateFeature} onNavigate={onNavigate} onShowInfo={onShowInfo} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));

    expect(onNavigate).toHaveBeenCalledWith('top');
    expect(onShowInfo).not.toHaveBeenCalled();
  });

  it('falls back to show_info when navigate_to_view lacks a target view', () => {
    const incompleteFeature = {
      ...baseFeature,
      type: 'lots_overview' as const,
      action: 'navigate_to_view' as const,
      target_view_id: null,
    };

    render(
      <FeatureHotspot feature={incompleteFeature} onNavigate={onNavigate} onShowInfo={onShowInfo} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));

    expect(onShowInfo).toHaveBeenCalledWith(incompleteFeature);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
