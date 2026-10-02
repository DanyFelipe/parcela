import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { HotspotPreviewCard } from '@/components/showroom/HotspotPreviewCard';

const baseLot = {
  id: 'lot-1',
  name: 'Lote A-01',
  price: 75000,
  status: 'available' as const,
  surface_area: 500,
};

const otherLot = {
  id: 'lot-2',
  name: 'Lote A-02',
  price: 90000,
  status: 'reserved' as const,
  surface_area: 450,
};

describe('HotspotPreviewCard', () => {
  const onClose = vi.fn();

  afterEach(() => {
    cleanup();
    onClose.mockReset();
  });

  it('does not render a card when there is no selected lot', () => {
    render(<HotspotPreviewCard lot={null} onClose={onClose} />);

    expect(screen.queryByTestId('hotspot-preview-card')).not.toBeInTheDocument();
  });

  it('renders lot name, price, surface and status label', () => {
    render(<HotspotPreviewCard lot={baseLot} onClose={onClose} />);

    expect(screen.getByTestId('hotspot-preview-card')).toHaveClass(
      'glass-panel',
      'rounded-t-2xl',
      'max-h-[min(70svh,34rem)]'
    );
    expect(screen.getByRole('heading', { name: 'Lote A-01' })).toBeInTheDocument();
    expect(screen.getByText('$ 75.000')).toBeInTheDocument();
    expect(screen.getByText('500 m²')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('links to the full lot page', () => {
    render(<HotspotPreviewCard lot={baseLot} onClose={onClose} />);

    const link = screen.getByRole('link', { name: 'Ver ficha completa' });
    expect(link).toHaveAttribute('href', '/lot/lot-1');
  });

  it('replaces the card content when the selected lot changes', () => {
    const { rerender } = render(<HotspotPreviewCard lot={baseLot} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Lote A-01' })).toBeInTheDocument();

    rerender(<HotspotPreviewCard lot={otherLot} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Lote A-02' })).toBeInTheDocument();
    expect(screen.getByText('Reservado')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lote A-01' })).not.toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    render(<HotspotPreviewCard lot={baseLot} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar vista previa' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape', () => {
    render(<HotspotPreviewCard lot={baseLot} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not listen for Escape when there is no selected lot', () => {
    render(<HotspotPreviewCard lot={null} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
