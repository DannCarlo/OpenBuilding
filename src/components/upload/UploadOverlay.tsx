import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { SUPPORTED_FORMATS } from '../../lib/constants';

/**
 * Initial upload overlay with drag-and-drop.
 */
export function UploadOverlay() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleDrop, handleDragOver, handleFileInput, progress } = useFileUpload();

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--color-bg-primary)]/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <DropZone
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        progress={progress}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".std"
        onChange={handleFileInput}
        className="hidden"
      />
    </motion.div>
  );
}

function DropZone({
  onDrop,
  onDragOver,
  onClick,
  progress,
}: {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onClick: () => void;
  progress: number;
}) {
  const isLoading = progress > 0 && progress < 100;

  return (
    <motion.div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onClick}
      className="w-[420px] max-w-[90vw] p-10 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors cursor-pointer flex flex-col items-center gap-5 text-center"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      animate={{
        borderColor: isLoading ? 'var(--color-accent)' : 'var(--color-border)',
      }}
    >
      {isLoading ? (
        <>
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
            <FileUp size={32} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              Processing file...
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {progress}%
            </p>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-accent)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </>
      ) : (
        <>
          <motion.div
            className="w-20 h-20 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Upload size={36} className="text-[var(--color-accent)]" />
          </motion.div>
          <div>
            <p className="text-lg font-medium text-[var(--color-text-primary)]">
              Drop your .std file here
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              or click to browse
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] opacity-60">
            {SUPPORTED_FORMATS}
          </p>
        </>
      )}
    </motion.div>
  );
}
