'use client';

import { ArrowUp, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useShowroomStore, type ShowroomView } from '@/lib/store/showroom.store';
import {
  resolveTransitionVideoUrl,
  type TransitionUrls,
} from '@/lib/transitions/transition-resolver';

export interface ViewTransitionRequest {
  fromView: ShowroomView;
  toView: ShowroomView;
  videoUrl: string;
}

interface ViewControlsProps {
  transitionUrls: TransitionUrls;
  onTransitionRequest: (request: ViewTransitionRequest) => void;
}

export function ViewControls({ transitionUrls, onTransitionRequest }: ViewControlsProps) {
  const currentView = useShowroomStore((state) => state.currentView);
  const transitionInProgress = useShowroomStore((state) => state.transitionInProgress);

  const canRotate = currentView === 'front' || currentView === 'rear';
  const canNavigateTop = currentView === 'front' || currentView === 'top';

  function requestTransition(toView: ShowroomView): void {
    if (transitionInProgress || currentView === toView) {
      return;
    }

    const videoUrl = resolveTransitionVideoUrl(currentView, toView, transitionUrls);

    if (!videoUrl) {
      return;
    }

    onTransitionRequest({
      fromView: currentView,
      toView,
      videoUrl,
    });
  }

  function handleRotateClick(): void {
    if (!canRotate) {
      return;
    }

    requestTransition(currentView === 'front' ? 'rear' : 'front');
  }

  function handleTopClick(): void {
    if (!canNavigateTop) {
      return;
    }

    requestTransition(currentView === 'front' ? 'top' : 'front');
  }

  return (
    <nav aria-label="Controles de vista" className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Rotar entre vista frontal y posterior"
        title="Rotar vista"
        disabled={transitionInProgress || !canRotate}
        onClick={handleRotateClick}
        className="rounded-full bg-black/60 text-white hover:bg-black/80"
      >
        <RotateCw aria-hidden="true" size={20} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={currentView === 'top' ? 'Volver a vista frontal' : 'Ver vista aérea'}
        title={currentView === 'top' ? 'Volver a vista frontal' : 'Ver vista aérea'}
        disabled={transitionInProgress || !canNavigateTop}
        onClick={handleTopClick}
        className="rounded-full bg-black/60 text-white hover:bg-black/80"
      >
        <ArrowUp aria-hidden="true" size={20} />
      </Button>
    </nav>
  );
}
