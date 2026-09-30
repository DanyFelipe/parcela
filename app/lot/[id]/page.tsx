import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { getLotById, type LotDetails } from '@/lib/showroom/lot-data';
import { formatPrice, formatSurface } from '@/lib/showroom/lot-formatting';
import { buildLotJsonLd, buildLotMetadata } from '@/lib/showroom/lot-metadata';
import { lotStatusConfig } from '@/lib/showroom/lot-status';
import { cn } from '@/lib/utils';

interface LotPageProps {
  params: Promise<{ id: string }>;
}

const legalStatusLabels: Record<NonNullable<LotDetails['legal_status']>, string> = {
  titled: 'Con escritura',
  in_process: 'En trámite',
  not_titled: 'Sin escritura',
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? '';
}

export async function generateMetadata({ params }: LotPageProps): Promise<Metadata> {
  const { id } = await params;
  const lot = await getLotById(id);

  return buildLotMetadata(lot, { baseUrl: getSiteUrl(), lotUrl: `/lot/${id}` });
}

export default async function LotPage({ params }: LotPageProps) {
  const { id } = await params;
  const lot = await getLotById(id);

  if (!lot) {
    notFound();
  }

  const jsonLd = buildLotJsonLd(lot, getSiteUrl());

  const status = lotStatusConfig[lot.status];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'mb-6 text-white/80 hover:bg-white/10 hover:text-white'
          )}
        >
          <ArrowLeft className="mr-2 size-4" />
          Volver al showroom
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{lot.name}</h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white',
                status.dotClass
              )}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-lg text-white/80">
            <p>{formatPrice(lot.price)}</p>
            <p>{formatSurface(lot.surface_area)}</p>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          {lot.technical_plan_url && (
            <div className="order-2 lg:order-1">
              <h2 className="mb-3 text-sm font-medium text-white/60">Plano técnico</h2>
              <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lot.technical_plan_url}
                  alt={`Plano técnico de ${lot.name}`}
                  className="w-full object-contain"
                />
              </div>
            </div>
          )}

          <div className={cn('order-1', lot.technical_plan_url ? 'lg:order-2' : 'lg:col-span-2')}>
            <h2 className="mb-3 text-sm font-medium text-white/60">Ficha técnica</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <dt className="text-xs text-white/50">Orientación</dt>
                <dd className="mt-1 font-medium">{lot.orientation ?? 'No especificada'}</dd>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <dt className="text-xs text-white/50">Tipo de suelo</dt>
                <dd className="mt-1 font-medium">{lot.soil_type ?? 'No especificado'}</dd>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <dt className="text-xs text-white/50">Estado legal</dt>
                <dd className="mt-1 font-medium">
                  {lot.legal_status ? legalStatusLabels[lot.legal_status] : 'No especificado'}
                </dd>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <dt className="text-xs text-white/50">Número de registro</dt>
                <dd className="mt-1 font-medium">{lot.registry_number ?? 'No especificado'}</dd>
              </div>
            </dl>

            <h3 className="mb-3 mt-8 text-sm font-medium text-white/60">Servicios disponibles</h3>
            <ul className="grid gap-3 sm:grid-cols-3">
              <ServiceItem active={lot.has_water_service} label="Agua" />
              <ServiceItem active={lot.has_electricity_service} label="Electricidad" />
              <ServiceItem active={lot.has_sewage_service} label="Cloacas" />
            </ul>

            {lot.encumbrances && (
              <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-medium text-white/60">Gravámenes y observaciones</h3>
                <p className="mt-2 text-white/80">{lot.encumbrances}</p>
              </div>
            )}
          </div>
        </section>

        {lot.description && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-medium text-white/60">Descripción</h2>
            <p className="max-w-3xl whitespace-pre-line text-white/80">{lot.description}</p>
          </section>
        )}

        {lot.image_360_url && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-medium text-white/60">Recorrido 360°</h2>
            <p className="text-white/80">Este lote incluye recorrido visual de 360°.</p>
          </section>
        )}
      </div>
    </main>
  );
}

function ServiceItem({ active, label }: { active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      {active ? (
        <Check className="size-4 text-emerald-400" aria-hidden="true" />
      ) : (
        <X className="size-4 text-white/40" aria-hidden="true" />
      )}
      <span className={cn('text-sm', active ? 'text-white' : 'text-white/50')}>{label}</span>
    </li>
  );
}
