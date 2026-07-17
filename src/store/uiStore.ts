import { create } from 'zustand';

interface UIState {
  selectedMemberId: number | null;
  hoveredMemberId: number | null;
  showInfoPanel: boolean;

  selectMember: (id: number | null) => void;
  hoverMember: (id: number | null) => void;
  setShowInfoPanel: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMemberId: null,
  hoveredMemberId: null,
  showInfoPanel: false,

  selectMember: (id) => set({ selectedMemberId: id, showInfoPanel: id !== null }),
  hoverMember: (id) => set({ hoveredMemberId: id }),
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),
}));
