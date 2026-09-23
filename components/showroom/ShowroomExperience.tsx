'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';

import { TransitionVideoPlayer } from '@/components/showroom/TransitionVideoPlayer';
import { ViewControls, type ViewTransitionRequest } from '@/components/showroom/ViewControls';
import { useShowroomStore, type ShowroomView } from '@/lib/store/showroom.store';
import type { TransitionUrls } from '@/lib/transitions/transition-resolver';

import type { ShowroomViewData } from '@/lib/showroom/showroom-data';

interface ShowroomExperienceProps {
  views: Pick<ShowroomViewData, 'id' | 'base_image_url'>[];
  transitionUrls: TransitionUrls;
  viewAltText: Record<ShowroomView, string>;
}

export function ShowroomExperience({
  views,
  transitionUrls,
  viewAltText,
}: ShowroomExperienceProps) {
  const currentView = useShowroomStore((state) => state.currentView);
  const transitionInProgress = useShowroomStore((state) => state.transitionInProgress);
  const [pendingTransition, setPendingTransition] = useState<ViewTransitionRequest | null>(null);
  const currentViewData = views.find((view) => view.id === currentView) ?? views[0];

  if (!currentViewData) {
    return null;
  }

  function handleTransitionRequest(request: ViewTransitionRequest): void {
    setPendingTransition(request);
  }

  const destinationView = pendingTransition?.toView ?? currentView;
  const destinationViewData = views.find((view) => view.id === destinationView) ?? currentViewData;
  const showTransition =
    pendingTransition !== null &&
    (transitionInProgress || currentView !== pendingTransition.toView);

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      {showTransition ? (
        <TransitionVideoPlayer
          videoUrl={pendingTransition.videoUrl}
          destinationView={pendingTransition.toView}
          destinationImageUrl={destinationViewData.base_image_url}
        />
      ) : (
        <img
          src={currentViewData.base_image_url}
          alt={viewAltText[currentViewData.id]}
          className="absolute inset-0 h-full w-full object-cover"
          data-testid="showroom-base-image"
        />
      )}
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <section className="relative z-10 flex min-h-screen flex-col items-start justify-end gap-6 p-6 sm:p-10">
        <div className="max-w-md rounded-lg bg-black/55 p-5 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Parcela</p>
          <h1 className="mt-2 text-3xl font-semibold">Descubre tu próximo terreno</h1>
          <p className="mt-2 text-white/80">
            Explora las vistas del proyecto y conoce cada espacio.
          </p>
        </div>
        <ViewControls
          transitionUrls={transitionUrls}
          onTransitionRequest={handleTransitionRequest}
        />
      </section>
    </main>
  );
}
