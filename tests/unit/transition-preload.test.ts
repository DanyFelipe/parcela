import { describe, expect, it } from 'vitest';

import { getPreloadableTransitionUrls } from '@/lib/transitions/transition-resolver';

const transitionUrls = {
  'front->rear': 'https://cdn.example.com/front-rear.mp4',
  'front->top': 'https://cdn.example.com/front-top.mp4',
  'rear->front': 'https://cdn.example.com/rear-front.mp4',
  'top->front': 'https://cdn.example.com/top-front.mp4',
};

describe('getPreloadableTransitionUrls', () => {
  it('returns every clip the front view can trigger', () => {
    expect(getPreloadableTransitionUrls('front', transitionUrls).sort()).toEqual(
      [transitionUrls['front->rear'], transitionUrls['front->top']].sort()
    );
  });

  it('returns only the clip leaving the rear view', () => {
    expect(getPreloadableTransitionUrls('rear', transitionUrls)).toEqual([
      transitionUrls['rear->front'],
    ]);
  });

  it('skips transitions without a configured clip', () => {
    expect(getPreloadableTransitionUrls('front', { 'front->top': '  ' })).toEqual([]);
    expect(getPreloadableTransitionUrls('top', {})).toEqual([]);
  });
});
