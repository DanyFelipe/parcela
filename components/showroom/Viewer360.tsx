'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useShowroomStore } from '@/lib/store/showroom.store';

import '@photo-sphere-viewer/core/index.css';

interface Viewer360Props {
  imageUrl: string | null;
}

export function Viewer360({ imageUrl }: Viewer360Props) {
  const isOpen = useShowroomStore((state) => state.isViewer360Open);
  const setViewer360Open = useShowroomStore((state) => state.setViewer360Open);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<typeof import('@photo-sphere-viewer/core').Viewer> | null>(
    null
  );

  useEffect(() => () => setViewer360Open(false), [setViewer360Open]);

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
        setViewer360Open(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setViewer360Open]);

  if (!imageUrl) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setViewer360Open(true)}
        aria-label="Ver recorrido 360° del lote"
        data-testid="viewer-360-button"
      >
        Ver en 360°
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 flex flex-col bg-background"
          role="dialog"
          aria-label="Recorrido 360° del lote"
          data-testid="viewer-360-modal"
        >
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
