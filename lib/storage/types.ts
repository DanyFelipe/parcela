export interface StorageProvider {
  getAssetUrl(clientId: string, assetPath: string): Promise<string>;
  uploadAsset(clientId: string, assetPath: string, file: Buffer): Promise<string>;
  deleteAsset(clientId: string, assetPath: string): Promise<void>;
}
