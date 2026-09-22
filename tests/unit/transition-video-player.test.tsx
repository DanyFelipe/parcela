import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TransitionVideoPlayer } from '@/components/showroom/TransitionVideoPlayer';
import { useShowroomStore } from '@/lib/store/showroom.store';

describe('TransitionVideoPlayer', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useShowroomStore.setState({
      currentView: 'front',
      selectedLotId: null,
      transitionInProgress: false,
    });
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.load = vi.fn();
  });

  it('renders an autoplay-ready muted video without native controls', async () => {
    render(
      <TransitionVideoPlayer
        videoUrl="https://example.com/front-to-rear.mp4"
        destinationView="rear"
        destinationImageUrl="https://example.com/rear.webp"
      />
    );

    const video = screen.getByTestId('transition-video-player').querySelector('video');

    expect(video?.getAttribute('src')).toBe('https://example.com/front-to-rear.mp4');
    expect(video?.getAttribute('preload')).toBe('auto');
    expect(video?.hasAttribute('controls')).toBe(false);
    expect(video).toHaveProperty('muted', true);
    expect(video).toHaveProperty('playsInline', true);
    expect(useShowroomStore.getState().transitionInProgress).toBe(true);

    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce());
  });

  it('updates the destination view and reveals the fallback image when playback ends', async () => {
    render(
      <TransitionVideoPlayer
        videoUrl="https://example.com/front-to-rear.mp4"
        destinationView="rear"
        destinationImageUrl="https://example.com/rear.webp"
      />
    );

    const video = screen
      .getByTestId('transition-video-player')
      .querySelector('video') as HTMLVideoElement;

    fireEvent.ended(video);

    await waitFor(() => {
      expect(useShowroomStore.getState().currentView).toBe('rear');
      expect(useShowroomStore.getState().transitionInProgress).toBe(false);
    });

    expect(screen.getByAltText('Vista rear').classList.contains('opacity-100')).toBe(true);
  });

  it('reveals the destination image when playback fails', async () => {
    HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new Error('Playback failed'));

    render(
      <TransitionVideoPlayer
        videoUrl="https://example.com/front-to-rear.mp4"
        destinationView="rear"
        destinationImageUrl="https://example.com/rear.webp"
      />
    );

    await waitFor(() => {
      expect(useShowroomStore.getState().currentView).toBe('rear');
      expect(useShowroomStore.getState().transitionInProgress).toBe(false);
    });

    expect(screen.getByAltText('Vista rear').classList.contains('opacity-100')).toBe(true);
  });
});
