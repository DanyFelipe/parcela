import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server';
import { lotSchema, type LotSchema } from '@/lib/validations/lot.schema';

export async function getLotsForAdmin(): Promise<LotSchema[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    Sentry.captureException(error, { tags: { area: 'admin', action: 'getLotsForAdmin' } });
    throw new Error('No se pudieron cargar los lotes.');
  }

  return (data ?? []).flatMap((row) => {
    const parsed = lotSchema.safeParse(row);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.path.join('.'));
      console.error('Admin lot list row failed validation', { issues });
      Sentry.captureMessage('Admin lot list row failed validation', {
        level: 'warning',
        tags: { area: 'admin', action: 'getLotsForAdmin' },
        extra: { issues },
      });
      return [];
    }

    return [parsed.data];
  });
}

export async function getLotByIdForAdmin(id: string): Promise<LotSchema | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('lots').select('*').eq('id', id).single();

  if (error || !data) {
    return null;
  }

  const parsed = lotSchema.safeParse(data);

  if (!parsed.success) {
    Sentry.captureMessage('Admin lot detail failed validation', {
      level: 'warning',
      tags: { area: 'admin', action: 'getLotByIdForAdmin' },
      extra: { issues: parsed.error.issues.map((issue) => issue.path.join('.')) },
    });
    return null;
  }

  return parsed.data;
}
