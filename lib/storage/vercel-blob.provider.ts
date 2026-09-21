import { del, head, put } from '@vercel/blob';

import type { StorageProvider } from './types';

function buildAssetPath(clientId: string, assetPath: string): string {
  const normalizedClientId = clientId.trim().replace(/^\/+|\/+$/g, '');
  const normalizedAssetPath = assetPath.trim().replace(/^\/+/, '');
  const pathSegments = `${normalizedClientId}/${normalizedAssetPath}`.split('/');

  if (
    !normalizedClientId ||
    !normalizedAssetPath ||
    normalizedClientId.includes('/') ||
    pathSegments.some((segment) => !segment || segment === '..' || segment === '.') ||
    normalizedClientId.includes('\\') ||
    normalizedAssetPath.includes('\\')
  ) {
    throw new Error('Invalid storage asset path.');
  }

  return pathSegments.join('/');
}

export class VercelBlobStorageProvider implements StorageProvider {
  async getAssetUrl(clientId: string, assetPath: string): Promise<string> {
    const blob = await head(buildAssetPath(clientId, assetPath));
    return blob.url;
  }

  async uploadAsset(clientId: string, assetPath: string, file: Buffer): Promise<string> {
    const blob = await put(buildAssetPath(clientId, assetPath), file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return blob.url;
  }

  async deleteAsset(clientId: string, assetPath: string): Promise<void> {
    await del(buildAssetPath(clientId, assetPath));
  }
}
