import { afterEach, describe, expect, it } from 'vitest';

import { buildAssetPath, detectImageExtension, getClientSlug } from '@/lib/admin/asset-upload';

const encode = (text: string) => Array.from(new TextEncoder().encode(text));

describe('detectImageExtension', () => {
  it('detects JPEG, PNG and WebP by their binary signatures', () => {
    expect(detectImageExtension(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg');
    expect(
      detectImageExtension(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe('png');
    expect(
      detectImageExtension(new Uint8Array([...encode('RIFF'), 0, 0, 0, 0, ...encode('WEBP')]))
    ).toBe('webp');
  });

  it.each([
    ['SVG with script', encode('<svg onload="alert(1)"></svg>')],
    ['HTML', encode('<html><script>alert(1)</script></html>')],
    ['PDF', encode('%PDF-1.7')],
    ['GIF', encode('GIF89a')],
    ['empty file', []],
  ])('rejects %s', (_name, bytes) => {
    expect(detectImageExtension(new Uint8Array(bytes))).toBeNull();
  });

  it('rejects a RIFF container that is not WebP', () => {
    expect(
      detectImageExtension(new Uint8Array([...encode('RIFF'), 0, 0, 0, 0, ...encode('WAVE')]))
    ).toBeNull();
  });
});

describe('getClientSlug', () => {
  const original = process.env.NEXT_PUBLIC_CLIENT_SLUG;

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLIENT_SLUG = original;
  });

  it('returns a valid slug', () => {
    process.env.NEXT_PUBLIC_CLIENT_SLUG = 'inmobiliaria-los-robles';
    expect(getClientSlug()).toBe('inmobiliaria-los-robles');
  });

  it.each(['', '   ', 'Los Robles', '../otro-cliente', 'cliente/sub'])(
    'rejects invalid slug %j',
    (value) => {
      process.env.NEXT_PUBLIC_CLIENT_SLUG = value;
      expect(() => getClientSlug()).toThrow('NEXT_PUBLIC_CLIENT_SLUG is missing or invalid.');
    }
  );
});

describe('buildAssetPath', () => {
  it('generates a random UUID path and never reuses the original name', () => {
    const first = buildAssetPath('view-360', 'jpg');
    const second = buildAssetPath('view-360', 'jpg');

    expect(first).toMatch(/^lot-assets\/view-360\/[0-9a-f-]{36}\.jpg$/);
    expect(first).not.toBe(second);
  });
});
