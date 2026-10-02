import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LotServices } from '@/components/showroom/LotServices';
import { LotSpecs } from '@/components/showroom/LotSpecs';
import { LotTechnicalPlan } from '@/components/showroom/LotTechnicalPlan';
import { Viewer360 } from '@/components/showroom/Viewer360';
import { getLotById } from '@/lib/showroom/lot-data';
import { formatPrice, formatSurface } from '@/lib/showroom/lot-formatting';
import { buildLotJsonLd, buildLotMetadata } from '@/lib/showroom/lot-metadata';
import { lotStatusConfig } from '@/lib/showroom/lot-status';
import { cn } from '@/lib/utils';

interface LotPageProps {
  params: Promise<{ id: string }>;
}

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
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-[calc(env(safe-area-inset-top)+5rem)] sm:px-6 sm:pb-8 sm:pt-[calc(env(safe-area-inset-top)+6rem)] lg:pb-12">
        <header className="mb-6 sm:mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{lot.name}</h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                status.badgeClass
              )}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-base text-foreground/80 sm:mt-4 sm:text-lg">
            <p>{formatPrice(lot.price)}</p>
            <p>{formatSurface(lot.surface_area)}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:gap-8 lg:grid-cols-2">
          {lot.technical_plan_url && (
            <div className="order-2 lg:order-1">
              <LotTechnicalPlan imageUrl={lot.technical_plan_url} lotName={lot.name} />
            </div>
          )}

          <div className={cn('order-1', lot.technical_plan_url ? 'lg:order-2' : 'lg:col-span-2')}>
            <LotSpecs
              orientation={lot.orientation}
              soilType={lot.soil_type}
              legalStatus={lot.legal_status}
              registryNumber={lot.registry_number}
              encumbrances={lot.encumbrances}
            />

            <div className="mt-4 sm:mt-8">
              <LotServices
                water={lot.has_water_service}
                electricity={lot.has_electricity_service}
                sewage={lot.has_sewage_service}
              />
            </div>
          </div>
        </section>

        {lot.description && (
          <section
            className="glass-panel mt-6 rounded-2xl p-4 sm:mt-10 sm:p-6"
            aria-labelledby="lot-description-heading"
          >
            <h2
              id="lot-description-heading"
              className="mb-3 text-sm font-medium text-muted-foreground"
            >
              Descripción
            </h2>
            <p className="max-w-3xl whitespace-pre-line text-foreground/85">{lot.description}</p>
          </section>
        )}

        {lot.image_360_url && (
          <section className="mt-6 sm:mt-10">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recorrido 360°</h2>
            <Viewer360 imageUrl={lot.image_360_url} />
          </section>
        )}
      </div>
    </main>
  );
}
