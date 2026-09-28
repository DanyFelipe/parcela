import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { ShowroomExperience } from '@/components/showroom/ShowroomExperience';
import { useShowroomStore } from '@/lib/store/showroom.store';

const baseViews = [
  { id: 'front' as const, base_image_url: 'https://placehold.co/front.webp', alt_image_url: null },
  { id: 'rear' as const, base_image_url: 'https://placehold.co/rear.webp', alt_image_url: null },
  {
    id: 'top' as const,
    base_image_url: 'https://placehold.co/top.webp',
    alt_image_url: 'https://placehold.co/top-no-grid.webp',
  },
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

const baseFeatureHotspots = [
  {
    id: 'fs-1',
    view_id: 'front' as const,
    type: 'lots_overview' as const,
    action: 'navigate_to_view' as const,
    target_view_id: 'top' as const,
    title: 'Ver lotes',
    description: 'Explorar lotes disponibles.',
    icon: 'layout-grid',
    hotspot_x: 65,
    hotspot_y: 45,
  },
  {
    id: 'fs-2',
    view_id: 'front' as const,
    type: 'sales_office' as const,
    action: 'show_info' as const,
    target_view_id: null,
    title: 'Caseta de ventas',
    description: 'Atención de lunes a sábado.',
    icon: 'home',
    hotspot_x: 25,
    hotspot_y: 55,
  },
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

describe('ShowroomExperience feature hotspot rendering', () => {
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

  it('renders feature hotspots only in the front view', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    expect(screen.getByTestId('feature-hotspots-layer')).toBeInTheDocument();
  });

  it('does not render feature hotspots in the top view', () => {
    useShowroomStore.setState({ currentView: 'top', transitionInProgress: false });

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    expect(screen.queryByTestId('feature-hotspots-layer')).not.toBeInTheDocument();
  });

  it('opens the info popover when a show_info feature hotspot is clicked', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));

    expect(screen.getByTestId('feature-info-popover')).toBeInTheDocument();
    expect(screen.getByText('Atención de lunes a sábado.')).toBeInTheDocument();
  });

  it('closes the info popover when clicking the close button', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar información' }));

    expect(screen.queryByTestId('feature-info-popover')).not.toBeInTheDocument();
  });

  it('closes the active info popover when its feature hotspot is clicked again', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    const salesOfficeHotspot = screen.getByRole('button', { name: 'Caseta de ventas' });
    fireEvent.click(salesOfficeHotspot);
    expect(screen.getByTestId('feature-info-popover')).toBeInTheDocument();

    fireEvent.click(salesOfficeHotspot);

    expect(screen.queryByTestId('feature-info-popover')).not.toBeInTheDocument();
  });

  it('closes the active info popover when navigation starts from ViewControls', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'front->top': 'https://example.com/front-to-top.mp4' }}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));
    expect(screen.getByTestId('feature-info-popover')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver vista aérea' }));

    expect(screen.queryByTestId('feature-info-popover')).not.toBeInTheDocument();
  });

  it('closes the active info popover when navigation starts from a feature hotspot', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'front->top': 'https://example.com/front-to-top.mp4' }}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Caseta de ventas' }));
    expect(screen.getByTestId('feature-info-popover')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver lotes' }));

    expect(screen.queryByTestId('feature-info-popover')).not.toBeInTheDocument();
  });

  it('navigates to top when lots_overview feature hotspot is clicked', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'front->top': 'https://example.com/front-to-top.mp4' }}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver lotes' }));

    expect(useShowroomStore.getState().transitionInProgress).toBe(true);
  });

  it('keeps decorative overlays out of the pointer-events path so hotspots stay clickable', () => {
    const { container } = render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        featureHotspots={baseFeatureHotspots}
      />
    );

    const scrim = container.querySelector('.bg-black\\/20');
    expect(scrim).toHaveClass('pointer-events-none');

    const uiSection = container.querySelector('section');
    expect(uiSection).toHaveClass('pointer-events-none');

    const viewControls = screen.getByRole('navigation', { name: 'Controles de vista' });
    expect(viewControls).toHaveClass('pointer-events-auto');
  });
});

describe('ShowroomExperience grid toggle', () => {
  beforeEach(() => {
    useShowroomStore.setState({
      currentView: 'top',
      selectedLotId: null,
      transitionInProgress: false,
    });
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.load = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the grid toggle only in the top view when alt_image_url exists', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('grid-toggle')).toBeInTheDocument();
  });

  it('does not render the grid toggle when top has no alt_image_url', () => {
    const viewsWithoutAlt = baseViews.map((view) =>
      view.id === 'top' ? { ...view, alt_image_url: null } : view
    );

    render(
      <ShowroomExperience
        views={viewsWithoutAlt}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.queryByTestId('grid-toggle')).not.toBeInTheDocument();
  });

  it('does not render the grid toggle in the front view', () => {
    useShowroomStore.setState({ currentView: 'front', transitionInProgress: false });

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.queryByTestId('grid-toggle')).not.toBeInTheDocument();
  });

  it('toggles between base and alt images when the grid toggle is clicked', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('showroom-base-image')).toHaveClass('opacity-100');
    expect(screen.getByTestId('showroom-alt-image')).toHaveClass('opacity-0');

    fireEvent.click(screen.getByTestId('grid-toggle'));

    expect(screen.getByTestId('showroom-base-image')).toHaveClass('opacity-0');
    expect(screen.getByTestId('showroom-alt-image')).toHaveClass('opacity-100');
  });

  it('keeps lot hotspots rendered after toggling the grid', () => {
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

    fireEvent.click(screen.getByTestId('grid-toggle'));

    expect(screen.getByTestId('lot-hotspots-layer')).toBeInTheDocument();
  });
});

describe('ShowroomExperience lot status legend', () => {
  beforeEach(() => {
    useShowroomStore.setState({
      currentView: 'top',
      selectedLotId: null,
      transitionInProgress: false,
    });
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.load = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the legend in the top view with the statuses of visible lots', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-status-legend')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('does not render the legend in the front view', () => {
    useShowroomStore.setState({ currentView: 'front', transitionInProgress: false });

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.queryByTestId('lot-status-legend')).not.toBeInTheDocument();
  });

  it('fades out the legend when a transition starts', () => {
    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{ 'top->front': 'https://example.com/top-to-front.mp4' }}
        viewAltText={viewAltText}
        lots={baseLots}
        lotHotspots={baseLotHotspots}
      />
    );

    expect(screen.getByTestId('lot-status-legend')).toHaveClass('opacity-100');

    fireEvent.click(screen.getByRole('button', { name: 'Volver a vista frontal' }));

    expect(screen.getByTestId('lot-status-legend')).toHaveClass('opacity-0');
  });

  it('only shows statuses that are present in visible lots', () => {
    const soldLot = {
      id: 'lot-2',
      name: 'Lote A-02',
      price: 80000,
      status: 'sold' as const,
      surface_area: 450,
    };
    const soldHotspot = {
      id: 'hs-2',
      lot_id: 'lot-2',
      view_id: 'top' as const,
      hotspot_x: 60,
      hotspot_y: 60,
    };

    render(
      <ShowroomExperience
        views={baseViews}
        transitionUrls={{}}
        viewAltText={viewAltText}
        lots={[baseLots[0], soldLot]}
        lotHotspots={[baseLotHotspots[0], soldHotspot]}
      />
    );

    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Vendido')).toBeInTheDocument();
    expect(screen.queryByText('Reservado')).not.toBeInTheDocument();
  });
});
