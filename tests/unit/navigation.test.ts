import { describe, expect, it } from 'vitest';

import { resolveBackNavigation } from '@/lib/navigation';

describe('resolveBackNavigation', () => {
  it('goes back when there is a session history position', () => {
    expect(resolveBackNavigation({ idx: 1 })).toBe('back');
    expect(resolveBackNavigation({ idx: 4 })).toBe('back');
  });

  it('falls back to home when there is nowhere to go back to', () => {
    expect(resolveBackNavigation(null)).toBe('home');
    expect(resolveBackNavigation(undefined)).toBe('home');
    expect(resolveBackNavigation({})).toBe('home');
    expect(resolveBackNavigation({ idx: 0 })).toBe('home');
    expect(resolveBackNavigation({ idx: 'x' })).toBe('home');
  });
});
