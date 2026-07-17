import { useCallback } from 'react';
import { useModelParser } from './useModelParser';
import { useUIStore } from '../store/uiStore';

export function useFileUpload() {
  const { parseFile, progress } = useModelParser();
  const { setShowUpload } = useUIStore();

  const handleFile = useCallback(
    (file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (ext !== '.std') {
        return;
      }
      parseFile(file);
      setShowUpload(false);
    },
    [parseFile, setShowUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return { handleDrop, handleDragOver, handleFileInput, progress };
}
