import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => supabaseMocks);

import { getShowroomData } from '@/lib/showroom/showroom-data';

interface ViewRow {
  id: string;
  display_order: number;
  base_image_url: string;
  alt_image_url: string | null;
}

describe('showroom data loader', () => {
  const orderMock = vi.fn();
  const selectMock = vi.fn(() => ({ order: orderMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.createClient.mockResolvedValue({ from: fromMock });
  });

  it('loads views and transition URLs from Supabase', async () => {
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

    const result = await getShowroomData();

    expect(result.views[0]).toEqual(views[0]);
    expect(result.transitionUrls).toEqual({});
    expect(fromMock).toHaveBeenCalledWith('views');
    expect(selectMock).toHaveBeenCalledWith('id, display_order, base_image_url, alt_image_url');
    expect(orderMock).toHaveBeenCalledWith('display_order', { ascending: true });
  });

  it('returns an empty view collection when Supabase returns no views', async () => {
    orderMock.mockResolvedValue({ data: [], error: null });

    const result = await getShowroomData();

    expect(result.views).toEqual([]);
  });

  it('throws a safe error when Supabase fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    orderMock.mockResolvedValue({ data: null, error: new Error('database unavailable') });

    await expect(getShowroomData()).rejects.toThrow(
      'No se pudo cargar la experiencia del terreno.'
    );

    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
