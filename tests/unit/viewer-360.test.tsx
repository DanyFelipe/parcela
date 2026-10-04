import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { Viewer360 } from '@/components/showroom/Viewer360';
import { useShowroomStore } from '@/lib/store/showroom.store';

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  addEventListener: vi.fn((_event: string, callback: () => void) => {
    if (_event === 'ready') {
      callback();
    }
  }),
}));

vi.mock('@photo-sphere-viewer/core', () => ({
  Viewer: class MockViewer {
    addEventListener = mocks.addEventListener;
    destroy = mocks.destroy;
  },
}));

describe('Viewer360', () => {
  beforeEach(() => {
    useShowroomStore.setState({ isViewer360Open: false });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not render anything when there is no image url', () => {
    render(<Viewer360 imageUrl={null} />);

    expect(screen.queryByTestId('viewer-360-button')).not.toBeInTheDocument();
  });

  it('renders the open button when an image url is provided', () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    expect(screen.getByTestId('viewer-360-button')).toHaveTextContent('Ver en 360°');
  });

  it('opens the viewer modal and shows loading state when clicking the button', async () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    fireEvent.click(screen.getByTestId('viewer-360-button'));

    await waitFor(() => {
      expect(screen.getByTestId('viewer-360-modal')).toBeInTheDocument();
    });

    expect(screen.getByTestId('viewer-360-container')).toBeInTheDocument();
  });

  it('hides the loading state once the viewer is ready', async () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    fireEvent.click(screen.getByTestId('viewer-360-button'));

    await waitFor(() => {
      expect(screen.queryByText('Cargando recorrido 360°...')).not.toBeInTheDocument();
    });
  });

  it('renders no internal header, since the persistent top bar closes the viewer', async () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    fireEvent.click(screen.getByTestId('viewer-360-button'));
    await waitFor(() => {
      expect(screen.getByTestId('viewer-360-modal')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('viewer-360-close')).not.toBeInTheDocument();
  });

  it('closes the modal when the top bar requests it', async () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    fireEvent.click(screen.getByTestId('viewer-360-button'));
    await waitFor(() => {
      expect(screen.getByTestId('viewer-360-modal')).toBeInTheDocument();
    });

    act(() => {
      useShowroomStore.getState().setViewer360Open(false);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('viewer-360-modal')).not.toBeInTheDocument();
    });
  });

  it('closes the modal when pressing Escape', async () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    fireEvent.click(screen.getByTestId('viewer-360-button'));
    await waitFor(() => {
      expect(screen.getByTestId('viewer-360-modal')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('viewer-360-modal')).not.toBeInTheDocument();
    });
  });

  it('destroys the viewer instance when the modal closes', async () => {
    render(<Viewer360 imageUrl="https://placehold.co/panorama.jpg" />);

    fireEvent.click(screen.getByTestId('viewer-360-button'));
    await waitFor(() => {
      expect(screen.getByTestId('viewer-360-modal')).toBeInTheDocument();
    });

    act(() => {
      useShowroomStore.getState().setViewer360Open(false);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('viewer-360-modal')).not.toBeInTheDocument();
    });

    expect(mocks.destroy).toHaveBeenCalled();
  });
});
