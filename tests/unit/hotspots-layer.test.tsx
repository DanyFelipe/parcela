import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { HotspotsLayer } from '@/components/showroom/HotspotsLayer';

describe('HotspotsLayer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders children and is visible by default', () => {
    render(
      <HotspotsLayer fadingOut={false} testId="hotspots-layer">
        <span data-testid="child">child</span>
      </HotspotsLayer>
    );

    expect(screen.getByTestId('hotspots-layer')).toHaveClass('opacity-100');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('fades out and hides from accessibility tree when fadingOut is true', () => {
    render(
      <HotspotsLayer fadingOut testId="hotspots-layer">
        <span data-testid="child">child</span>
      </HotspotsLayer>
    );

    expect(screen.getByTestId('hotspots-layer')).toHaveClass('opacity-0');
    expect(screen.getByTestId('hotspots-layer')).toHaveAttribute('aria-hidden', 'true');
  });
});
