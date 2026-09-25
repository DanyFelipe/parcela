import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { LotHotspotsLayer } from '@/components/showroom/LotHotspotsLayer';

const baseLots = [
  {
    id: 'lot-1',
    name: 'Lote A-01',
    price: 75000,
    status: 'available' as const,
    surface_area: 500,
  },
  {
    id: 'lot-2',
    name: 'Lote A-02',
    price: 82000,
    status: 'reserved' as const,
    surface_area: 550,
  },
];

const baseHotspots = [
  {
    id: 'hs-1',
    lot_id: 'lot-1',
    view_id: 'top' as const,
    hotspot_x: 25,
    hotspot_y: 30,
  },
  {
    id: 'hs-2',
    lot_id: 'lot-2',
    view_id: 'top' as const,
    hotspot_x: 75,
    hotspot_y: 60,
  },
];

describe('LotHotspotsLayer', () => {
  const onHotspotClick = vi.fn();

  afterEach(() => {
    document.body.innerHTML = '';
    onHotspotClick.mockReset();
  });

  it('renders hotspots for matching lots', () => {
    render(
      <LotHotspotsLayer
        lots={baseLots}
        lotHotspots={baseHotspots}
        fadingOut={false}
        onHotspotClick={onHotspotClick}
      />
    );

    expect(screen.getAllByTestId('lot-hotspot')).toHaveLength(2);
  });

  it('skips hotspots whose lot is missing', () => {
    render(
      <LotHotspotsLayer
        lots={[baseLots[0]]}
        lotHotspots={baseHotspots}
        fadingOut={false}
        onHotspotClick={onHotspotClick}
      />
    );

    expect(screen.getAllByTestId('lot-hotspot')).toHaveLength(1);
  });

  it('is fully opaque when not fading out', () => {
    const { container } = render(
      <LotHotspotsLayer
        lots={baseLots}
        lotHotspots={baseHotspots}
        fadingOut={false}
        onHotspotClick={onHotspotClick}
      />
    );

    expect(container.firstChild).toHaveClass('opacity-100');
    expect(container.firstChild).not.toHaveClass('opacity-0');
  });

  it('fades out and hides from accessibility tree when fadingOut is true', () => {
    const { container } = render(
      <LotHotspotsLayer
        lots={baseLots}
        lotHotspots={baseHotspots}
        fadingOut
        onHotspotClick={onHotspotClick}
      />
    );

    expect(container.firstChild).toHaveClass('opacity-0');
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
