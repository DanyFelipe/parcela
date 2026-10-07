import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as Sentry from '@sentry/nextjs';
import { register } from '@/instrumentation';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
}));

describe('instrumentation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(Sentry.init).mockClear();
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://sentry.test/123';
  });

  it('loads the server config when running in the Node.js runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';

    await register();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://sentry.test/123',
        tracesSampleRate: 0.1,
      })
    );
  });

  it('loads the edge config when running in the edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';

    await register();

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://sentry.test/123',
        tracesSampleRate: 0.1,
      })
    );
  });

  it('does not initialize Sentry when NEXT_RUNTIME is unknown', async () => {
    delete process.env.NEXT_RUNTIME;

    await register();

    expect(Sentry.init).not.toHaveBeenCalled();
  });
});
