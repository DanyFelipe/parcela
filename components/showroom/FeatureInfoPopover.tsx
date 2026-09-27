'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface FeatureHotspotInfo {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

interface FeatureInfoPopoverProps {
  feature: FeatureHotspotInfo;
  onClose: () => void;
}

export function FeatureInfoPopover({ feature, onClose }: FeatureInfoPopoverProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-6 sm:bottom-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`feature-title-${feature.id}`}
      data-testid="feature-info-popover"
    >
      <div className="relative w-full max-w-md rounded-lg bg-black/75 p-5 text-white shadow-lg backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar información"
          className="absolute right-2 top-2 text-white hover:bg-white/10"
        >
          <X size={18} />
        </Button>
        <h2 id={`feature-title-${feature.id}`} className="pr-8 text-lg font-semibold">
          {feature.title}
        </h2>
        {feature.description && <p className="mt-2 text-sm text-white/80">{feature.description}</p>}
      </div>
    </div>
  );
}
