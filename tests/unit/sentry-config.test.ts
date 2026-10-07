import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
}));

describe('Sentry runtime configurations', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(Sentry.init).mockClear();
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://sentry.test/123';
  });

  it('initializes the client SDK with the public DSN', async () => {
    await import('@/sentry.client.config');

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://sentry.test/123',
        tracesSampleRate: 0.1,
      })
    );
  });

  it('initializes the server SDK with the public DSN', async () => {
    await import('@/sentry.server.config');

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://sentry.test/123',
        tracesSampleRate: 0.1,
      })
    );
  });

  it('initializes the edge SDK with the public DSN', async () => {
    await import('@/sentry.edge.config');

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://sentry.test/123',
        tracesSampleRate: 0.1,
      })
    );
  });
});
