import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => supabaseMocks);

import Home from '../../app/page';

interface ViewRow {
  id: string;
  display_order: number;
  base_image_url: string;
  alt_image_url: string | null;
}

describe('Home showroom page', () => {
  const orderMock = vi.fn();
  const selectMock = vi.fn(() => ({ order: orderMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.createClient.mockResolvedValue({ from: fromMock });
  });

  it('loads views from Supabase and renders front as the initial image', async () => {
    const views: ViewRow[] = [
      {
        id: 'front',
        display_order: 1,
        base_image_url: 'https://placehold.co/front.webp',
        alt_image_url: null,
      },
      {
        id: 'top',
        display_order: 3,
        base_image_url: 'https://placehold.co/top.webp',
        alt_image_url: 'https://placehold.co/top-no-grid.webp',
      },
    ];
    orderMock.mockResolvedValue({ data: views, error: null });

    render(await Home());

    const image = screen.getByTestId('showroom-base-image');
    expect(image.getAttribute('src')).toBe('https://placehold.co/front.webp');
    expect(image.getAttribute('alt')).toBe('Vista frontal del terreno');
    expect(screen.getByRole('heading', { name: 'Descubre tu próximo terreno' })).toBeTruthy();
    expect(fromMock).toHaveBeenCalledWith('views');
    expect(selectMock).toHaveBeenCalledWith('id, display_order, base_image_url, alt_image_url');
    expect(orderMock).toHaveBeenCalledWith('display_order', { ascending: true });
  });

  it('renders an empty state when Supabase returns no views', async () => {
    orderMock.mockResolvedValue({ data: [], error: null });

    render(await Home());

    expect(screen.getByRole('status').textContent).toBe('No hay vistas disponibles para mostrar.');
    expect(screen.queryByTestId('showroom-base-image')).toBeNull();
  });

  it('throws a safe error when Supabase fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    orderMock.mockResolvedValue({ data: null, error: new Error('database unavailable') });

    await expect(Home()).rejects.toThrow('No se pudieron cargar las vistas del terreno.');

    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
