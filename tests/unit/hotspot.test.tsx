import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { Hotspot } from '@/components/showroom/Hotspot';
import { useShowroomStore } from '@/lib/store/showroom.store';

const baseLot = {
  id: 'lot-1',
  name: 'Lote A-01',
  price: 75000,
  status: 'available' as const,
  surface_area: 500,
};

const baseHotspot = {
  id: 'hs-1',
  lot_id: 'lot-1',
  view_id: 'top' as const,
  hotspot_x: 35,
  hotspot_y: 60,
};

describe('Hotspot', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    useShowroomStore.setState({
      currentView: 'top',
      selectedLotId: null,
      transitionInProgress: false,
    });
    onClick.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders at the given percentage coordinates', () => {
    const { container } = render(<Hotspot lot={baseLot} hotspot={baseHotspot} onClick={onClick} />);

    const button = container.querySelector('button');
    expect(button).toHaveStyle({ left: '35%', top: '60%' });
  });

  it('calls onClick with the lot id when clicked', () => {
    render(<Hotspot lot={baseLot} hotspot={baseHotspot} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle de Lote A-01' }));

    expect(onClick).toHaveBeenCalledWith('lot-1');
  });

  it('is keyboard accessible', () => {
    render(<Hotspot lot={baseLot} hotspot={baseHotspot} onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Ver detalle de Lote A-01' });
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledWith('lot-1');
  });

  it('shows the lot name on hover/focus', () => {
    render(<Hotspot lot={baseLot} hotspot={baseHotspot} onClick={onClick} />);

    expect(screen.getByText('Lote A-01')).toBeInTheDocument();
  });

  it.each([
    { status: 'available' as const, expectedColor: 'bg-emerald-500' },
    { status: 'reserved' as const, expectedColor: 'bg-amber-500' },
    { status: 'sold' as const, expectedColor: 'bg-rose-500' },
  ])('applies a color class for status "$status"', ({ status, expectedColor }) => {
    const lot = { ...baseLot, status };
    const { container } = render(<Hotspot lot={lot} hotspot={baseHotspot} onClick={onClick} />);

    expect(container.querySelector(`.${expectedColor}`)).toBeInTheDocument();
  });
});
