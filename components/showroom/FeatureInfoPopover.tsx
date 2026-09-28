'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Home, LayoutGrid, MapPin, X, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface FeatureHotspotInfo {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

interface FeatureInfoPopoverProps {
  feature: FeatureHotspotInfo | null;
  onClose: () => void;
}

const iconByName: Record<string, LucideIcon> = {
  'layout-grid': LayoutGrid,
  home: Home,
  'map-pin': MapPin,
};

export function FeatureInfoPopover({ feature, onClose }: FeatureInfoPopoverProps) {
  const IconComponent = feature?.icon ? iconByName[feature.icon] : null;

  return (
    <AnimatePresence>
      {feature && (
        <motion.div
          key={feature.id}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-6 sm:bottom-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`feature-title-${feature.id}`}
          data-testid="feature-info-popover"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="pointer-events-auto relative w-full max-w-md rounded-lg bg-black/75 p-5 text-white shadow-lg backdrop-blur-sm">
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
            <div className="flex items-start gap-3 pr-8">
              {IconComponent && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <IconComponent size={16} aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <h2
                  id={`feature-title-${feature.id}`}
                  className="text-lg font-semibold leading-tight"
                >
                  {feature.title}
                </h2>
                {feature.description && (
                  <p className="mt-2 text-sm text-white/80">{feature.description}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
