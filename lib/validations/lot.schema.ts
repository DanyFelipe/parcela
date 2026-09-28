import { z } from 'zod';

/**
 * Schemas de validación Zod para la tabla `lots`.
 *
 * Estas definiciones se alinean con `docs/schema.sql` y son la base del futuro
 * CRUD en `/admin`. Hoy no hay formulario que las use, pero deben existir desde
 * ya para que cualquier mutación futura valide contra la misma fuente de verdad.
 *
 * Ver `02-architecture.md` §0 y §4.
 */

export const lotStatusSchema = z.enum(['available', 'reserved', 'sold']);
export const legalStatusSchema = z.enum(['titled', 'in_process', 'not_titled']);

function optionalNonNegativeNumber() {
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number().nonnegative().nullable().optional()
  );
}

function optionalPositiveNumber() {
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number().positive().nullable().optional()
  );
}

function optionalUrl() {
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.string().url().nullable().optional()
  );
}

function coerceBoolean(defaultValue?: boolean) {
  const schema = z.preprocess((value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  }, z.boolean());

  return defaultValue !== undefined ? schema.default(defaultValue) : schema;
}

/**
 * Shape completo de una fila de `lots` tal como viene de Supabase.
 */
export const lotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative().nullable(),
  status: lotStatusSchema,
  surface_area: z.number().positive().nullable(),
  orientation: z.string().nullable(),
  image_360_url: z.string().url().nullable(),
  technical_plan_url: z.string().url().nullable(),
  soil_type: z.string().nullable(),
  has_water_service: z.boolean(),
  has_electricity_service: z.boolean(),
  has_sewage_service: z.boolean(),
  legal_status: legalStatusSchema.nullable(),
  encumbrances: z.string().nullable(),
  registry_number: z.string().nullable(),
  description: z.string().nullable(),
  updated_at: z.string().datetime().nullable(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.string().datetime().nullable(),
});

/**
 * Shape público de un lote para la ficha completa (`/lot/[id]`).
 *
 * Es `lotSchema` sin los campos internos/administrativos (`created_at`,
 * `updated_at`, `updated_by`), que no se exponen al visitante del showroom.
 * Debe coincidir exactamente con las columnas que selecciona `getLotById`.
 */
export const lotDetailSchema = lotSchema.omit({
  created_at: true,
  updated_at: true,
  updated_by: true,
});

/**
 * Shape base para insert/update. No incluye campos generados por la base de datos
 * (`id`, `created_at`, `updated_at`, `updated_by`).
 */
const lotInputBaseSchema = z.object({
  name: z.string().min(1),
  price: optionalNonNegativeNumber(),
  status: lotStatusSchema,
  surface_area: optionalPositiveNumber(),
  orientation: z.string().nullable().optional(),
  image_360_url: optionalUrl(),
  technical_plan_url: optionalUrl(),
  soil_type: z.string().nullable().optional(),
  has_water_service: coerceBoolean(),
  has_electricity_service: coerceBoolean(),
  has_sewage_service: coerceBoolean(),
  legal_status: legalStatusSchema.nullable().optional(),
  encumbrances: z.string().nullable().optional(),
  registry_number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

/**
 * Valida los datos para crear un lote. Aplica los defaults que coinciden con
 * `docs/schema.sql` (`status` default 'available', servicios default false).
 */
export const lotInsertSchema = lotInputBaseSchema.extend({
  status: lotStatusSchema.default('available'),
  has_water_service: coerceBoolean(false),
  has_electricity_service: coerceBoolean(false),
  has_sewage_service: coerceBoolean(false),
});

/**
 * Valida los datos para actualizar un lote. Todos los campos son opcionales y
 * no se aplican defaults, para no sobreescribir valores que no se envían.
 */
export const lotUpdateSchema = lotInputBaseSchema.partial();

export type LotSchema = z.infer<typeof lotSchema>;
export type LotDetailSchema = z.infer<typeof lotDetailSchema>;
export type LotInsertSchema = z.infer<typeof lotInsertSchema>;
export type LotUpdateSchema = z.infer<typeof lotUpdateSchema>;
