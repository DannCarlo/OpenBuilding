import { create } from 'zustand';
import type { ParsedModel } from '../model/types';

interface ModelState {
  model: ParsedModel | null;
  fileName: string | null;
  isLoading: boolean;
  error: string | null;

  setModel: (model: ParsedModel, fileName: string) => void;
  clearModel: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  model: null,
  fileName: null,
  isLoading: false,
  error: null,

  setModel: (model, fileName) => set({ model, fileName, error: null, isLoading: false }),
  clearModel: () => set({ model: null, fileName: null, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));
