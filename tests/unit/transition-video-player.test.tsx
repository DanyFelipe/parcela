import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as Sentry from '@sentry/nextjs';

import { TransitionVideoPlayer } from '@/components/showroom/TransitionVideoPlayer';
import { useShowroomStore } from '@/lib/store/showroom.store';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}));

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
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    vi.mocked(Sentry.captureMessage).mockClear();
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
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
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
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Video transition failed: play-rejection', {
      level: 'warning',
      extra: expect.objectContaining({
        videoUrl: 'https://example.com/front-to-rear.mp4',
        destinationView: 'rear',
      }),
    });
  });

  it('reveals the destination image when the video element fires an error event', async () => {
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

    fireEvent.error(video);

    await waitFor(() => {
      expect(useShowroomStore.getState().currentView).toBe('rear');
      expect(useShowroomStore.getState().transitionInProgress).toBe(false);
    });

    expect(screen.getByAltText('Vista rear').classList.contains('opacity-100')).toBe(true);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Video transition failed: video-error', {
      level: 'warning',
      extra: expect.objectContaining({
        videoUrl: 'https://example.com/front-to-rear.mp4',
        destinationView: 'rear',
      }),
    });
  });

  it('skips the video and shows the destination image when prefers-reduced-motion is active', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

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

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.getByAltText('Vista rear').classList.contains('opacity-100')).toBe(true);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
