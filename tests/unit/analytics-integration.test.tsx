import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

vi.mock('next/font/google', () => ({
  Figtree: vi.fn(() => ({ variable: '--font-figtree' })),
}));

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

import RootLayout from '@/app/layout';

describe('Vercel Analytics integration', () => {
  it('renders Analytics inside the root layout body', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RootLayout params={Promise.resolve({})}>
        <div>page content</div>
      </RootLayout>,
      { container: document.documentElement }
    );

    consoleError.mockRestore();

    expect(screen.getByTestId('vercel-analytics')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });
});
