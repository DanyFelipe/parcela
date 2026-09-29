import type { Metadata } from 'next';

import type { LotDetails } from '@/lib/showroom/lot-data';
import { formatPrice, formatSurface } from '@/lib/showroom/lot-formatting';
import { lotStatusConfig } from '@/lib/showroom/lot-status';

export function buildLotMetadata(lot: LotDetails | null): Metadata {
  if (!lot) {
    return {
      title: 'Lote no encontrado',
    };
  }

  const statusLabel = lotStatusConfig[lot.status].label;
  const surface = formatSurface(lot.surface_area);
  const price = formatPrice(lot.price);

  const title = `${lot.name} · ${surface} · ${statusLabel}`;

  const descriptionParts = [
    `Ficha técnica de ${lot.name}: ${surface}, ${statusLabel.toLowerCase()}.`,
  ];

  if (lot.orientation) {
    descriptionParts.push(`Orientación ${lot.orientation.toLowerCase()}.`);
  }

  descriptionParts.push(`Precio: ${price}.`);

  return {
    title,
    description: descriptionParts.join(' '),
  };
}
