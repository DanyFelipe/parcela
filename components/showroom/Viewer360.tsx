'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import '@photo-sphere-viewer/core/index.css';

interface Viewer360Props {
  imageUrl: string | null;
}

export function Viewer360({ imageUrl }: Viewer360Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<typeof import('@photo-sphere-viewer/core').Viewer> | null>(
    null
  );

  useEffect(() => {
    if (!imageUrl || !isOpen || !containerRef.current) {
      return;
    }

    let destroyed = false;
    setIsLoading(true);

    async function initViewer(): Promise<void> {
      const { Viewer } = await import('@photo-sphere-viewer/core');

      if (destroyed || !containerRef.current) {
        return;
      }

      viewerRef.current = new Viewer({
        container: containerRef.current,
        panorama: imageUrl,
        navbar: ['zoom', 'move', 'fullscreen'],
        touchmoveTwoFingers: true,
        mousewheelCtrlKey: false,
      });

      viewerRef.current.addEventListener('ready', () => setIsLoading(false), { once: true });
    }

    initViewer();

    return () => {
      destroyed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!imageUrl) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        aria-label="Ver recorrido 360° del lote"
        data-testid="viewer-360-button"
      >
        Ver en 360°
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Recorrido 360° del lote"
          data-testid="viewer-360-modal"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-foreground">Recorrido 360°</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar recorrido 360°"
              data-testid="viewer-360-close"
            >
              <X className="size-5 text-foreground" />
            </Button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 text-foreground">
                <Loader2 className="size-8 animate-spin" aria-hidden="true" />
                <span className="text-sm">Cargando recorrido 360°...</span>
              </div>
            )}
            <div ref={containerRef} className="h-full w-full" data-testid="viewer-360-container" />
          </div>
        </div>
      )}
    </>
  );
}
