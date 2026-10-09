import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { TransitionClipPreloader } from '@/components/showroom/TransitionClipPreloader';

const CLIPS = ['https://cdn.example.com/front-rear.mp4', 'https://cdn.example.com/front-top.mp4'];

function mockEnvironment({ reducedMotion = false, saveData = false } = {}) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reducedMotion });
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData },
  });
}

describe('TransitionClipPreloader', () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
  });

  it('preloads every clip the current view can trigger, hidden from assistive tech', async () => {
    mockEnvironment();

    const { container } = render(<TransitionClipPreloader videoUrls={CLIPS} />);

    await waitFor(() => expect(container.querySelectorAll('video')).toHaveLength(2));

    const videos = container.querySelectorAll('video');
    expect(videos[0]).toHaveAttribute('src', CLIPS[0]);
    expect(videos[0]).toHaveAttribute('preload', 'auto');
    expect(screen.getByTestId('transition-clip-preloader')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders nothing when there are no clips to preload', async () => {
    mockEnvironment();

    const { container } = render(<TransitionClipPreloader videoUrls={[]} />);

    await waitFor(() => expect(window.matchMedia).toHaveBeenCalled());
    expect(container.querySelectorAll('video')).toHaveLength(0);
  });

  it('does not preload when the visitor prefers reduced motion', async () => {
    mockEnvironment({ reducedMotion: true });

    const { container } = render(<TransitionClipPreloader videoUrls={CLIPS} />);

    await waitFor(() => expect(window.matchMedia).toHaveBeenCalled());
    expect(container.querySelectorAll('video')).toHaveLength(0);
  });

  it('does not preload when the visitor enabled data saving', async () => {
    mockEnvironment({ saveData: true });

    const { container } = render(<TransitionClipPreloader videoUrls={CLIPS} />);

    await waitFor(() => expect(window.matchMedia).toHaveBeenCalled());
    expect(container.querySelectorAll('video')).toHaveLength(0);
  });
});
