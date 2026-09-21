import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blobMocks = vi.hoisted(() => ({
  del: vi.fn(),
  head: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@vercel/blob', () => blobMocks);

import { getStorageProvider } from '@/lib/storage/provider';
import { VercelBlobStorageProvider } from '@/lib/storage/vercel-blob.provider';

const originalStorageProvider = process.env.STORAGE_PROVIDER;

afterEach(() => {
  if (originalStorageProvider === undefined) {
    delete process.env.STORAGE_PROVIDER;
  } else {
    process.env.STORAGE_PROVIDER = originalStorageProvider;
  }
});

describe('VercelBlobStorageProvider', () => {
  const provider = new VercelBlobStorageProvider();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a client asset and returns the provider URL', async () => {
    blobMocks.put.mockResolvedValue({ url: 'https://blob.example/front.webp' });

    const result = await provider.uploadAsset(
      'parcela-dev',
      'views/front.webp',
      Buffer.from('asset')
    );

    expect(result).toBe('https://blob.example/front.webp');
    expect(blobMocks.put).toHaveBeenCalledWith('parcela-dev/views/front.webp', expect.any(Buffer), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  });

  it('resolves an existing asset URL through provider metadata', async () => {
    blobMocks.head.mockResolvedValue({ url: 'https://blob.example/front.webp' });

    const result = await provider.getAssetUrl('parcela-dev', 'views/front.webp');

    expect(result).toBe('https://blob.example/front.webp');
    expect(blobMocks.head).toHaveBeenCalledWith('parcela-dev/views/front.webp');
  });

  it('deletes a client asset', async () => {
    blobMocks.del.mockResolvedValue(undefined);

    await provider.deleteAsset('parcela-dev', 'views/front.webp');

    expect(blobMocks.del).toHaveBeenCalledWith('parcela-dev/views/front.webp');
  });

  it.each(['../front.webp', 'views/../front.webp', 'views\\front.webp'])(
    'rejects unsafe asset path %s',
    async (assetPath) => {
      await expect(provider.getAssetUrl('parcela-dev', assetPath)).rejects.toThrow(
        'Invalid storage asset path.'
      );
      expect(blobMocks.head).not.toHaveBeenCalled();
    }
  );
});

describe('getStorageProvider', () => {
  it('returns the Vercel Blob provider by default', () => {
    delete process.env.STORAGE_PROVIDER;

    expect(getStorageProvider()).toBeInstanceOf(VercelBlobStorageProvider);
  });

  it('rejects unsupported providers', () => {
    process.env.STORAGE_PROVIDER = 'unsupported';

    expect(() => getStorageProvider()).toThrow('Unsupported storage provider: unsupported');
  });
});
