'use client';

import type { LotStatus } from '@/lib/showroom/showroom-data';
import { lotStatusConfig } from '@/lib/showroom/lot-status';

interface LotStatusLegendProps {
  statuses?: LotStatus[];
  fadingOut?: boolean;
}

export function LotStatusLegend({ statuses = [], fadingOut = false }: LotStatusLegendProps) {
  if (statuses.length === 0) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-black/55 px-3 py-2 shadow-lg backdrop-blur-sm transition-opacity duration-200 sm:left-6 sm:top-6 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-label="Leyenda de estados de lotes"
      data-testid="lot-status-legend"
    >
      <ul className="flex flex-wrap items-center gap-3">
        {statuses.map((status) => {
          const config = lotStatusConfig[status];

          return (
            <li key={status} className="flex items-center gap-1.5 text-xs text-white/90">
              <span
                className={`block size-2 rounded-full shadow-[0_0_0_1.5px_rgba(0,0,0,0.5)] ring-1 ring-white/80 ${config.dotClass} ${config.shadowClass}`}
                aria-hidden="true"
              />
              {config.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
