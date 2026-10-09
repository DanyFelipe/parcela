'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { lotIdSchema, lotInsertSchema, lotUpdateSchema } from '@/lib/validations/lot.schema';

type ActionResult = { success: true } | { success: false; message: string };

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AdminContext {
  supabase: ServerSupabaseClient;
  userId: string;
}

const SESSION_EXPIRED_MESSAGE = 'Tu sesión venció. Iniciá sesión nuevamente.';
const INVALID_DATA_MESSAGE = 'Revisá los datos ingresados e intentá nuevamente.';
const INVALID_LOT_MESSAGE = 'El lote indicado no es válido.';
const INVALID_HOTSPOT_MESSAGE = 'La posición del hotspot no es válida.';

const hotspotSchema = z.object({
  lotId: lotIdSchema,
  viewId: z.literal('top'),
  hotspotX: z.number().finite().min(0).max(100),
  hotspotY: z.number().finite().min(0).max(100),
});

/**
 * Valida la sesión contra Supabase Auth (no solo la cookie) y rechaza usuarios
 * anónimos: en Supabase tienen rol `authenticated`, pero no son administradores.
 */
async function requireAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.is_anonymous) {
    return null;
  }

  return { supabase, userId: user.id };
}

function revalidateAdminPaths(lotId?: string): void {
  revalidatePath('/admin');
  revalidatePath('/');

  if (lotId) {
    revalidatePath(`/lot/${lotId}`);
  }
}

/**
 * Ejecuta una mutación administrativa con el mismo contrato en todas las acciones:
 * - sin sesión administrativa válida → mensaje de sesión vencida;
 * - `work` devuelve un mensaje de validación (string) o `null` si tuvo éxito;
 * - cualquier error inesperado (incluido el de Supabase) se reporta a Sentry y al
 *   usuario solo llega el mensaje genérico `fallbackMessage`, nunca el error crudo.
 */
async function runAdminAction(
  action: string,
  fallbackMessage: string,
  work: (context: AdminContext) => Promise<string | null>
): Promise<ActionResult> {
  try {
    const context = await requireAdminContext();

    if (!context) {
      return { success: false, message: SESSION_EXPIRED_MESSAGE };
    }

    const validationMessage = await work(context);

    if (validationMessage) {
      return { success: false, message: validationMessage };
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, { tags: { area: 'admin', action } });
    return { success: false, message: fallbackMessage };
  }
}

export async function createLot(input: unknown): Promise<ActionResult> {
  return runAdminAction(
    'createLot',
    'No se pudo crear el lote. Intentá nuevamente.',
    async ({ supabase, userId }) => {
      const parsed = lotInsertSchema.safeParse(input);
      if (!parsed.success) return INVALID_DATA_MESSAGE;

      const { error } = await supabase.from('lots').insert({
        ...parsed.data,
        updated_by: userId,
      });
      if (error) throw error;

      revalidateAdminPaths();
      return null;
    }
  );
}

export async function updateLot(lotId: string, input: unknown): Promise<ActionResult> {
  return runAdminAction(
    'updateLot',
    'No se pudo actualizar el lote. Intentá nuevamente.',
    async ({ supabase, userId }) => {
      const parsedId = lotIdSchema.safeParse(lotId);
      if (!parsedId.success) return INVALID_LOT_MESSAGE;

      const parsedLot = lotUpdateSchema.safeParse(input);
      if (!parsedLot.success) return INVALID_DATA_MESSAGE;

      const { error } = await supabase
        .from('lots')
        .update({
          ...parsedLot.data,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parsedId.data);
      if (error) throw error;

      revalidateAdminPaths(parsedId.data);
      return null;
    }
  );
}

export async function deleteLot(lotId: string): Promise<ActionResult> {
  return runAdminAction(
    'deleteLot',
    'No se pudo eliminar el lote. Intentá nuevamente.',
    async ({ supabase }) => {
      const parsedId = lotIdSchema.safeParse(lotId);
      if (!parsedId.success) return INVALID_LOT_MESSAGE;

      const { error } = await supabase.from('lots').delete().eq('id', parsedId.data);
      if (error) throw error;

      revalidateAdminPaths(parsedId.data);
      return null;
    }
  );
}

export async function upsertLotHotspot(
  lotId: string,
  viewId: string,
  hotspotX: number,
  hotspotY: number
): Promise<ActionResult> {
  return runAdminAction(
    'upsertLotHotspot',
    'No se pudo guardar el hotspot. Intentá nuevamente.',
    async ({ supabase }) => {
      const parsed = hotspotSchema.safeParse({ lotId, viewId, hotspotX, hotspotY });
      if (!parsed.success) return INVALID_HOTSPOT_MESSAGE;

      const { error } = await supabase.from('lot_hotspots').upsert(
        {
          lot_id: parsed.data.lotId,
          view_id: parsed.data.viewId,
          hotspot_x: parsed.data.hotspotX,
          hotspot_y: parsed.data.hotspotY,
        },
        { onConflict: 'lot_id,view_id' }
      );
      if (error) throw error;

      revalidateAdminPaths(parsed.data.lotId);
      return null;
    }
  );
}

export async function deleteLotHotspot(lotId: string, viewId: string): Promise<ActionResult> {
  return runAdminAction(
    'deleteLotHotspot',
    'No se pudo eliminar el hotspot. Intentá nuevamente.',
    async ({ supabase }) => {
      const parsed = z
        .object({ lotId: lotIdSchema, viewId: z.literal('top') })
        .safeParse({ lotId, viewId });
      if (!parsed.success) return INVALID_HOTSPOT_MESSAGE;

      const { error } = await supabase
        .from('lot_hotspots')
        .delete()
        .eq('lot_id', parsed.data.lotId)
        .eq('view_id', parsed.data.viewId);
      if (error) throw error;

      revalidateAdminPaths(parsed.data.lotId);
      return null;
    }
  );
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    Sentry.captureException(error, { tags: { area: 'admin', action: 'logout' } });
    throw new Error('No se pudo cerrar la sesión. Intentá nuevamente.');
  }

  redirect('/admin/login');
}
