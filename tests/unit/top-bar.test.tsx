import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

const navigationMocks = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  pathname: '/',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: navigationMocks.back, push: navigationMocks.push }),
  usePathname: () => navigationMocks.pathname,
}));

import { TopBar } from '@/components/showroom/TopBar';
import { useShowroomStore } from '@/lib/store/showroom.store';

describe('TopBar', () => {
  beforeEach(() => {
    navigationMocks.pathname = '/';
    useShowroomStore.setState({ currentView: 'front', frontRequest: 0, isViewer360Open: false });
  });

  afterEach(() => {
    cleanup();
    navigationMocks.back.mockReset();
    navigationMocks.push.mockReset();
    window.history.replaceState(null, '');
  });

  it('renders the back and menu controls', () => {
    render(<TopBar />);

    expect(screen.getByTestId('top-bar-back')).toBeInTheDocument();
    expect(screen.getByTestId('top-bar-menu-trigger')).toBeInTheDocument();
  });

  it('renders nothing on admin routes so the panel owns its own top bar', () => {
    navigationMocks.pathname = '/admin/lots/new';

    const { container } = render(<TopBar />);

    expect(container).toBeEmptyDOMElement();
  });

  it('navigates to the admin panel from the menu', async () => {
    render(<TopBar />);
    fireEvent.click(screen.getByTestId('top-bar-menu-trigger'));

    fireEvent.click(await screen.findByTestId('top-bar-admin-link'));

    expect(navigationMocks.push).toHaveBeenCalledWith('/admin');
  });

  it('requests the front view from the showroom when another view is active', () => {
    useShowroomStore.setState({ currentView: 'top' });

    render(<TopBar />);
    fireEvent.click(screen.getByTestId('top-bar-back'));

    expect(useShowroomStore.getState().frontRequest).toBe(1);
    expect(navigationMocks.back).not.toHaveBeenCalled();
    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it('navigates back when there is session history and the showroom is already at front', () => {
    window.history.pushState({ idx: 1 }, '');

    render(<TopBar />);
    fireEvent.click(screen.getByTestId('top-bar-back'));

    expect(navigationMocks.back).toHaveBeenCalledTimes(1);
    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it('falls back to the showroom home when there is no history', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByTestId('top-bar-back'));

    expect(navigationMocks.push).toHaveBeenCalledWith('/');
    expect(navigationMocks.back).not.toHaveBeenCalled();
  });

  it('closes the 360 viewer from the lot page instead of navigating', () => {
    navigationMocks.pathname = '/lot/lot-1';
    useShowroomStore.setState({ isViewer360Open: true });
    window.history.pushState({ idx: 2 }, '');

    render(<TopBar />);
    fireEvent.click(screen.getByTestId('top-bar-back'));

    expect(useShowroomStore.getState().isViewer360Open).toBe(false);
    expect(navigationMocks.back).not.toHaveBeenCalled();
    expect(navigationMocks.push).not.toHaveBeenCalled();
  });

  it('leaves a non-showroom page through history regardless of the current view', () => {
    navigationMocks.pathname = '/lot/lot-1';
    useShowroomStore.setState({ currentView: 'top' });
    window.history.pushState({ idx: 2 }, '');

    render(<TopBar />);
    fireEvent.click(screen.getByTestId('top-bar-back'));

    expect(navigationMocks.back).toHaveBeenCalledTimes(1);
    expect(useShowroomStore.getState().frontRequest).toBe(0);
  });
});
