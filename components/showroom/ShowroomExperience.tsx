'use client';

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

import { FeatureHotspotsLayer } from '@/components/showroom/FeatureHotspotsLayer';
import {
  FeatureInfoPopover,
  type FeatureHotspotInfo,
} from '@/components/showroom/FeatureInfoPopover';
import { GridToggle } from '@/components/showroom/GridToggle';
import { HotspotPreviewCard } from '@/components/showroom/HotspotPreviewCard';
import { LotHotspotsLayer } from '@/components/showroom/LotHotspotsLayer';
import { LotStatusLegend } from '@/components/showroom/LotStatusLegend';
import { TransitionVideoPlayer } from '@/components/showroom/TransitionVideoPlayer';
import { ViewControls, type ViewTransitionRequest } from '@/components/showroom/ViewControls';
import type {
  FeatureHotspotData,
  LotData,
  LotHotspotData,
  LotStatus,
  ShowroomViewData,
} from '@/lib/showroom/showroom-data';
import { useShowroomStore, type ShowroomView } from '@/lib/store/showroom.store';
import { resolveTransitionVideoUrl } from '@/lib/transitions/transition-resolver';
import type { TransitionUrls } from '@/lib/transitions/transition-resolver';

interface ShowroomExperienceProps {
  views: Pick<ShowroomViewData, 'id' | 'base_image_url' | 'alt_image_url'>[];
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
  const selectedLotId = useShowroomStore((state) => state.selectedLotId);
  const selectLot = useShowroomStore((state) => state.selectLot);
  const [pendingTransition, setPendingTransition] = useState<ViewTransitionRequest | null>(null);
  const [activeFeatureInfo, setActiveFeatureInfo] = useState<FeatureHotspotInfo | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const currentViewData = views.find((view) => view.id === currentView) ?? views[0];

  if (!currentViewData) {
    return null;
  }

  function handleTransitionRequest(request: ViewTransitionRequest): void {
    setActiveFeatureInfo(null);
    selectLot(null);
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

    setActiveFeatureInfo(null);
    selectLot(null);
    setPendingTransition({
      fromView: currentView,
      toView: targetViewId,
      videoUrl,
    });
  }

  function handleFeatureShowInfo(feature: FeatureHotspotData): void {
    if (activeFeatureInfo?.id === feature.id) {
      setActiveFeatureInfo(null);
      return;
    }

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

  function handleClosePreview(): void {
    selectLot(null);
  }

  function handleToggleGrid(): void {
    setShowGrid((previous) => !previous);
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
  const hasGridToggle =
    currentView === VIEW_WITH_LOT_HOTSPOTS && currentViewData.alt_image_url !== null;

  const lotById = new Map(lots.map((lot) => [lot.id, lot]));
  const visibleLotStatuses = Array.from(
    new Set(
      topHotspots
        .map((hotspot) => lotById.get(hotspot.lot_id)?.status)
        .filter((status): status is LotStatus => status !== undefined)
    )
  );
  const selectedLot = selectedLotId ? (lotById.get(selectedLotId) ?? null) : null;
  const showPreviewCard = currentView === VIEW_WITH_LOT_HOTSPOTS && selectedLot !== null;

  return (
    <main className="relative isolate h-[100svh] min-h-[100svh] overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 overflow-auto overscroll-contain"
        role="region"
        aria-label="Render del terreno. Desliza horizontalmente para recorrer la vista."
        tabIndex={0}
        data-testid="showroom-render-viewport"
      >
        <div className="relative w-[1600px] md:w-full" data-testid="showroom-render-stage">
          {hasGridToggle ? (
            <>
              <img
                src={currentViewData.base_image_url}
                alt={viewAltText[currentViewData.id]}
                className={`relative block h-auto w-full object-fill transition-opacity duration-200 ${
                  showGrid ? 'opacity-100' : 'opacity-0'
                }`}
                data-testid="showroom-base-image"
              />
              <img
                src={currentViewData.alt_image_url!}
                alt={viewAltText[currentViewData.id]}
                className={`absolute inset-0 h-full w-full object-fill transition-opacity duration-200 ${
                  showGrid ? 'opacity-0' : 'opacity-100'
                }`}
                data-testid="showroom-alt-image"
              />
            </>
          ) : (
            <img
              src={currentViewData.base_image_url}
              alt={viewAltText[currentViewData.id]}
              className="relative block h-auto w-full object-fill"
              data-testid="showroom-base-image"
            />
          )}

          {showLotHotspotsLayer && visibleLotStatuses.length > 0 && (
            <LotStatusLegend statuses={visibleLotStatuses} fadingOut={hotspotsFadingOut} />
          )}

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
            <div className="absolute inset-0">
              <TransitionVideoPlayer
                videoUrl={pendingTransition.videoUrl}
                destinationView={pendingTransition.toView}
                destinationImageUrl={destinationViewData.base_image_url}
              />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-black/20" aria-hidden="true" />
        </div>
      </div>

      <section className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:inset-auto sm:bottom-8 sm:left-8 sm:gap-6 sm:p-0">
        <div className="glass-panel max-w-md rounded-2xl p-3 sm:p-5">
          <p className="text-xs text-muted-foreground">Parcela</p>
          <h1 className="mt-1 text-xl font-semibold leading-tight sm:mt-2 sm:text-3xl">
            Descubre tu próximo terreno
          </h1>
          <p className="mt-1 text-sm text-foreground/85 sm:mt-2">
            Explora las vistas del proyecto y conoce cada espacio.
          </p>
        </div>
        <div className="glass-panel pointer-events-auto flex w-fit max-w-full items-center gap-1 rounded-full p-1">
          <ViewControls
            transitionUrls={transitionUrls}
            onTransitionRequest={handleTransitionRequest}
          />
          {hasGridToggle && (
            <GridToggle
              showGrid={showGrid}
              onToggle={handleToggleGrid}
              disabled={transitionInProgress}
            />
          )}
          <span className="ml-1 inline-flex items-center gap-1.5 border-l border-panel-border pl-3 pr-2 text-xs text-muted-foreground sm:hidden">
            <ArrowLeftRight size={15} aria-hidden="true" />
            Desliza para explorar
          </span>
        </div>
      </section>

      <FeatureInfoPopover feature={activeFeatureInfo} onClose={handleCloseFeatureInfo} />

      <HotspotPreviewCard lot={showPreviewCard ? selectedLot : null} onClose={handleClosePreview} />
    </main>
  );
}
