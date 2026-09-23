import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getStorageProvider } from '@/lib/storage/provider';

import { requireEnv } from './helpers/env';

const TEST_CLIENT_ID = 'parcela-integration-tests';
const TEST_ASSET_PREFIX = 'integration-tests/smoke';

describe('Vercel Blob integration smoke test', () => {
  let assetPath: string;
  let uploadedUrl: string;
  let originalStorageProvider: string | undefined;

  beforeAll(() => {
    requireEnv('BLOB_READ_WRITE_TOKEN');
    originalStorageProvider = process.env.STORAGE_PROVIDER;
    process.env.STORAGE_PROVIDER = 'vercel-blob';

    assetPath = `${TEST_ASSET_PREFIX}/${Date.now()}-${randomUUID()}.txt`;
  });

  afterAll(async () => {
    try {
      await getStorageProvider().deleteAsset(TEST_CLIENT_ID, assetPath);
    } catch {
      // Best-effort cleanup; the test itself already deletes the asset on success.
    }

    if (originalStorageProvider === undefined) {
      delete process.env.STORAGE_PROVIDER;
    } else {
      process.env.STORAGE_PROVIDER = originalStorageProvider;
    }
  });

  it('uploads a test asset, resolves its URL and deletes it', async () => {
    const provider = getStorageProvider();
    const content = Buffer.from('parcela smoke test');

    uploadedUrl = await provider.uploadAsset(TEST_CLIENT_ID, assetPath, content);

    expect(uploadedUrl).toContain(TEST_CLIENT_ID);
    expect(uploadedUrl).toContain(assetPath.split('/').pop());

    const resolvedUrl = await provider.getAssetUrl(TEST_CLIENT_ID, assetPath);
    expect(resolvedUrl).toBe(uploadedUrl);

    const headResponse = await fetch(resolvedUrl, { method: 'HEAD' });
    expect(headResponse.ok).toBe(true);

    await provider.deleteAsset(TEST_CLIENT_ID, assetPath);

    await expect(provider.getAssetUrl(TEST_CLIENT_ID, assetPath)).rejects.toThrow();
  });
});
