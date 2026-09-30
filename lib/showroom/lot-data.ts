import { createClient } from '@/lib/supabase/server';
import {
  lotDetailSchema,
  lotStatusSchema,
  type LotDetailSchema,
} from '@/lib/validations/lot.schema';

/**
 * Shape público de un lote tal como se muestra en la ficha completa `/lot/[id]`.
 * Derivado de `lotDetailSchema` para que la validación y el tipo sean la misma
 * fuente de verdad (ver `lib/validations/lot.schema.ts`).
 */
export type LotDetails = LotDetailSchema;

export async function getLotById(id: string): Promise<LotDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lots')
    .select(
      'id, name, price, status, surface_area, orientation, image_360_url, technical_plan_url, soil_type, has_water_service, has_electricity_service, has_sewage_service, legal_status, encumbrances, registry_number, description'
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const parsed = lotDetailSchema.safeParse(data);

  if (!parsed.success) {
    console.error('Lot data validation failed', { id, issues: parsed.error.issues });
    return null;
  }

  return parsed.data;
}

/**
 * Devuelve los IDs de los lotes "activos" para el sitemap: disponibles o reservados.
 * Excluye los vendidos (`sold`) porque ya no son ofertas activas.
 */
export async function getActiveLotIds(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('lots').select('id, status').neq('status', 'sold');

  if (error || !data) {
    console.error('Error loading active lot ids', { error });
    return [];
  }

  return data
    .filter((row): row is { id: string; status: LotDetailSchema['status'] } => {
      return (
        typeof row.id === 'string' &&
        lotStatusSchema.safeParse(row.status).success &&
        row.status !== 'sold'
      );
    })
    .map((row) => row.id);
}
