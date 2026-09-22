import type { TransitionPlayer } from './types';

export class VideoTransitionPlayer implements TransitionPlayer {
  private readonly videoElement: HTMLVideoElement;
  private completeCallback: (() => void) | null = null;
  private readonly handleEnded = () => {
    this.completeCallback?.();
  };

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.videoElement.addEventListener('ended', this.handleEnded);
  }

  async play(videoUrl: string): Promise<void> {
    this.videoElement.src = videoUrl;
    this.videoElement.load();
    await this.videoElement.play();
  }

  onComplete(callback: () => void): void {
    this.completeCallback = callback;
  }

  dispose(): void {
    this.videoElement.removeEventListener('ended', this.handleEnded);
    this.completeCallback = null;
  }
}
