export interface TransitionPlayer {
  play(videoUrl: string): Promise<void>;
  onComplete(callback: () => void): void;
}
