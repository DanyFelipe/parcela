'use client';

import type { LotData, LotHotspotData } from '@/lib/showroom/showroom-data';
import { lotStatusConfig, statusColorClass } from '@/lib/showroom/lot-status';

export interface HotspotProps {
  lot: LotData;
  hotspot: LotHotspotData;
  onClick: (lotId: string) => void;
}

export function Hotspot({ lot, hotspot, onClick }: HotspotProps) {
  function handleClick(): void {
    onClick(lot.id);
  }

  const statusLabel = lotStatusConfig[lot.status]?.label ?? lot.status;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group absolute -translate-x-1/2 -translate-y-1/2 before:absolute before:-inset-3 before:content-[''] focus:outline-none"
      style={{
        left: `${hotspot.hotspot_x}%`,
        top: `${hotspot.hotspot_y}%`,
      }}
      aria-label={`Ver detalle de ${lot.name} - ${statusLabel}`}
      data-testid="lot-hotspot"
      data-lot-id={lot.id}
      data-lot-status={lot.status}
    >
      <span
        className={`block size-2.5 rounded-full shadow-hotspot ring-2 ring-status-dot-ring transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 ${statusColorClass(lot.status)}`}
      />
      <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-xs font-medium text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {lot.name}
      </span>
    </button>
  );
}
