import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VideoTransitionPlayer } from '@/lib/transitions/video-transition-player';

describe('VideoTransitionPlayer', () => {
  let videoElement: HTMLVideoElement;
  let playMock: () => Promise<void>;
  let loadMock: () => void;

  beforeEach(() => {
    videoElement = document.createElement('video');
    playMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    loadMock = vi.fn<() => void>();
    videoElement.play = playMock;
    videoElement.load = loadMock;
  });

  it('loads and plays the requested video forward', async () => {
    const player = new VideoTransitionPlayer(videoElement);

    await player.play('https://example.com/front-to-rear.mp4');

    expect(videoElement.src).toBe('https://example.com/front-to-rear.mp4');
    expect(loadMock).toHaveBeenCalledOnce();
    expect(playMock).toHaveBeenCalledOnce();
  });

  it('notifies completion when the video ends', () => {
    const player = new VideoTransitionPlayer(videoElement);
    const onComplete = vi.fn();

    player.onComplete(onComplete);
    videoElement.dispatchEvent(new Event('ended'));

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('stops notifying after disposal', () => {
    const player = new VideoTransitionPlayer(videoElement);
    const onComplete = vi.fn();

    player.onComplete(onComplete);
    player.dispose();
    videoElement.dispatchEvent(new Event('ended'));

    expect(onComplete).not.toHaveBeenCalled();
  });
});
