import { randomUUID } from 'node:crypto';

import type { AssetKind } from '@/lib/admin/asset-constraints';

export type ImageExtension = 'jpg' | 'png' | 'webp';

const CLIENT_SLUG_PATTERN = /^[a-z0-9-]+$/;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function matchesSignature(content: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((byte, index) => content[offset + index] === byte);
}

function matchesAscii(content: Uint8Array, text: string, offset: number): boolean {
  return matchesSignature(
    content,
    Array.from(text, (char) => char.charCodeAt(0)),
    offset
  );
}

/**
 * Identifica el formato por su firma binaria, no por la extensión ni por el
 * `Content-Type` que envía el navegador (ambos los controla el cliente).
 * Cualquier otro contenido (SVG, HTML, PDF, GIF...) devuelve `null`.
 */
export function detectImageExtension(content: Uint8Array): ImageExtension | null {
  if (matchesSignature(content, JPEG_SIGNATURE)) return 'jpg';
  if (matchesSignature(content, PNG_SIGNATURE)) return 'png';
  if (matchesAscii(content, 'RIFF', 0) && matchesAscii(content, 'WEBP', 8)) return 'webp';

  return null;
}

/**
 * Slug del cliente usado como prefijo de todos los assets en el storage.
 * Viene de `NEXT_PUBLIC_CLIENT_SLUG` (ver docs/SETUP.md) y se valida porque se usa
 * como segmento de ruta.
 */
export function getClientSlug(): string {
  const slug = process.env.NEXT_PUBLIC_CLIENT_SLUG?.trim();

  if (!slug || !CLIENT_SLUG_PATTERN.test(slug)) {
    throw new Error('NEXT_PUBLIC_CLIENT_SLUG is missing or invalid.');
  }

  return slug;
}

/**
 * La ruta la genera siempre el servidor con un UUID aleatorio: el nombre original
 * del archivo nunca se usa, así no hay path traversal ni colisiones entre lotes.
 */
export function buildAssetPath(kind: AssetKind, extension: ImageExtension): string {
  return `lot-assets/${kind}/${randomUUID()}.${extension}`;
}
