import { describe, expect, it } from 'vitest';

import { formatPrice, formatSurface } from '@/lib/showroom/lot-formatting';

describe('lot formatting', () => {
  describe('formatPrice', () => {
    it('formats a price with Argentine Spanish locale', () => {
      expect(formatPrice(75000)).toBe('$ 75.000');
      expect(formatPrice(1250000)).toBe('$ 1.250.000');
    });

    it('returns a fallback when price is null', () => {
      expect(formatPrice(null)).toBe('Consultar precio');
    });
  });

  describe('formatSurface', () => {
    it('formats a surface area with square meters', () => {
      expect(formatSurface(500)).toBe('500 m²');
      expect(formatSurface(1250.5)).toBe('1.250,5 m²');
    });

    it('returns a fallback when surface area is null', () => {
      expect(formatSurface(null)).toBe('Superficie no disponible');
    });
  });
});
