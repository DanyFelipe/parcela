import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BackToShowroomLink } from '@/components/showroom/BackToShowroomLink';
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
    <main className="min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6">
          <BackToShowroomLink />
        </div>

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

            <div className="mt-8">
              <LotServices
                water={lot.has_water_service}
                electricity={lot.has_electricity_service}
                sewage={lot.has_sewage_service}
              />
            </div>
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
            <Viewer360 imageUrl={lot.image_360_url} />
          </section>
        )}
      </div>
    </main>
  );
}
