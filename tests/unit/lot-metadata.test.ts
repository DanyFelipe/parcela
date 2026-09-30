import { describe, expect, it } from 'vitest';

import { buildLotJsonLd, buildLotMetadata } from '@/lib/showroom/lot-metadata';

const baseUrl = 'https://parcela.example.com';

const baseLot = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Lote A-01',
  price: 75000,
  status: 'available' as const,
  surface_area: 500,
  orientation: 'Norte',
  image_360_url: null,
  technical_plan_url: 'https://placehold.co/plan.webp',
  soil_type: 'Arcilloso',
  has_water_service: true,
  has_electricity_service: true,
  has_sewage_service: false,
  legal_status: 'titled' as const,
  encumbrances: null,
  registry_number: 'R-12345',
  description: 'Lote amplio.',
};

const lotUrl = `/lot/${baseLot.id}`;

describe('buildLotMetadata', () => {
  it('returns a not-found title when there is no lot', () => {
    const metadata = buildLotMetadata(null, { baseUrl, lotUrl });

    expect(metadata.title).toBe('Lote no encontrado');
    expect(metadata.description).toBeUndefined();
  });

  it('builds a title with name, surface and status', () => {
    const metadata = buildLotMetadata(baseLot, { baseUrl, lotUrl });

    expect(metadata.title).toBe('Lote A-01 · 500 m² · Disponible');
  });

  it('builds a description with surface, status, orientation and price', () => {
    const metadata = buildLotMetadata(baseLot, { baseUrl, lotUrl });

    expect(metadata.description).toContain('Lote A-01');
    expect(metadata.description).toContain('500 m²');
    expect(metadata.description).toContain('disponible');
    expect(metadata.description).toContain('Orientación norte');
    expect(metadata.description).toContain('$ 75.000');
  });

  it('uses the fallback price label when price is null', () => {
    const metadata = buildLotMetadata({ ...baseLot, price: null }, { baseUrl, lotUrl });

    expect(metadata.description).toContain('Consultar precio');
  });

  it('omits orientation from description when it is null', () => {
    const metadata = buildLotMetadata({ ...baseLot, orientation: null }, { baseUrl, lotUrl });

    expect(metadata.description).not.toContain('Orientación');
    expect(metadata.description).toContain('Lote A-01');
  });

  it('includes Open Graph metadata with absolute url and image', () => {
    const metadata = buildLotMetadata(baseLot, { baseUrl, lotUrl });

    expect(metadata.openGraph).toMatchObject({
      title: 'Lote A-01 · 500 m² · Disponible',
      type: 'website',
      url: `${baseUrl}${lotUrl}`,
    });
    expect(metadata.openGraph?.images).toEqual([{ url: baseLot.technical_plan_url }]);
  });

  it('includes Twitter card metadata', () => {
    const metadata = buildLotMetadata(baseLot, { baseUrl, lotUrl });

    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Lote A-01 · 500 m² · Disponible',
    });
    expect(metadata.twitter?.images).toEqual([baseLot.technical_plan_url]);
  });

  it('sets a canonical url', () => {
    const metadata = buildLotMetadata(baseLot, { baseUrl, lotUrl });

    expect(metadata.alternates?.canonical).toBe(`${baseUrl}${lotUrl}`);
  });

  it('omits og:image when the lot has no technical plan', () => {
    const metadata = buildLotMetadata(
      { ...baseLot, technical_plan_url: null },
      { baseUrl, lotUrl }
    );

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
  });
});

describe('buildLotJsonLd', () => {
  it('builds a RealEstateListing schema with core fields', () => {
    const jsonLd = buildLotJsonLd(baseLot, baseUrl);

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('RealEstateListing');
    expect(jsonLd['@id']).toBe(`${baseUrl}/lot/${baseLot.id}`);
    expect(jsonLd.name).toBe('Lote A-01');
    expect(jsonLd.url).toBe(`${baseUrl}/lot/${baseLot.id}`);
    expect(jsonLd.image).toBe(baseLot.technical_plan_url);
  });

  it('includes an offer with price and availability for available lots', () => {
    const jsonLd = buildLotJsonLd(baseLot, baseUrl);

    expect(jsonLd.offers).toEqual({
      '@type': 'Offer',
      price: 75000,
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/lot/${baseLot.id}`,
    });
  });

  it('maps reserved status to LimitedAvailability', () => {
    const jsonLd = buildLotJsonLd({ ...baseLot, status: 'reserved' }, baseUrl);

    expect(jsonLd.offers).toMatchObject({
      availability: 'https://schema.org/LimitedAvailability',
    });
  });

  it('maps sold status to OutOfStock', () => {
    const jsonLd = buildLotJsonLd({ ...baseLot, status: 'sold' }, baseUrl);

    expect(jsonLd.offers).toMatchObject({
      availability: 'https://schema.org/OutOfStock',
    });
  });

  it('omits the offer block when price is null', () => {
    const jsonLd = buildLotJsonLd({ ...baseLot, price: null }, baseUrl);

    expect(jsonLd.offers).toBeUndefined();
  });

  it('omits image when there is no technical plan', () => {
    const jsonLd = buildLotJsonLd({ ...baseLot, technical_plan_url: null }, baseUrl);

    expect(jsonLd.image).toBeUndefined();
  });
});
