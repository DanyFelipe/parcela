'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  lotFormSchema,
  lotInsertSchema,
  lotUpdateSchema,
  type LotFormSchema,
  type LotInsertSchema,
  type LotUpdateSchema,
} from '@/lib/validations/lot.schema';

const defaultCreateValues: LotFormSchema = {
  name: '',
  price: null,
  status: 'available',
  surface_area: null,
  orientation: null,
  image_360_url: null,
  technical_plan_url: null,
  soil_type: null,
  has_water_service: false,
  has_electricity_service: false,
  has_sewage_service: false,
  legal_status: null,
  encumbrances: null,
  registry_number: null,
  description: null,
};

type ActionResult = { success: true } | { success: false; message: string };
type CreateSubmit = (data: LotInsertSchema) => Promise<ActionResult>;
type EditSubmit = (lotId: string, data: LotUpdateSchema) => Promise<ActionResult>;

type LotFormProps =
  | { mode: 'create'; lotId?: never; submit: CreateSubmit; defaultValues?: LotFormSchema }
  | { mode: 'edit'; lotId: string; submit: EditSubmit; defaultValues: LotFormSchema };

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-input/30 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const selectClass = `${inputClass} appearance-none`;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function normalizeEmptyStrings(data: LotFormSchema): LotFormSchema {
  return {
    ...data,
    orientation: data.orientation?.trim() || null,
    soil_type: data.soil_type?.trim() || null,
    registry_number: data.registry_number?.trim() || null,
    encumbrances: data.encumbrances?.trim() || null,
    description: data.description?.trim() || null,
  };
}

export function LotForm(props: LotFormProps) {
  const { mode, submit } = props;
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LotFormSchema>({
    resolver: zodResolver(lotFormSchema) as unknown as Resolver<LotFormSchema>,
    defaultValues: mode === 'edit' ? props.defaultValues : defaultCreateValues,
  });

  async function onSubmit(data: LotFormSchema) {
    setActionError(null);
    setIsSubmitting(true);

    try {
      const normalized = normalizeEmptyStrings(data);

      if (mode === 'create') {
        const result = await (submit as CreateSubmit)(lotInsertSchema.parse(normalized));
        if (!result.success) {
          setActionError(result.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await (submit as EditSubmit)(props.lotId, lotUpdateSchema.parse(normalized));
        if (!result.success) {
          setActionError(result.message);
          setIsSubmitting(false);
          return;
        }
      }

      router.replace('/admin');
      router.refresh();
    } catch (error) {
      setIsSubmitting(false);
      setActionError(error instanceof Error ? error.message : 'Error inesperado');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {actionError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Field label="Nombre" error={errors.name?.message}>
              <input {...field} value={field.value ?? ''} className={inputClass} />
            </Field>
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Field label="Estado" error={errors.status?.message}>
              <select {...field} className={selectClass}>
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="sold">Vendido</option>
              </select>
            </Field>
          )}
        />

        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <Field label="Precio (USD)" error={errors.price?.message}>
              <input
                type="number"
                min="0"
                step="any"
                {...field}
                value={field.value ?? ''}
                className={inputClass}
              />
            </Field>
          )}
        />

        <Controller
          name="surface_area"
          control={control}
          render={({ field }) => (
            <Field label="Superficie (m²)" error={errors.surface_area?.message}>
              <input
                type="number"
                min="0"
                step="any"
                {...field}
                value={field.value ?? ''}
                className={inputClass}
              />
            </Field>
          )}
        />

        <Controller
          name="orientation"
          control={control}
          render={({ field }) => (
            <Field label="Orientación" error={errors.orientation?.message}>
              <input {...field} value={field.value ?? ''} className={inputClass} />
            </Field>
          )}
        />

        <Controller
          name="soil_type"
          control={control}
          render={({ field }) => (
            <Field label="Tipo de suelo" error={errors.soil_type?.message}>
              <input {...field} value={field.value ?? ''} className={inputClass} />
            </Field>
          )}
        />

        <Controller
          name="legal_status"
          control={control}
          render={({ field }) => (
            <Field label="Situación legal" error={errors.legal_status?.message}>
              <select
                {...field}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : event.target.value)
                }
                className={selectClass}
              >
                <option value="">Sin especificar</option>
                <option value="titled">Titulado</option>
                <option value="in_process">En trámite</option>
                <option value="not_titled">No titulado</option>
              </select>
            </Field>
          )}
        />

        <Controller
          name="registry_number"
          control={control}
          render={({ field }) => (
            <Field label="Número de matrícula" error={errors.registry_number?.message}>
              <input {...field} value={field.value ?? ''} className={inputClass} />
            </Field>
          )}
        />

        <Controller
          name="image_360_url"
          control={control}
          render={({ field }) => (
            <Field label="URL vista 360°" error={errors.image_360_url?.message}>
              <input {...field} value={field.value ?? ''} className={inputClass} />
            </Field>
          )}
        />

        <Controller
          name="technical_plan_url"
          control={control}
          render={({ field }) => (
            <Field label="URL plano técnico" error={errors.technical_plan_url?.message}>
              <input {...field} value={field.value ?? ''} className={inputClass} />
            </Field>
          )}
        />
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium">Servicios</span>
        <div className="flex flex-wrap gap-6">
          <Controller
            name="has_water_service"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-4 rounded border-border"
                />
                Agua
              </label>
            )}
          />
          <Controller
            name="has_electricity_service"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-4 rounded border-border"
                />
                Electricidad
              </label>
            )}
          />
          <Controller
            name="has_sewage_service"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="size-4 rounded border-border"
                />
                Cloacas
              </label>
            )}
          />
        </div>
      </div>

      <Controller
        name="encumbrances"
        control={control}
        render={({ field }) => (
          <Field label="Limitaciones / gravámenes" error={errors.encumbrances?.message}>
            <textarea
              {...field}
              value={field.value ?? ''}
              className={`${inputClass} min-h-[80px]`}
            />
          </Field>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Field label="Descripción" error={errors.description?.message}>
            <textarea
              {...field}
              value={field.value ?? ''}
              className={`${inputClass} min-h-[120px]`}
            />
          </Field>
        )}
      />

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear lote' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
