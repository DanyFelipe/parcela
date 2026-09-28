import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { LotStatusLegend } from '@/components/showroom/LotStatusLegend';

describe('LotStatusLegend', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render when no statuses are provided', () => {
    render(<LotStatusLegend statuses={[]} />);

    expect(screen.queryByTestId('lot-status-legend')).not.toBeInTheDocument();
  });

  it('renders a label for each provided status', () => {
    render(<LotStatusLegend statuses={['available', 'reserved', 'sold']} />);

    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Reservado')).toBeInTheDocument();
    expect(screen.getByText('Vendido')).toBeInTheDocument();
  });

  it('applies the correct color class for each status', () => {
    const { container } = render(<LotStatusLegend statuses={['available', 'reserved', 'sold']} />);

    expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-rose-500')).toBeInTheDocument();
  });

  it('fades out when fadingOut is true', () => {
    render(<LotStatusLegend statuses={['available']} fadingOut />);

    expect(screen.getByTestId('lot-status-legend')).toHaveClass('opacity-0');
  });
});
