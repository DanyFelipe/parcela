import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentryMocks);

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => supabaseMocks);

import { getLotsForAdmin } from '@/lib/admin/lot-data';

const baseRow = {
  id: 'd2519ea0-6e12-449d-9588-eb3cff4a9691',
  name: 'Lote A-01',
  price: 100000,
  status: 'available',
  surface_area: 500,
  orientation: 'Norte',
  image_360_url: null,
  technical_plan_url: null,
  soil_type: 'Arcilloso',
  has_water_service: true,
  has_electricity_service: false,
  has_sewage_service: false,
  legal_status: 'titled',
  encumbrances: null,
  registry_number: '12345',
  description: 'Lote amplio con vista al lago.',
  // Formato real que devuelve PostgREST para timestamptz.
  created_at: '2026-09-28T00:00:00.123456+00:00',
  updated_at: '2026-09-28T12:34:56+00:00',
  updated_by: null,
};

function createSupabaseClient(rows: unknown[]) {
  return {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: rows, error: null }),
      }),
    }),
  };
}

describe('getLotsForAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns lots whose timestamps come back with a PostgREST offset', async () => {
    supabaseMocks.createClient.mockResolvedValue(createSupabaseClient([baseRow]));

    const lots = await getLotsForAdmin();

    expect(lots).toHaveLength(1);
    expect(lots[0].name).toBe('Lote A-01');
    expect(sentryMocks.captureMessage).not.toHaveBeenCalled();
  });

  it('drops an invalid row but keeps the valid ones, and reports it', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient([baseRow, { ...baseRow, id: 'not-a-uuid' }])
    );

    const lots = await getLotsForAdmin();

    expect(lots).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledOnce();
    expect(sentryMocks.captureMessage).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });

  it('throws a safe error without leaking Postgres details when the query fails', async () => {
    supabaseMocks.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          order: () =>
            Promise.resolve({ data: null, error: new Error('permission denied for table lots') }),
        }),
      }),
    });

    await expect(getLotsForAdmin()).rejects.toThrow('No se pudieron cargar los lotes.');
    expect(sentryMocks.captureException).toHaveBeenCalledOnce();
  });
});
