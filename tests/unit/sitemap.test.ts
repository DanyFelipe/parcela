import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => supabaseMocks);

import sitemap from '@/app/sitemap';
import { getActiveLotIds } from '@/lib/showroom/lot-data';

function createSupabaseClient(lots: { id: string; status: string }[]) {
  return {
    from: () => ({
      select: () => ({
        neq: () => Promise.resolve({ data: lots, error: null }),
      }),
    }),
  };
}

describe('getActiveLotIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ids of available and reserved lots, excluding sold', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient([
        { id: 'lot-1', status: 'available' },
        { id: 'lot-2', status: 'reserved' },
        { id: 'lot-3', status: 'sold' },
      ])
    );

    const ids = await getActiveLotIds();

    expect(ids).toEqual(['lot-1', 'lot-2']);
  });

  it('filters out rows with invalid status', async () => {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient([
        { id: 'lot-1', status: 'available' },
        { id: 'lot-2', status: 'invalid' },
      ])
    );

    const ids = await getActiveLotIds();

    expect(ids).toEqual(['lot-1']);
  });

  it('returns an empty array when Supabase fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    supabaseMocks.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          neq: () => Promise.resolve({ data: null, error: new Error('database unavailable') }),
        }),
      }),
    });

    const ids = await getActiveLotIds();

    expect(ids).toEqual([]);
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://parcela.test';
  });

  function mockActiveLots() {
    supabaseMocks.createClient.mockResolvedValue(
      createSupabaseClient([
        { id: 'lot-1', status: 'available' },
        { id: 'lot-2', status: 'reserved' },
        { id: 'lot-3', status: 'sold' },
      ])
    );
  }

  it('includes the home page and all active lot pages', async () => {
    mockActiveLots();

    const result = await sitemap();

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      url: 'https://parcela.test',
      changeFrequency: 'weekly',
      priority: 1,
    });
    expect(result[1]).toMatchObject({
      url: 'https://parcela.test/lot/lot-1',
      changeFrequency: 'weekly',
      priority: 0.8,
    });
    expect(result[2]).toMatchObject({
      url: 'https://parcela.test/lot/lot-2',
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  it('normalizes a trailing slash in NEXT_PUBLIC_SITE_URL', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://parcela.test/';
    mockActiveLots();

    const result = await sitemap();

    expect(result[1].url).toBe('https://parcela.test/lot/lot-1');
  });

  it('falls back to the Vercel production URL when NEXT_PUBLIC_SITE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'parcela.vercel.app';
    mockActiveLots();

    const result = await sitemap();

    expect(result[1].url).toBe('https://parcela.vercel.app/lot/lot-1');
  });

  it('falls back to the deployment URL when no production URL is available', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = 'parcela-preview-123.vercel.app';
    mockActiveLots();

    const result = await sitemap();

    expect(result[1].url).toBe('https://parcela-preview-123.vercel.app/lot/lot-1');
  });

  it('returns an empty sitemap instead of failing the build when no URL is configured', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await sitemap();

    expect(result).toEqual([]);
    expect(supabaseMocks.createClient).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
