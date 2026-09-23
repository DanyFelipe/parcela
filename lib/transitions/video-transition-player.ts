import type { TransitionPlayer } from './types';

export class VideoTransitionPlayer implements TransitionPlayer {
  private readonly videoElement: HTMLVideoElement;
  private completeCallback: (() => void) | null = null;
  private errorCallback: (() => void) | null = null;

  private readonly handleEnded = () => {
    this.completeCallback?.();
  };

  private readonly handleError = () => {
    this.errorCallback?.();
  };

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.videoElement.addEventListener('ended', this.handleEnded);
    this.videoElement.addEventListener('error', this.handleError);
  }

  async play(videoUrl: string): Promise<void> {
    this.videoElement.src = videoUrl;
    this.videoElement.load();
    await this.videoElement.play();
  }

  onComplete(callback: () => void): void {
    this.completeCallback = callback;
  }

  onError(callback: () => void): void {
    this.errorCallback = callback;
  }

  dispose(): void {
    this.videoElement.removeEventListener('ended', this.handleEnded);
    this.videoElement.removeEventListener('error', this.handleError);
    this.completeCallback = null;
    this.errorCallback = null;
  }
}
