import { beforeEach, describe, expect, it, vi } from 'vitest';

const lotDataMocks = vi.hoisted(() => ({
  getLotById: vi.fn(),
}));

vi.mock('@/lib/showroom/lot-data', () => lotDataMocks);

import LotPage, { generateMetadata } from '@/app/lot/[id]/page';

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
  description: 'Lote con excelente orientación norte.',
};

function createParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe('LotPage generateMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns lot-specific metadata when the lot exists', async () => {
    lotDataMocks.getLotById.mockResolvedValue(baseLot);

    const metadata = await generateMetadata({ params: createParams(baseLot.id) });

    expect(metadata.title).toBe('Lote A-01 — Parcela');
    expect(metadata.description).toContain('500 m²');
    expect(metadata.description).toContain('disponible');
  });

  it('returns a not-found title when the lot does not exist', async () => {
    lotDataMocks.getLotById.mockResolvedValue(null);

    const metadata = await generateMetadata({ params: createParams('missing-id') });

    expect(metadata.title).toBe('Lote no encontrado');
  });
});

describe('LotPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when the lot does not exist', async () => {
    lotDataMocks.getLotById.mockResolvedValue(null);

    await expect(LotPage({ params: createParams('missing-id') })).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;404'
    );
  });

  it('renders lot details when the lot exists', async () => {
    lotDataMocks.getLotById.mockResolvedValue(baseLot);

    const jsx = await LotPage({ params: createParams(baseLot.id) });
    expect(jsx).toBeDefined();
  });
});
