'use client';

import { useSyncExternalStore } from 'react';

interface TransitionClipPreloaderProps {
  videoUrls: readonly string[];
}

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

function canPreloadClips(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  return (navigator as NavigatorWithConnection).connection?.saveData !== true;
}

function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * Descarga en segundo plano los clips que la vista actual puede disparar, para que
 * al hacer clic la transición arranque sin esperar la red (`04-coding-standards.md` §6).
 * No renderiza nada visible ni reporta errores: si una precarga falla, el
 * `TransitionVideoPlayer` ya tiene su fallback y su propio reporte.
 */
export function TransitionClipPreloader({ videoUrls }: TransitionClipPreloaderProps) {
  const enabled = useSyncExternalStore(subscribeToNothing, canPreloadClips, () => false);

  if (!enabled || videoUrls.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute size-px overflow-hidden opacity-0"
      data-testid="transition-clip-preloader"
    >
      {videoUrls.map((videoUrl) => (
        <video key={videoUrl} src={videoUrl} preload="auto" muted playsInline />
      ))}
    </div>
  );
}
