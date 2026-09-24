'use client';

import type { LotData, LotHotspotData } from '@/lib/showroom/showroom-data';

export interface HotspotProps {
  lot: LotData;
  hotspot: LotHotspotData;
  onClick: (lotId: string) => void;
}

function statusColorClass(status: LotData['status']): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500 shadow-emerald-500/50';
    case 'reserved':
      return 'bg-amber-500 shadow-amber-500/50';
    case 'sold':
      return 'bg-rose-500 shadow-rose-500/50';
    default:
      return 'bg-zinc-400 shadow-zinc-400/50';
  }
}

export function Hotspot({ lot, hotspot, onClick }: HotspotProps) {
  function handleClick(): void {
    onClick(lot.id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{
        left: `${hotspot.hotspot_x}%`,
        top: `${hotspot.hotspot_y}%`,
      }}
      aria-label={`Ver detalle de ${lot.name}`}
      data-testid="lot-hotspot"
      data-lot-id={lot.id}
      data-lot-status={lot.status}
    >
      <span
        className={`block size-3 rounded-full shadow-[0_0_0_2px_rgba(0,0,0,0.5)] ring-2 ring-white/80 transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 ${statusColorClass(lot.status)}`}
      />
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {lot.name}
      </span>
    </button>
  );
}
