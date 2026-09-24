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

interface TransitionRow {
  from_view_id: string;
  to_view_id: string;
  video_url: string;
}

interface LotRow {
  id: string;
  name: string;
  price: number | null;
  status: string;
  surface_area: number | null;
}

interface LotHotspotRow {
  id: string;
  lot_id: string;
  view_id: string;
  hotspot_x: number;
  hotspot_y: number;
}

function createSupabaseClient(responses: {
  views?: { data: ViewRow[]; error: null };
  view_transitions?: { data: TransitionRow[]; error: null };
  lots?: { data: LotRow[]; error: null };
  lot_hotspots?: { data: LotHotspotRow[]; error: null };
}) {
  return {
    from: (table: string) => ({
      select: () => {
        const response = responses[table as keyof typeof responses] ?? { data: [], error: null };

        if (table === 'views') {
          return {
            order: () => Promise.resolve(response),
          };
        }

        return Promise.resolve(response);
      },
    }),
  };
}

describe('showroom data loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads views, transitions, lots and hotspots from Supabase', async () => {
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
    const transitions: TransitionRow[] = [
      {
        from_view_id: 'front',
        to_view_id: 'rear',
        video_url: 'https://example.com/front-to-rear.mp4',
      },
    ];
    const lots: LotRow[] = [
      { id: 'lot-1', name: 'Lote A-01', price: 100000, status: 'available', surface_area: 500 },
    ];
    const lotHotspots: LotHotspotRow[] = [
      { id: 'hs-1', lot_id: 'lot-1', view_id: 'top', hotspot_x: 50, hotspot_y: 50 },
    ];

    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({
        views: { data: views, error: null },
        view_transitions: { data: transitions, error: null },
        lots: { data: lots, error: null },
        lot_hotspots: { data: lotHotspots, error: null },
      })
    );

    const result = await getShowroomData();

    expect(result.views).toEqual(views);
    expect(result.transitionUrls).toEqual({
      'front->rear': 'https://example.com/front-to-rear.mp4',
    });
    expect(result.lots).toEqual([
      { id: 'lot-1', name: 'Lote A-01', price: 100000, status: 'available', surface_area: 500 },
    ]);
    expect(result.lotHotspots).toEqual(lotHotspots);
  });

  it('returns empty collections when Supabase returns no data', async () => {
    supabaseMocks.createClient.mockResolvedValue(createSupabaseClient({}));

    const result = await getShowroomData();

    expect(result.views).toEqual([]);
    expect(result.lots).toEqual([]);
    expect(result.lotHotspots).toEqual([]);
  });

  it('throws a safe error when Supabase fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    supabaseMocks.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: new Error('database unavailable') }),
        }),
      }),
    });

    await expect(getShowroomData()).rejects.toThrow(
      'No se pudo cargar la experiencia del terreno.'
    );

    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('filters out lots with invalid status', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({
        lots: {
          data: [
            {
              id: 'lot-1',
              name: 'Lote A-01',
              price: 100000,
              status: 'available',
              surface_area: 500,
            },
            { id: 'lot-2', name: 'Lote A-02', price: 100000, status: 'invalid', surface_area: 500 },
          ],
          error: null,
        },
      })
    );

    const result = await getShowroomData();

    expect(result.lots).toHaveLength(1);
    expect(result.lots[0].id).toBe('lot-1');
  });

  it('filters out hotspots with invalid view ids', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({
        lot_hotspots: {
          data: [
            { id: 'hs-1', lot_id: 'lot-1', view_id: 'top', hotspot_x: 50, hotspot_y: 50 },
            { id: 'hs-2', lot_id: 'lot-2', view_id: 'invalid', hotspot_x: 10, hotspot_y: 10 },
          ],
          error: null,
        },
      })
    );

    const result = await getShowroomData();

    expect(result.lotHotspots).toHaveLength(1);
    expect(result.lotHotspots[0].id).toBe('hs-1');
  });
});
