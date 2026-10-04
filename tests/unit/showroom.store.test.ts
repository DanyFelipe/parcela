import { beforeEach, describe, expect, it } from 'vitest';

import { useShowroomStore, type ShowroomState } from '@/lib/store/showroom.store';

const initialState: Pick<
  ShowroomState,
  'currentView' | 'selectedLotId' | 'transitionInProgress' | 'frontRequest' | 'isViewer360Open'
> = {
  currentView: 'front',
  selectedLotId: null,
  transitionInProgress: false,
  frontRequest: 0,
  isViewer360Open: false,
};

describe('useShowroomStore', () => {
  beforeEach(() => {
    useShowroomStore.setState(initialState);
  });

  it('starts at the front view without a selected lot or active transition', () => {
    const state = useShowroomStore.getState();

    expect(state.currentView).toBe('front');
    expect(state.selectedLotId).toBeNull();
    expect(state.transitionInProgress).toBe(false);
  });

  it('changes the current view', () => {
    useShowroomStore.getState().setView('rear');

    expect(useShowroomStore.getState().currentView).toBe('rear');
  });

  it('selects and clears a lot', () => {
    useShowroomStore.getState().selectLot('lot-001');
    expect(useShowroomStore.getState().selectedLotId).toBe('lot-001');

    useShowroomStore.getState().selectLot(null);
    expect(useShowroomStore.getState().selectedLotId).toBeNull();
  });

  it('tracks transition progress', () => {
    useShowroomStore.getState().setTransitionInProgress(true);
    expect(useShowroomStore.getState().transitionInProgress).toBe(true);

    useShowroomStore.getState().setTransitionInProgress(false);
    expect(useShowroomStore.getState().transitionInProgress).toBe(false);
  });

  it('increments the front request counter', () => {
    expect(useShowroomStore.getState().frontRequest).toBe(0);

    useShowroomStore.getState().requestFront();
    useShowroomStore.getState().requestFront();

    expect(useShowroomStore.getState().frontRequest).toBe(2);
  });

  it('opens and closes the on-demand 360 viewer', () => {
    expect(useShowroomStore.getState().isViewer360Open).toBe(false);

    useShowroomStore.getState().setViewer360Open(true);
    expect(useShowroomStore.getState().isViewer360Open).toBe(true);

    useShowroomStore.getState().setViewer360Open(false);
    expect(useShowroomStore.getState().isViewer360Open).toBe(false);
  });

  it('keeps state isolated between tests', () => {
    expect(useShowroomStore.getState()).toMatchObject(initialState);
  });
});
