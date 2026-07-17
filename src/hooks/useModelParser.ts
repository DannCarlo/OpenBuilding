import { useCallback, useState } from 'react';
import { useModelStore } from '../store/modelStore';
import { parseStaadFile } from '../parser';
import { buildModel } from '../model/builder';

export function useModelParser() {
  const { setModel, setLoading, setError } = useModelStore();
  const [progress, setProgress] = useState(0);

  const parseFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const text = await readFileAsText(file, (p) => setProgress(p));
        setProgress(90);

        // Parse STAAD file
        const parsed = parseStaadFile(text);

        // Build normalized model
        const model = buildModel(parsed);

        setProgress(100);
        setModel(model, file.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setError(message);
      }
    },
    [setModel, setLoading, setError]
  );

  return { parseFile, progress };
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
