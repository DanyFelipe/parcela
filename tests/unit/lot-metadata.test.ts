import { describe, expect, it } from 'vitest';

import { buildLotMetadata } from '@/lib/showroom/lot-metadata';

const baseLot = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Lote A-01',
  price: 75000,
  status: 'available' as const,
  surface_area: 500,
  orientation: 'Norte',
  image_360_url: null,
  technical_plan_url: null,
  soil_type: 'Arcilloso',
  has_water_service: true,
  has_electricity_service: true,
  has_sewage_service: false,
  legal_status: 'titled' as const,
  encumbrances: null,
  registry_number: 'R-12345',
  description: 'Lote amplio.',
};

describe('buildLotMetadata', () => {
  it('returns a not-found title when there is no lot', () => {
    const metadata = buildLotMetadata(null);

    expect(metadata.title).toBe('Lote no encontrado');
    expect(metadata.description).toBeUndefined();
  });

  it('builds a title with name, surface and status', () => {
    const metadata = buildLotMetadata(baseLot);

    expect(metadata.title).toBe('Lote A-01 · 500 m² · Disponible');
  });

  it('builds a description with surface, status, orientation and price', () => {
    const metadata = buildLotMetadata(baseLot);

    expect(metadata.description).toContain('Lote A-01');
    expect(metadata.description).toContain('500 m²');
    expect(metadata.description).toContain('disponible');
    expect(metadata.description).toContain('Orientación norte');
    expect(metadata.description).toContain('$ 75.000');
  });

  it('uses the fallback price label when price is null', () => {
    const metadata = buildLotMetadata({ ...baseLot, price: null });

    expect(metadata.description).toContain('Consultar precio');
  });

  it('omits orientation from description when it is null', () => {
    const metadata = buildLotMetadata({ ...baseLot, orientation: null });

    expect(metadata.description).not.toContain('Orientación');
    expect(metadata.description).toContain('Lote A-01');
  });
});
