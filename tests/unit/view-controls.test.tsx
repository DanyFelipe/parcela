import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewControls, type ViewTransitionRequest } from '@/components/showroom/ViewControls';
import { useShowroomStore } from '@/lib/store/showroom.store';

describe('ViewControls', () => {
  const onTransitionRequest = vi.fn<(request: ViewTransitionRequest) => void>();

  beforeEach(() => {
    useShowroomStore.setState({
      currentView: 'front',
      selectedLotId: null,
      transitionInProgress: false,
    });
    onTransitionRequest.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('requests the front-to-rear clip from the front view', () => {
    render(
      <ViewControls
        transitionUrls={{ 'front->rear': 'https://example.com/front-to-rear.mp4' }}
        onTransitionRequest={onTransitionRequest}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rotar entre vista frontal y posterior' }));

    expect(onTransitionRequest).toHaveBeenCalledWith({
      fromView: 'front',
      toView: 'rear',
      videoUrl: 'https://example.com/front-to-rear.mp4',
    });
  });

  it('alternates from rear back to front', () => {
    useShowroomStore.setState({ currentView: 'rear' });
    render(
      <ViewControls
        transitionUrls={{ 'rear->front': 'https://example.com/rear-to-front.mp4' }}
        onTransitionRequest={onTransitionRequest}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rotar entre vista frontal y posterior' }));

    expect(onTransitionRequest).toHaveBeenCalledWith({
      fromView: 'rear',
      toView: 'front',
      videoUrl: 'https://example.com/rear-to-front.mp4',
    });
  });

  it('uses a separate control for front-to-top navigation', () => {
    render(
      <ViewControls
        transitionUrls={{ 'front->top': 'https://example.com/front-to-top.mp4' }}
        onTransitionRequest={onTransitionRequest}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver vista aérea' }));

    expect(onTransitionRequest).toHaveBeenCalledWith({
      fromView: 'front',
      toView: 'top',
      videoUrl: 'https://example.com/front-to-top.mp4',
    });
    expect(onTransitionRequest).not.toHaveBeenCalledWith(
      expect.objectContaining({ toView: 'rear' })
    );
  });

  it('returns from top to front without joining the rotation cycle', () => {
    useShowroomStore.setState({ currentView: 'top' });
    render(
      <ViewControls
        transitionUrls={{ 'top->front': 'https://example.com/top-to-front.mp4' }}
        onTransitionRequest={onTransitionRequest}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Volver a vista frontal' }));

    expect(onTransitionRequest).toHaveBeenCalledWith({
      fromView: 'top',
      toView: 'front',
      videoUrl: 'https://example.com/top-to-front.mp4',
    });
  });

  it('disables controls while a transition is in progress', () => {
    useShowroomStore.setState({ transitionInProgress: true });
    render(
      <ViewControls
        transitionUrls={{
          'front->rear': 'https://example.com/front-to-rear.mp4',
          'front->top': 'https://example.com/front-to-top.mp4',
        }}
        onTransitionRequest={onTransitionRequest}
      />
    );

    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    buttons.forEach((button) => expect(button.disabled).toBe(true));
    buttons.forEach((button) => fireEvent.click(button));

    expect(onTransitionRequest).not.toHaveBeenCalled();
  });

  it('does not request a transition when its clip is unavailable', () => {
    render(<ViewControls transitionUrls={{}} onTransitionRequest={onTransitionRequest} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rotar entre vista frontal y posterior' }));

    expect(onTransitionRequest).not.toHaveBeenCalled();
  });
});
