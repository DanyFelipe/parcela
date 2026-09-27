'use client';

import { FeatureHotspot } from '@/components/showroom/FeatureHotspot';
import { HotspotsLayer } from '@/components/showroom/HotspotsLayer';
import type { FeatureHotspotData } from '@/lib/showroom/showroom-data';
import type { ShowroomView } from '@/lib/store/showroom.store';

interface FeatureHotspotsLayerProps {
  featureHotspots: FeatureHotspotData[];
  fadingOut: boolean;
  onNavigate: (targetViewId: ShowroomView) => void;
  onShowInfo: (feature: FeatureHotspotData) => void;
}

export function FeatureHotspotsLayer({
  featureHotspots,
  fadingOut,
  onNavigate,
  onShowInfo,
}: FeatureHotspotsLayerProps) {
  return (
    <HotspotsLayer fadingOut={fadingOut} testId="feature-hotspots-layer">
      {featureHotspots.map((feature) => (
        <FeatureHotspot
          key={feature.id}
          feature={feature}
          onNavigate={onNavigate}
          onShowInfo={onShowInfo}
        />
      ))}
    </HotspotsLayer>
  );
}
