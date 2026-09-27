'use client';

import { Home, LayoutGrid, MapPin } from 'lucide-react';
import type { ComponentType } from 'react';

import type { FeatureHotspotData } from '@/lib/showroom/showroom-data';
import type { ShowroomView } from '@/lib/store/showroom.store';

interface IconProps {
  size?: number;
  'aria-hidden'?: boolean;
}

const iconByName: Record<string, ComponentType<IconProps>> = {
  'layout-grid': LayoutGrid,
  home: Home,
  'map-pin': MapPin,
};

export interface FeatureHotspotProps {
  feature: FeatureHotspotData;
  onNavigate: (targetViewId: ShowroomView) => void;
  onShowInfo: (feature: FeatureHotspotData) => void;
}

export function FeatureHotspot({ feature, onNavigate, onShowInfo }: FeatureHotspotProps) {
  function handleClick(): void {
    if (feature.action === 'navigate_to_view' && feature.target_view_id) {
      onNavigate(feature.target_view_id);
      return;
    }

    onShowInfo(feature);
  }

  const IconComponent = feature.icon ? iconByName[feature.icon] : null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{
        left: `${feature.hotspot_x}%`,
        top: `${feature.hotspot_y}%`,
      }}
      aria-label={feature.title}
      data-testid="feature-hotspot"
      data-feature-type={feature.type}
      data-feature-action={feature.action}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-[0_0_0_2px_rgba(0,0,0,0.4)] ring-2 ring-white/50 transition-transform duration-150 group-hover:scale-110 group-focus-visible:scale-110">
        {IconComponent && <IconComponent size={16} aria-hidden />}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {feature.title}
      </span>
    </button>
  );
}
