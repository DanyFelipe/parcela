import { create } from 'zustand';

export type ShowroomView = 'front' | 'rear' | 'top';

export interface ShowroomState {
  currentView: ShowroomView;
  selectedLotId: string | null;
  transitionInProgress: boolean;
  setView: (view: ShowroomView) => void;
  selectLot: (lotId: string | null) => void;
  setTransitionInProgress: (value: boolean) => void;
}

const initialState: Pick<ShowroomState, 'currentView' | 'selectedLotId' | 'transitionInProgress'> =
  {
    currentView: 'front',
    selectedLotId: null,
    transitionInProgress: false,
  };

export const useShowroomStore = create<ShowroomState>((set) => ({
  ...initialState,
  setView: (currentView) => set({ currentView }),
  selectLot: (selectedLotId) => set({ selectedLotId }),
  setTransitionInProgress: (transitionInProgress) => set({ transitionInProgress }),
}));
