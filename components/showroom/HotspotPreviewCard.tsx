'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import { formatPrice, formatSurface } from '@/lib/showroom/lot-formatting';
import type { LotData } from '@/lib/showroom/showroom-data';
import { lotStatusConfig } from '@/lib/showroom/lot-status';

interface HotspotPreviewCardProps {
  lot: LotData | null;
  onClose: () => void;
}

export function HotspotPreviewCard({ lot, onClose }: HotspotPreviewCardProps) {
  useEffect(() => {
    if (!lot) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lot, onClose]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center p-0 sm:items-end sm:p-6"
      data-testid="hotspot-preview-container"
    >
      <AnimatePresence mode="wait">
        {lot && (
          <motion.div
            key={lot.id}
            className="glass-panel pointer-events-auto relative max-h-[min(70svh,34rem)] w-full max-w-none overflow-y-auto rounded-b-none rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-foreground sm:max-h-none sm:max-w-sm sm:overflow-visible sm:rounded-2xl sm:pb-5"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`lot-preview-title-${lot.id}`}
            data-testid="hotspot-preview-card"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              className="absolute right-2 top-2 size-11 text-foreground hover:bg-foreground/10"
            >
              <X size={18} />
            </Button>

            <h2 id={`lot-preview-title-${lot.id}`} className="pr-8 text-lg font-semibold">
              {lot.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${lotStatusConfig[lot.status].badgeClass}`}
              >
                {lotStatusConfig[lot.status].label}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <p className="text-foreground">{formatPrice(lot.price)}</p>
              <p className="text-muted-foreground">{formatSurface(lot.surface_area)}</p>
            </div>

            <div className="mt-5">
              <Link
                href={`/lot/${lot.id}`}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                Ver ficha completa
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
