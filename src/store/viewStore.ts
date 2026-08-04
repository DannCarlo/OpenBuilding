import { create } from 'zustand';

export type DisplayMode = 'realistic' | 'wireframe' | 'semi';
export type ThemeMode = 'dark' | 'light';
export type NavMode = 'orbit' | 'pan';

interface ViewState {
  displayMode: DisplayMode;
  showLabels: boolean;
  showGrid: boolean;
  showSupports: boolean;
  theme: ThemeMode;
  navMode: NavMode;
  showStats: boolean;
  fitViewTrigger: number;

  setDisplayMode: (mode: DisplayMode) => void;
  toggleLabels: () => void;
  toggleGrid: () => void;
  toggleSupports: () => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setNavMode: (mode: NavMode) => void;
  toggleStats: () => void;
  triggerFitView: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  displayMode: 'realistic',
  showLabels: false,
  showGrid: true,
  showSupports: true,
  theme: 'light',
  navMode: 'orbit',
  showStats: true,
  fitViewTrigger: 0,

  setDisplayMode: (mode) => set({ displayMode: mode }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSupports: () => set((s) => ({ showSupports: !s.showSupports })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),
  setNavMode: (mode) => set({ navMode: mode }),
  toggleStats: () => set((s) => ({ showStats: !s.showStats })),
  triggerFitView: () => set((s) => ({ fitViewTrigger: s.fitViewTrigger + 1 })),
}));
