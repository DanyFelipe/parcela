import { create } from 'zustand';

export type ShowroomView = 'front' | 'rear' | 'top';

export interface ShowroomState {
  currentView: ShowroomView;
  selectedLotId: string | null;
  transitionInProgress: boolean;
  /** Counter incremented when the persistent back button asks to return to front. */
  frontRequest: number;
  /** Whether the on-demand 360° viewer overlay is open (see 02-architecture §9). */
  isViewer360Open: boolean;
  setView: (view: ShowroomView) => void;
  selectLot: (lotId: string | null) => void;
  setTransitionInProgress: (value: boolean) => void;
  requestFront: () => void;
  setViewer360Open: (isOpen: boolean) => void;
}

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

export const useShowroomStore = create<ShowroomState>((set) => ({
  ...initialState,
  setView: (currentView) => set({ currentView }),
  selectLot: (selectedLotId) => set({ selectedLotId }),
  setTransitionInProgress: (transitionInProgress) => set({ transitionInProgress }),
  requestFront: () => set((state) => ({ frontRequest: state.frontRequest + 1 })),
  setViewer360Open: (isViewer360Open) => set({ isViewer360Open }),
}));
