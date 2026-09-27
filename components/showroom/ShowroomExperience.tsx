'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';

import { FeatureHotspotsLayer } from '@/components/showroom/FeatureHotspotsLayer';
import {
  FeatureInfoPopover,
  type FeatureHotspotInfo,
} from '@/components/showroom/FeatureInfoPopover';
import { LotHotspotsLayer } from '@/components/showroom/LotHotspotsLayer';
import { TransitionVideoPlayer } from '@/components/showroom/TransitionVideoPlayer';
import { ViewControls, type ViewTransitionRequest } from '@/components/showroom/ViewControls';
import type {
  FeatureHotspotData,
  LotData,
  LotHotspotData,
  ShowroomViewData,
} from '@/lib/showroom/showroom-data';
import { useShowroomStore, type ShowroomView } from '@/lib/store/showroom.store';
import { resolveTransitionVideoUrl } from '@/lib/transitions/transition-resolver';
import type { TransitionUrls } from '@/lib/transitions/transition-resolver';

interface ShowroomExperienceProps {
  views: Pick<ShowroomViewData, 'id' | 'base_image_url'>[];
  transitionUrls: TransitionUrls;
  viewAltText: Record<ShowroomView, string>;
  lots?: LotData[];
  lotHotspots?: LotHotspotData[];
  featureHotspots?: FeatureHotspotData[];
}

const VIEW_WITH_LOT_HOTSPOTS: ShowroomView = 'top';
const VIEW_WITH_FEATURE_HOTSPOTS: ShowroomView = 'front';

export function ShowroomExperience({
  views,
  transitionUrls,
  viewAltText,
  lots = [],
  lotHotspots = [],
  featureHotspots = [],
}: ShowroomExperienceProps) {
  const currentView = useShowroomStore((state) => state.currentView);
  const transitionInProgress = useShowroomStore((state) => state.transitionInProgress);
  const selectLot = useShowroomStore((state) => state.selectLot);
  const [pendingTransition, setPendingTransition] = useState<ViewTransitionRequest | null>(null);
  const [activeFeatureInfo, setActiveFeatureInfo] = useState<FeatureHotspotInfo | null>(null);
  const currentViewData = views.find((view) => view.id === currentView) ?? views[0];

  if (!currentViewData) {
    return null;
  }

  function handleTransitionRequest(request: ViewTransitionRequest): void {
    setPendingTransition(request);
  }

  function handleHotspotClick(lotId: string): void {
    selectLot(lotId);
  }

  function handleFeatureNavigate(targetViewId: ShowroomView): void {
    const videoUrl = resolveTransitionVideoUrl(currentView, targetViewId, transitionUrls);

    if (!videoUrl) {
      return;
    }

    setPendingTransition({
      fromView: currentView,
      toView: targetViewId,
      videoUrl,
    });
  }

  function handleFeatureShowInfo(feature: FeatureHotspotData): void {
    setActiveFeatureInfo({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      icon: feature.icon,
    });
  }

  function handleCloseFeatureInfo(): void {
    setActiveFeatureInfo(null);
  }

  const destinationView = pendingTransition?.toView ?? currentView;
  const destinationViewData = views.find((view) => view.id === destinationView) ?? currentViewData;
  const showTransition =
    pendingTransition !== null &&
    (transitionInProgress || currentView !== pendingTransition.toView);

  const showLotHotspotsLayer =
    currentView === VIEW_WITH_LOT_HOTSPOTS || destinationView === VIEW_WITH_LOT_HOTSPOTS;
  const showFeatureHotspotsLayer =
    currentView === VIEW_WITH_FEATURE_HOTSPOTS || destinationView === VIEW_WITH_FEATURE_HOTSPOTS;
  const hotspotsFadingOut = transitionInProgress;

  const topHotspots = lotHotspots.filter((hotspot) => hotspot.view_id === VIEW_WITH_LOT_HOTSPOTS);
  const frontFeatureHotspots = featureHotspots.filter(
    (hotspot) => hotspot.view_id === VIEW_WITH_FEATURE_HOTSPOTS
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0">
        <img
          src={currentViewData.base_image_url}
          alt={viewAltText[currentViewData.id]}
          className="h-full w-full object-cover"
          data-testid="showroom-base-image"
        />
      </div>

      {showLotHotspotsLayer && (
        <LotHotspotsLayer
          lots={lots}
          lotHotspots={topHotspots}
          fadingOut={hotspotsFadingOut}
          onHotspotClick={handleHotspotClick}
        />
      )}

      {showFeatureHotspotsLayer && (
        <FeatureHotspotsLayer
          featureHotspots={frontFeatureHotspots}
          fadingOut={hotspotsFadingOut}
          onNavigate={handleFeatureNavigate}
          onShowInfo={handleFeatureShowInfo}
        />
      )}

      {showTransition && (
        <TransitionVideoPlayer
          videoUrl={pendingTransition.videoUrl}
          destinationView={pendingTransition.toView}
          destinationImageUrl={destinationViewData.base_image_url}
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

      {activeFeatureInfo && (
        <FeatureInfoPopover feature={activeFeatureInfo} onClose={handleCloseFeatureInfo} />
      )}
    </main>
  );
}
