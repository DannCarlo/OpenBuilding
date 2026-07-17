import { create } from 'zustand';

export type DisplayMode = 'solid' | 'wireframe' | 'semi';
export type ThemeMode = 'dark' | 'light';

interface ViewState {
  displayMode: DisplayMode;
  showLabels: boolean;
  showGrid: boolean;
  showSupports: boolean;
  theme: ThemeMode;

  setDisplayMode: (mode: DisplayMode) => void;
  toggleLabels: () => void;
  toggleGrid: () => void;
  toggleSupports: () => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  displayMode: 'solid',
  showLabels: false,
  showGrid: true,
  showSupports: true,
  theme: 'light',

  setDisplayMode: (mode) => set({ displayMode: mode }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSupports: () => set((s) => ({ showSupports: !s.showSupports })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),
}));
