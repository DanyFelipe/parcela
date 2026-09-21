import type { StorageProvider } from './types';
import { VercelBlobStorageProvider } from './vercel-blob.provider';

export function getStorageProvider(): StorageProvider {
  const providerName = process.env.STORAGE_PROVIDER ?? 'vercel-blob';

  if (providerName === 'vercel-blob') {
    return new VercelBlobStorageProvider();
  }

  throw new Error(`Unsupported storage provider: ${providerName}`);
}
