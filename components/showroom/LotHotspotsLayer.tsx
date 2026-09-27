'use client';

import { Hotspot } from '@/components/showroom/Hotspot';
import { HotspotsLayer } from '@/components/showroom/HotspotsLayer';
import type { LotData, LotHotspotData } from '@/lib/showroom/showroom-data';

interface LotHotspotsLayerProps {
  lots: LotData[];
  lotHotspots: LotHotspotData[];
  fadingOut: boolean;
  onHotspotClick: (lotId: string) => void;
}

export function LotHotspotsLayer({
  lots,
  lotHotspots,
  fadingOut,
  onHotspotClick,
}: LotHotspotsLayerProps) {
  const lotById = new Map(lots.map((lot) => [lot.id, lot]));

  return (
    <HotspotsLayer fadingOut={fadingOut} testId="lot-hotspots-layer">
      {lotHotspots.map((hotspot) => {
        const lot = lotById.get(hotspot.lot_id);
        if (!lot) {
          return null;
        }

        return <Hotspot key={hotspot.id} lot={lot} hotspot={hotspot} onClick={onHotspotClick} />;
      })}
    </HotspotsLayer>
  );
}
