import { describe, expect, it } from 'vitest';

import {
  legalStatusSchema,
  lotInsertSchema,
  lotSchema,
  lotStatusSchema,
  lotUpdateSchema,
} from '@/lib/validations/lot.schema';

describe('lotStatusSchema', () => {
  it.each(['available', 'reserved', 'sold'] as const)('accepts the valid status "%s"', (status) => {
    expect(lotStatusSchema.parse(status)).toBe(status);
  });

  it('rejects an invalid status', () => {
    expect(() => lotStatusSchema.parse('pending')).toThrow();
  });
});

describe('legalStatusSchema', () => {
  it.each(['titled', 'in_process', 'not_titled'] as const)(
    'accepts the valid legal status "%s"',
    (status) => {
      expect(legalStatusSchema.parse(status)).toBe(status);
    }
  );

  it('rejects an invalid legal status', () => {
    expect(() => legalStatusSchema.parse('unknown')).toThrow();
  });
});

describe('lotSchema', () => {
  const baseLot = {
    id: 'd2519ea0-6e12-449d-9588-eb3cff4a9691',
    name: 'Lote A-01',
    price: 100000,
    status: 'available',
    surface_area: 500,
    orientation: 'Norte',
    image_360_url: null,
    technical_plan_url: null,
    soil_type: 'Arcilloso',
    has_water_service: true,
    has_electricity_service: false,
    has_sewage_service: false,
    legal_status: 'titled',
    encumbrances: null,
    registry_number: '12345',
    description: 'Lote amplio con vista al lago.',
    updated_at: '2026-09-28T00:00:00Z',
    updated_by: null,
    created_at: '2026-09-28T00:00:00Z',
  };

  it('validates a complete lot row from Supabase', () => {
    expect(lotSchema.parse(baseLot)).toEqual(baseLot);
  });

  it('rejects a negative price', () => {
    expect(() => lotSchema.parse({ ...baseLot, price: -1 })).toThrow();
  });

  it('rejects a non-positive surface area', () => {
    expect(() => lotSchema.parse({ ...baseLot, surface_area: 0 })).toThrow();
  });

  it('rejects an invalid status value', () => {
    expect(() => lotSchema.parse({ ...baseLot, status: 'pending' })).toThrow();
  });

  it('rejects an invalid legal status value', () => {
    expect(() => lotSchema.parse({ ...baseLot, legal_status: 'other' })).toThrow();
  });
});

describe('lotInsertSchema', () => {
  it('validates minimal valid insert data', () => {
    const result = lotInsertSchema.parse({ name: 'Lote A-02' });

    expect(result).toEqual({
      name: 'Lote A-02',
      status: 'available',
      has_water_service: false,
      has_electricity_service: false,
      has_sewage_service: false,
    });
  });

  it('coerces string price into a number', () => {
    const result = lotInsertSchema.parse({ name: 'Lote A-02', price: '125000' });

    expect(result.price).toBe(125000);
  });

  it('coerces empty price string to null', () => {
    const result = lotInsertSchema.parse({ name: 'Lote A-02', price: '' });

    expect(result.price).toBeNull();
  });

  it('coerces service checkbox strings to booleans', () => {
    const result = lotInsertSchema.parse({
      name: 'Lote A-02',
      has_water_service: 'true',
      has_electricity_service: 'false',
    });

    expect(result.has_water_service).toBe(true);
    expect(result.has_electricity_service).toBe(false);
  });
});

describe('lotUpdateSchema', () => {
  it('accepts a partial update without applying defaults', () => {
    const result = lotUpdateSchema.parse({ price: '95000' });

    expect(result).toEqual({ price: 95000 });
  });

  it('accepts a status change only', () => {
    const result = lotUpdateSchema.parse({ status: 'sold' });

    expect(result).toEqual({ status: 'sold' });
  });

  it('rejects an invalid status in an update', () => {
    expect(() => lotUpdateSchema.parse({ status: 'pending' })).toThrow();
  });
});
