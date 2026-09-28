import type { LotStatus } from '@/lib/showroom/showroom-data';

export const lotStatusConfig: Record<
  LotStatus,
  { label: string; dotClass: string; shadowClass: string }
> = {
  available: {
    label: 'Disponible',
    dotClass: 'bg-emerald-500',
    shadowClass: 'shadow-emerald-500/50',
  },
  reserved: {
    label: 'Reservado',
    dotClass: 'bg-amber-500',
    shadowClass: 'shadow-amber-500/50',
  },
  sold: {
    label: 'Vendido',
    dotClass: 'bg-rose-500',
    shadowClass: 'shadow-rose-500/50',
  },
};

export function statusColorClass(status: LotStatus): string {
  const config = lotStatusConfig[status];

  if (!config) {
    return 'bg-zinc-400 shadow-zinc-400/50';
  }

  return `${config.dotClass} ${config.shadowClass}`;
}
