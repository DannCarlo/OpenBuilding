import { create } from 'zustand';

interface UIState {
  selectedMemberId: number | null;
  hoveredMemberId: number | null;
  selectedPlateId: number | null;
  selectedSupportNodeId: number | null;
  showInfoPanel: boolean;

  selectMember: (id: number | null) => void;
  hoverMember: (id: number | null) => void;
  selectPlate: (id: number | null) => void;
  selectSupport: (nodeId: number | null) => void;
  setShowInfoPanel: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMemberId: null,
  hoveredMemberId: null,
  selectedPlateId: null,
  selectedSupportNodeId: null,
  showInfoPanel: false,

  selectMember: (id) => set({ selectedMemberId: id, selectedPlateId: null, selectedSupportNodeId: null, showInfoPanel: id !== null }),
  hoverMember: (id) => set({ hoveredMemberId: id }),
  selectPlate: (id) => set({ selectedPlateId: id, selectedMemberId: null, selectedSupportNodeId: null, showInfoPanel: id !== null }),
  selectSupport: (nodeId) => set({ selectedSupportNodeId: nodeId, selectedMemberId: null, selectedPlateId: null, showInfoPanel: nodeId !== null }),
  setShowInfoPanel: (show) => set({ showInfoPanel: show }),
}));
