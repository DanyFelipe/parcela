/**
 * Constantes de subida de assets compartidas entre cliente y servidor.
 * Sin dependencias de Node: lo puede importar un componente 'use client'.
 */

export const MAX_ASSET_BYTES = 4 * 1024 * 1024;

export const ASSET_KINDS = ['technical-plan', 'view-360'] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
