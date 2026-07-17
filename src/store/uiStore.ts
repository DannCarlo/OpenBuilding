import { create } from 'zustand';

interface UIState {
  selectedMemberId: number | null;
  hoveredMemberId: number | null;
  showUpload: boolean;
  showInfoPanel: boolean;

  selectMember: (id: number | null) => void;
  hoverMember: (id: number | null) => void;
  setShowUpload: (show: boolean) => void;
  setShowInfoPanel: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMemberId: null,
  hoveredMemberId: null,
  showUpload: true,
  showInfoPanel: false,

  selectMember: (id) => set({ selectedMemberId: id, showInfoPanel: id !== null }),
  hoverMember: (id) => set({ hoveredMemberId: id }),
  setShowUpload: (show) => set({ showUpload: show }),
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),
}));
