import type { LotStatus } from '@/lib/showroom/showroom-data';

export const lotStatusConfig: Record<
  LotStatus,
  { label: string; dotClass: string; badgeClass: string; shadowClass: string }
> = {
  available: {
    label: 'Disponible',
    dotClass: 'bg-status-available',
    badgeClass: 'bg-status-available text-status-available-foreground',
    shadowClass: 'shadow-status-available/50',
  },
  reserved: {
    label: 'Reservado',
    dotClass: 'bg-status-reserved',
    badgeClass: 'bg-status-reserved text-status-reserved-foreground',
    shadowClass: 'shadow-status-reserved/50',
  },
  sold: {
    label: 'Vendido',
    dotClass: 'bg-status-sold',
    badgeClass: 'bg-status-sold text-status-sold-foreground',
    shadowClass: 'shadow-status-sold/50',
  },
};

export function statusColorClass(status: LotStatus): string {
  const config = lotStatusConfig[status];

  if (!config) {
    return 'bg-muted-foreground shadow-muted-foreground/50';
  }

  return `${config.dotClass} ${config.shadowClass}`;
}

export type LotLegalStatus = 'titled' | 'in_process' | 'not_titled';

export const legalStatusLabels: Record<LotLegalStatus, string> = {
  titled: 'Con escritura',
  in_process: 'En trámite',
  not_titled: 'Sin escritura',
};
