import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => supabaseMocks);

import { getLotById } from '@/lib/showroom/lot-data';

interface LotRow {
  id: string;
  name: string;
  price: number | null;
  status: string;
  surface_area: number | null;
  orientation: string | null;
  image_360_url: string | null;
  technical_plan_url: string | null;
  soil_type: string | null;
  has_water_service: boolean;
  has_electricity_service: boolean;
  has_sewage_service: boolean;
  legal_status: string | null;
  encumbrances: string | null;
  registry_number: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

function createSupabaseClient(response: { data: LotRow | null; error: Error | null }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(response),
        }),
      }),
    }),
  };
}

const baseLotRow: LotRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Lote A-01',
  price: 75000,
  status: 'available',
  surface_area: 500,
  orientation: 'Norte',
  image_360_url: null,
  technical_plan_url: 'https://placehold.co/plan.webp',
  soil_type: 'Arcilloso',
  has_water_service: true,
  has_electricity_service: true,
  has_sewage_service: false,
  legal_status: 'titled',
  encumbrances: null,
  registry_number: 'R-12345',
  description: 'Lote con excelente orientación norte.',
  created_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
  updated_by: null,
};

describe('getLotById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a validated lot when it exists', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({ data: baseLotRow, error: null })
    );

    const lot = await getLotById(baseLotRow.id);

    expect(lot).not.toBeNull();
    expect(lot?.id).toBe(baseLotRow.id);
    expect(lot?.name).toBe('Lote A-01');
    expect(lot?.status).toBe('available');
    expect(lot?.has_water_service).toBe(true);
    expect(lot?.legal_status).toBe('titled');
  });

  it('returns null when the lot is not found', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({
        data: null,
        error: { message: 'Not found', name: 'PostgrestError' } as Error,
      })
    );

    const lot = await getLotById('missing-id');

    expect(lot).toBeNull();
  });

  it('returns null when the data fails Zod validation', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({
        data: { ...baseLotRow, status: 'invalid_status' },
        error: null,
      })
    );

    const lot = await getLotById(baseLotRow.id);

    expect(lot).toBeNull();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });

  it('filters sensitive/internal fields from the returned lot', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient({ data: baseLotRow, error: null })
    );

    const lot = await getLotById(baseLotRow.id);

    expect(lot).not.toHaveProperty('created_at');
    expect(lot).not.toHaveProperty('updated_at');
    expect(lot).not.toHaveProperty('updated_by');
  });
});
