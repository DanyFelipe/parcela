import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('redirect');
  }),
}));

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentryMocks);

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => supabaseMocks);

import {
  createLot,
  deleteLot,
  deleteLotHotspot,
  logout,
  updateLot,
  upsertLotHotspot,
} from '@/app/admin/actions';

const LOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const ADMIN_USER = { id: 'user-1', is_anonymous: false };

interface MockClientOptions {
  user?: { id: string; is_anonymous?: boolean } | null;
  lotError?: Error | null;
  hotspotError?: Error | null;
  signOutError?: Error | null;
}

function createMockClient(options: MockClientOptions = {}) {
  const { user = ADMIN_USER, lotError = null, hotspotError = null, signOutError = null } = options;

  const lotsTable = {
    insert: vi.fn(() => Promise.resolve({ error: lotError })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: lotError })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: lotError })),
    })),
  };

  const hotspotsTable = {
    upsert: vi.fn(() => Promise.resolve({ error: hotspotError })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: hotspotError })),
      })),
    })),
  };

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: signOutError })),
    },
    from: vi.fn((table: string) => {
      if (table === 'lots') return lotsTable;
      if (table === 'lot_hotspots') return hotspotsTable;
      throw new Error(`Unexpected table ${table}`);
    }),
    lotsTable,
    hotspotsTable,
  };
}

const validLot = {
  name: 'Lote A-01',
  status: 'available' as const,
  price: 75000,
  surface_area: 500,
  orientation: 'Norte',
  image_360_url: null,
  technical_plan_url: null,
  soil_type: 'Arcilloso',
  has_water_service: true,
  has_electricity_service: true,
  has_sewage_service: false,
  legal_status: 'titled' as const,
  encumbrances: null,
  registry_number: 'R-12345',
  description: 'Lote de prueba',
};

const SESSION_EXPIRED = { success: false, message: 'Tu sesión venció. Iniciá sesión nuevamente.' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin actions', () => {
  describe('authorization', () => {
    it('rejects requests without a session', async () => {
      const client = createMockClient({ user: null });
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(createLot(validLot)).resolves.toEqual(SESSION_EXPIRED);
      await expect(updateLot(LOT_ID, validLot)).resolves.toEqual(SESSION_EXPIRED);
      await expect(deleteLot(LOT_ID)).resolves.toEqual(SESSION_EXPIRED);
      await expect(upsertLotHotspot(LOT_ID, 'top', 10, 10)).resolves.toEqual(SESSION_EXPIRED);
      await expect(deleteLotHotspot(LOT_ID, 'top')).resolves.toEqual(SESSION_EXPIRED);
      expect(client.from).not.toHaveBeenCalled();
    });

    it('rejects anonymous Supabase users even though they hold the authenticated role', async () => {
      const client = createMockClient({ user: { id: 'anon-1', is_anonymous: true } });
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(createLot(validLot)).resolves.toEqual(SESSION_EXPIRED);
      await expect(deleteLot(LOT_ID)).resolves.toEqual(SESSION_EXPIRED);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe('createLot', () => {
    it('inserts a lot with updated_by set to the current user', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(createLot(validLot)).resolves.toEqual({ success: true });

      expect(client.from).toHaveBeenCalledWith('lots');
      expect(client.lotsTable.insert).toHaveBeenCalledWith({
        ...validLot,
        updated_by: 'user-1',
      });
    });

    it('rejects non-http image URLs without touching the database', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await createLot({
        ...validLot,
        image_360_url: 'javascript:alert(1)',
      });

      expect(result.success).toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    });

    it('rejects oversized free-text fields', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await createLot({ ...validLot, name: 'x'.repeat(121) });

      expect(result.success).toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    });

    it('returns a generic message and reports to Sentry when Supabase fails', async () => {
      const rawError = new Error('duplicate key value violates unique constraint "lots_pkey"');
      const client = createMockClient({ lotError: rawError });
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await createLot(validLot);

      expect(result).toEqual({
        success: false,
        message: 'No se pudo crear el lote. Intentá nuevamente.',
      });
      expect(JSON.stringify(result)).not.toContain('duplicate key');
      expect(sentryMocks.captureException).toHaveBeenCalledWith(rawError, {
        tags: { area: 'admin', action: 'createLot' },
      });
    });
  });

  describe('updateLot', () => {
    it('updates a lot with updated_by and updated_at', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(updateLot(LOT_ID, validLot)).resolves.toEqual({ success: true });

      expect(client.lotsTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validLot,
          updated_by: 'user-1',
          updated_at: expect.any(String),
        })
      );

      const eqMock = client.lotsTable.update.mock.results[0]?.value?.eq;
      expect(eqMock).toHaveBeenCalledWith('id', LOT_ID);
    });

    it('rejects a malformed lot id without touching the database', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await updateLot("1' or '1'='1", validLot);

      expect(result).toEqual({ success: false, message: 'El lote indicado no es válido.' });
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteLot', () => {
    it('deletes the requested lot', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(deleteLot(LOT_ID)).resolves.toEqual({ success: true });

      expect(client.lotsTable.delete).toHaveBeenCalled();

      const eqMock = client.lotsTable.delete.mock.results[0]?.value?.eq;
      expect(eqMock).toHaveBeenCalledWith('id', LOT_ID);
    });

    it('rejects a malformed lot id without touching the database', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await deleteLot('*');

      expect(result.success).toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe('upsertLotHotspot', () => {
    it('persists a hotspot at valid percentage coordinates', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await upsertLotHotspot(LOT_ID, 'top', 100, 0);

      expect(result).toEqual({ success: true });
      expect(client.from).toHaveBeenCalledWith('lot_hotspots');
      expect(client.hotspotsTable.upsert).toHaveBeenCalledWith(
        {
          lot_id: LOT_ID,
          view_id: 'top',
          hotspot_x: 100,
          hotspot_y: 0,
        },
        { onConflict: 'lot_id,view_id' }
      );
    });

    it('rejects coordinates outside the supported percentage range', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(upsertLotHotspot(LOT_ID, 'top', 101, 40)).resolves.toEqual({
        success: false,
        message: 'La posición del hotspot no es válida.',
      });
      expect(client.from).not.toHaveBeenCalled();
    });

    it('rejects any view other than top', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await upsertLotHotspot(LOT_ID, 'front', 10, 10);

      expect(result.success).toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe('deleteLotHotspot', () => {
    it('deletes the hotspot by lot and view', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(deleteLotHotspot(LOT_ID, 'top')).resolves.toEqual({ success: true });

      expect(client.hotspotsTable.delete).toHaveBeenCalled();

      const firstEq = client.hotspotsTable.delete.mock.results[0]?.value?.eq;
      expect(firstEq).toHaveBeenCalledWith('lot_id', LOT_ID);

      const secondEq = firstEq?.mock?.results?.[0]?.value?.eq;
      expect(secondEq).toHaveBeenCalledWith('view_id', 'top');
    });
  });

  describe('logout', () => {
    it('signs out and redirects to login', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(logout()).rejects.toThrow('redirect');
      expect(client.auth.signOut).toHaveBeenCalled();
    });
  });
});
