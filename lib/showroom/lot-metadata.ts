import type { Metadata } from 'next';

import type { LotDetails } from '@/lib/showroom/lot-data';
import { formatPrice, formatSurface } from '@/lib/showroom/lot-formatting';
import { lotStatusConfig } from '@/lib/showroom/lot-status';

interface BuildLotMetadataOptions {
  baseUrl: string;
  lotUrl: string;
}

const availabilityByStatus: Record<LotDetails['status'], string> = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/LimitedAvailability',
  sold: 'https://schema.org/OutOfStock',
};

function buildLotDescription(lot: LotDetails): string {
  const statusLabel = lotStatusConfig[lot.status].label;
  const surface = formatSurface(lot.surface_area);
  const price = formatPrice(lot.price);

  const descriptionParts = [
    `Ficha técnica de ${lot.name}: ${surface}, ${statusLabel.toLowerCase()}.`,
  ];

  if (lot.orientation) {
    descriptionParts.push(`Orientación ${lot.orientation.toLowerCase()}.`);
  }

  descriptionParts.push(`Precio: ${price}.`);

  return descriptionParts.join(' ');
}

export function buildLotMetadata(
  lot: LotDetails | null,
  options: BuildLotMetadataOptions
): Metadata {
  if (!lot) {
    return {
      title: 'Lote no encontrado',
    };
  }

  const statusLabel = lotStatusConfig[lot.status].label;
  const surface = formatSurface(lot.surface_area);
  const title = `${lot.name} · ${surface} · ${statusLabel}`;
  const description = buildLotDescription(lot);
  const absoluteLotUrl = `${options.baseUrl}${options.lotUrl}`;
  const imageUrl = lot.technical_plan_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: absoluteLotUrl,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    alternates: {
      canonical: absoluteLotUrl,
    },
  };
}

export function buildLotJsonLd(lot: LotDetails, baseUrl: string): Record<string, unknown> {
  const lotUrl = `${baseUrl}/lot/${lot.id}`;
  const description = buildLotDescription(lot);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': lotUrl,
    name: lot.name,
    description,
    url: lotUrl,
  };

  if (lot.technical_plan_url) {
    jsonLd.image = lot.technical_plan_url;
  }

  if (lot.price !== null) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: lot.price,
      priceCurrency: 'ARS',
      availability: availabilityByStatus[lot.status],
      url: lotUrl,
    };
  }

  return jsonLd;
}
