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

const storageMocks = vi.hoisted(() => ({
  getStorageProvider: vi.fn(),
}));

vi.mock('@/lib/storage/provider', () => storageMocks);

import {
  createLot,
  deleteLot,
  deleteLotHotspot,
  logout,
  updateLot,
  upsertLotHotspot,
  uploadLotAsset,
} from '@/app/admin/actions';

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0];
const TECHNICAL_PLAN_PATH = 'lot-assets/technical-plan/3f2b8c1e-9a4d-4e6f-8b2a-1c2d3e4f5a6b.webp';
const VIEW_360_PATH = 'lot-assets/view-360/7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d.jpg';

function createStorageProvider() {
  return {
    uploadAsset: vi.fn(async (_clientId: string, path: string) => `https://blob.test/${path}`),
    getAssetUrl: vi.fn(async (_clientId: string, path: string) => `https://blob.test/${path}`),
    deleteAsset: vi.fn(async () => undefined),
  };
}

function buildUploadForm(kind: string, bytes: number[] | Uint8Array, type = 'image/jpeg') {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', new File([new Uint8Array(bytes)], 'render.jpg', { type }));
  return formData;
}

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

let storageProvider: ReturnType<typeof createStorageProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_CLIENT_SLUG = 'test-client';
  storageProvider = createStorageProvider();
  storageMocks.getStorageProvider.mockReturnValue(storageProvider);
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

    it('ignores image URLs sent directly, so a client cannot point assets at external hosts', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(
        createLot({
          ...validLot,
          image_360_url: 'https://evil.example.com/tracker.jpg',
          technical_plan_url: 'javascript:alert(1)',
        })
      ).resolves.toEqual({ success: true });

      expect(client.lotsTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({ image_360_url: null, technical_plan_url: null })
      );
      expect(storageProvider.getAssetUrl).not.toHaveBeenCalled();
    });

    it('resolves uploaded asset paths to storage URLs before inserting', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      await expect(
        createLot({
          ...validLot,
          technical_plan_path: TECHNICAL_PLAN_PATH,
          view_360_path: VIEW_360_PATH,
        })
      ).resolves.toEqual({ success: true });

      expect(storageProvider.getAssetUrl).toHaveBeenCalledWith('test-client', TECHNICAL_PLAN_PATH);
      expect(client.lotsTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          technical_plan_url: `https://blob.test/${TECHNICAL_PLAN_PATH}`,
          image_360_url: `https://blob.test/${VIEW_360_PATH}`,
        })
      );
    });

    it('rejects asset paths outside the expected format without touching storage', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await createLot({
        ...validLot,
        technical_plan_path: '../../other-client/secret.jpg',
      });

      expect(result.success).toBe(false);
      expect(storageProvider.getAssetUrl).not.toHaveBeenCalled();
      expect(client.from).not.toHaveBeenCalled();
    });

    it('rejects a 360 path submitted in the technical plan slot', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);

      const result = await createLot({ ...validLot, technical_plan_path: VIEW_360_PATH });

      expect(result.success).toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    });

    it('asks to re-upload when the referenced asset does not exist', async () => {
      const client = createMockClient();
      supabaseMocks.createClient.mockResolvedValue(client);
      storageProvider.getAssetUrl.mockRejectedValueOnce(new Error('BlobNotFound'));

      await expect(
        createLot({ ...validLot, technical_plan_path: TECHNICAL_PLAN_PATH })
      ).resolves.toEqual({
        success: false,
        message: 'No se encontró un archivo subido. Volvé a subirlo.',
      });
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

  describe('uploadLotAsset', () => {
    it('rejects uploads without an admin session', async () => {
      supabaseMocks.createClient.mockResolvedValue(createMockClient({ user: null }));

      await expect(uploadLotAsset(buildUploadForm('view-360', JPEG_HEADER))).resolves.toEqual(
        SESSION_EXPIRED
      );
      expect(storageProvider.uploadAsset).not.toHaveBeenCalled();
    });

    it('rejects anonymous Supabase users', async () => {
      supabaseMocks.createClient.mockResolvedValue(
        createMockClient({ user: { id: 'anon-1', is_anonymous: true } })
      );

      await expect(uploadLotAsset(buildUploadForm('view-360', JPEG_HEADER))).resolves.toEqual(
        SESSION_EXPIRED
      );
      expect(storageProvider.uploadAsset).not.toHaveBeenCalled();
    });

    it('rejects content that is not a supported image, regardless of the declared type', async () => {
      supabaseMocks.createClient.mockResolvedValue(createMockClient());
      const svgPayload = Array.from(new TextEncoder().encode('<svg onload="alert(1)"></svg>'));

      const result = await uploadLotAsset(
        buildUploadForm('technical-plan', svgPayload, 'image/jpeg')
      );

      expect(result).toEqual({
        success: false,
        message: 'Solo se permiten imágenes JPG, PNG o WebP.',
      });
      expect(storageProvider.uploadAsset).not.toHaveBeenCalled();
    });

    it('rejects files above 4 MB', async () => {
      supabaseMocks.createClient.mockResolvedValue(createMockClient());
      const oversized = new Uint8Array(4 * 1024 * 1024 + 1);
      oversized.set(JPEG_HEADER);

      const result = await uploadLotAsset(buildUploadForm('view-360', oversized));

      expect(result).toEqual({ success: false, message: 'La imagen debe pesar hasta 4 MB.' });
      expect(storageProvider.uploadAsset).not.toHaveBeenCalled();
    });

    it('rejects an unknown asset kind', async () => {
      supabaseMocks.createClient.mockResolvedValue(createMockClient());

      const result = await uploadLotAsset(buildUploadForm('../../etc', JPEG_HEADER));

      expect(result.success).toBe(false);
      expect(storageProvider.uploadAsset).not.toHaveBeenCalled();
    });

    it('stores a valid JPEG under a server-generated path that ignores the original file name', async () => {
      supabaseMocks.createClient.mockResolvedValue(createMockClient());

      const result = await uploadLotAsset(buildUploadForm('view-360', JPEG_HEADER));

      expect(result).toMatchObject({ success: true });
      expect(result.success && result.path).toMatch(
        /^lot-assets\/view-360\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/
      );
      expect(result.success && result.path).not.toContain('render');
      expect(storageProvider.uploadAsset).toHaveBeenCalledWith(
        'test-client',
        expect.stringMatching(/^lot-assets\/view-360\//),
        expect.any(Buffer)
      );
    });

    it('returns a generic message and reports to Sentry when storage fails', async () => {
      supabaseMocks.createClient.mockResolvedValue(createMockClient());
      const storageError = new Error('token=vercel_blob_rw_secret leaked');
      storageProvider.uploadAsset.mockRejectedValueOnce(storageError);

      const result = await uploadLotAsset(buildUploadForm('technical-plan', JPEG_HEADER));

      expect(result).toEqual({
        success: false,
        message: 'No se pudo subir el archivo. Intentá nuevamente.',
      });
      expect(JSON.stringify(result)).not.toContain('vercel_blob_rw_secret');
      expect(sentryMocks.captureException).toHaveBeenCalledWith(storageError, {
        tags: { area: 'admin', action: 'uploadLotAsset' },
      });
    });
  });
});
