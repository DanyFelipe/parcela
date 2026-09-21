import { beforeEach, describe, expect, it } from 'vitest';

import { useShowroomStore, type ShowroomState } from '@/lib/store/showroom.store';

const initialState: Pick<ShowroomState, 'currentView' | 'selectedLotId' | 'transitionInProgress'> =
  {
    currentView: 'front',
    selectedLotId: null,
    transitionInProgress: false,
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

  it('keeps state isolated between tests', () => {
    expect(useShowroomStore.getState()).toMatchObject(initialState);
  });
});
