'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';

import { useShowroomStore, type ShowroomView } from '@/lib/store/showroom.store';
import { VideoTransitionPlayer } from '@/lib/transitions/video-transition-player';

interface TransitionVideoPlayerProps {
  videoUrl: string;
  destinationView: ShowroomView;
  destinationImageUrl: string;
  className?: string;
}

export function TransitionVideoPlayer({
  videoUrl,
  destinationView,
  destinationImageUrl,
  className,
}: TransitionVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const [showDestinationImage, setShowDestinationImage] = useState(false);
  const setView = useShowroomStore((state) => state.setView);
  const setTransitionInProgress = useShowroomStore((state) => state.setTransitionInProgress);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    completedRef.current = false;
    setShowDestinationImage(false);
    setTransitionInProgress(true);

    const player = new VideoTransitionPlayer(videoElement);
    const completeTransition = () => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      setView(destinationView);
      setTransitionInProgress(false);
      setShowDestinationImage(true);
    };

    player.onComplete(completeTransition);
    void player.play(videoUrl).catch(completeTransition);

    return () => {
      player.dispose();
    };
  }, [destinationView, setTransitionInProgress, setView, videoUrl]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className ?? ''}`.trim()}
      data-testid="transition-video-player"
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          showDestinationImage ? 'opacity-0' : 'opacity-100'
        }`}
        muted
        playsInline
        controls={false}
        preload="auto"
        aria-hidden="true"
      />
      <img
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          showDestinationImage ? 'opacity-100' : 'opacity-0'
        }`}
        src={destinationImageUrl}
        alt={`Vista ${destinationView}`}
      />
    </div>
  );
}
