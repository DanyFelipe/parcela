import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { ShowroomExperience } from '@/components/showroom/ShowroomExperience';
import { useShowroomStore } from '@/lib/store/showroom.store';

const baseViews = [
  { id: 'front' as const, base_image_url: 'https://placehold.co/front.webp' },
  { id: 'rear' as const, base_image_url: 'https://placehold.co/rear.webp' },
  { id: 'top' as const, base_image_url: 'https://placehold.co/top.webp' },
];

const viewAltText = {
  front: 'Vista frontal del terreno',
  rear: 'Vista posterior del terreno',
  top: 'Vista aérea del terreno con división de lotes',
};

const baseLots = [
  { id: 'lot-1', name: 'Lote A-01', price: 75000, status: 'available' as const, surface_area: 500 },
];

const baseLotHotspots = [
  { id: 'hs-1', lot_id: 'lot-1', view_id: 'top' as const, hotspot_x: 50, hotspot_y: 50 },
];

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ShowroomExperience hotspot rendering', () => {
  beforeEach(() => {
    useShowroomStore.setState({
      currentView: 'front',
      selectedLotId: null,
      transitionInProgress: false,
    });
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.load = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not render lot hotspots when the current view is front', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.queryByTestId('lot-hotspots-layer')).not.toBeInTheDocument();
  });

  it('renders lot hotspots only in the top view', () => {
    useShowroomStore.setState({ currentView: 'top', transitionInProgress: false });

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-hotspots-layer')).toBeInTheDocument();
  });

  it('fades out hotspots when a transition starts from top', () => {
    useShowroomStore.setState({ currentView: 'top' });

    const { rerender } = render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'top->front': 'https://example.com/top-to-front.mp4' }}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-hotspots-layer')).toHaveClass('opacity-100');

    fireEvent.click(screen.getByRole('button', { name: 'Volver a vista frontal' }));

    rerender(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'top->front': 'https://example.com/top-to-front.mp4' }}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-hotspots-layer')).toHaveClass('opacity-0');
    expect(screen.getByTestId('lot-hotspots-layer')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps hotspots mounted (faded out) during a top transition', () => {
    useShowroomStore.setState({ currentView: 'top', transitionInProgress: true });

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-hotspots-layer')).toBeInTheDocument();
    expect(screen.getByTestId('lot-hotspots-layer')).toHaveClass('opacity-0');
  });

  it('mounts hotspots faded out when starting a transition to top', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'front->top': 'https://example.com/front-to-top.mp4' }}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver vista aérea' }));

    expect(screen.getByTestId('lot-hotspots-layer')).toBeInTheDocument();
    expect(screen.getByTestId('lot-hotspots-layer')).toHaveClass('opacity-0');
  });

  it('fades in hotspots after arriving at top', async () => {
    useShowroomStore.setState({ currentView: 'top' });

    const { rerender } = render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    useShowroomStore.setState({ transitionInProgress: true });
    rerender(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-hotspots-layer')).toHaveClass('opacity-0');

    useShowroomStore.setState({ transitionInProgress: false });
    rerender(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('lot-hotspots-layer')).toHaveClass('opacity-100');
    });
  });

  it('selects a lot when its hotspot is clicked', async () => {
    useShowroomStore.setState({ currentView: 'top', transitionInProgress: false });

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    fireEvent.click(screen.getByTestId('lot-hotspot'));

    await waitFor(() => {
      expect(useShowroomStore.getState().selectedLotId).toBe('lot-1');
    });
  });
});
