import { useCallback, useState } from 'react';
import { useModelStore } from '../store/modelStore';
import { parseStaadFile } from '../parser';
import { buildModel } from '../model/builder';

export function useModelParser() {
  const { setModel, setLoading, setError } = useModelStore();
  const [progress, setProgress] = useState(0);

  // For upload overlay testing: parse a model from text and set it in the store (set only in STAAD for now)
  const setModelFromText = useCallback(
    (text: string, fileName: string) => {
      setProgress(90);
      const parsed = parseStaadFile(text);
      const model = buildModel(parsed);
      setProgress(100);
      setModel(model, fileName);
    },
    [setModel]
  );

  const parseFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const text = await readFileAsText(file, (p) => setProgress(p));
        setModelFromText(text, file.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setError(message);
      }
    },
    [setModelFromText, setLoading, setError]
  );

  const loadSample = useCallback(
    async (path: string, label: string) => {
      setLoading(true);
      setError(null);
      setProgress(5);
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        const text = await res.text();
        setProgress(80);
        setModelFromText(text, label);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load sample';
        setError(message);
      }
    },
    [setModelFromText, setLoading, setError]
  );

  return { parseFile, loadSample, progress };
}

function readFileAsText(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 80)); // 0-80% for reading
      }
    };

    reader.readAsText(file);
  });
}
