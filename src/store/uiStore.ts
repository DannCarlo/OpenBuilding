import { create } from 'zustand';

interface UIState {
  selectedMemberId: number | null;
  hoveredMemberId: number | null;
  selectedPlateId: number | null;
  showInfoPanel: boolean;

  selectMember: (id: number | null) => void;
  hoverMember: (id: number | null) => void;
  selectPlate: (id: number | null) => void;
  setShowInfoPanel: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMemberId: null,
  hoveredMemberId: null,
  selectedPlateId: null,
  showInfoPanel: false,

  selectMember: (id) => set({ selectedMemberId: id, selectedPlateId: null, showInfoPanel: id !== null }),
  hoverMember: (id) => set({ hoveredMemberId: id }),
  selectPlate: (id) => set({ selectedPlateId: id, selectedMemberId: null, showInfoPanel: id !== null }),
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),
}));
