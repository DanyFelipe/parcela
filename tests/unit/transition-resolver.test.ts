import { describe, expect, it } from 'vitest';

import { getTransitionKey, resolveTransitionVideoUrl } from '@/lib/transitions/transition-resolver';

const transitionUrls = {
  'front->rear': 'https://example.com/front-to-rear.mp4',
  'rear->front': 'https://example.com/rear-to-front.mp4',
  'front->top': 'https://example.com/front-to-top.mp4',
  'top->front': 'https://example.com/top-to-front.mp4',
};

describe('transition resolver', () => {
  it.each([
    ['front', 'rear', 'https://example.com/front-to-rear.mp4'],
    ['rear', 'front', 'https://example.com/rear-to-front.mp4'],
    ['front', 'top', 'https://example.com/front-to-top.mp4'],
    ['top', 'front', 'https://example.com/top-to-front.mp4'],
  ] as const)('resolves %s to %s', (fromView, toView, expectedUrl) => {
    expect(resolveTransitionVideoUrl(fromView, toView, transitionUrls)).toBe(expectedUrl);
  });

  it('builds a stable transition key', () => {
    expect(getTransitionKey('front', 'rear')).toBe('front->rear');
  });

  it.each([
    ['rear', 'top'],
    ['top', 'rear'],
    ['front', 'front'],
  ] as const)('rejects invalid route %s to %s', (fromView, toView) => {
    expect(resolveTransitionVideoUrl(fromView, toView, transitionUrls)).toBeNull();
  });

  it('returns null when a valid route has no clip URL', () => {
    expect(resolveTransitionVideoUrl('front', 'rear', {})).toBeNull();
  });

  it('trims a valid URL before returning it', () => {
    expect(
      resolveTransitionVideoUrl('front', 'rear', {
        'front->rear': '  https://example.com/front-to-rear.mp4  ',
      })
    ).toBe('https://example.com/front-to-rear.mp4');
  });
});
