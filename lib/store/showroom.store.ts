import { create } from 'zustand';

export type ShowroomView = 'front' | 'rear' | 'top';

export interface ShowroomState {
  currentView: ShowroomView;
  selectedLotId: string | null;
  transitionInProgress: boolean;
  /** Counter incremented when the persistent back button asks to return to front. */
  frontRequest: number;
  setView: (view: ShowroomView) => void;
  selectLot: (lotId: string | null) => void;
  setTransitionInProgress: (value: boolean) => void;
  requestFront: () => void;
}

const initialState: Pick<
  ShowroomState,
  'currentView' | 'selectedLotId' | 'transitionInProgress' | 'frontRequest'
> = {
  currentView: 'front',
  selectedLotId: null,
  transitionInProgress: false,
  frontRequest: 0,
};

export const useShowroomStore = create<ShowroomState>((set) => ({
  ...initialState,
  setView: (currentView) => set({ currentView }),
  selectLot: (selectedLotId) => set({ selectedLotId }),
  setTransitionInProgress: (transitionInProgress) => set({ transitionInProgress }),
  requestFront: () => set((state) => ({ frontRequest: state.frontRequest + 1 })),
}));
