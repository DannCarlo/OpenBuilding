import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { SUPPORTED_FORMATS } from '../../lib/constants';

/**
 * Welcome screen — shown when no model is loaded.
 * Drag-and-drop or click to upload a structural analysis file.
 */
export function UploadOverlay() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleDrop, handleDragOver, handleFileInput, progress } = useFileUpload();

  // Show a loading state during parsing
  const isLoading = progress > 0 && progress < 100;

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-110 max-w-[92vw] p-10 sm:p-14 rounded-2xl border-2 border-dashed border-border hover:border-accent transition-colors cursor-pointer flex flex-col items-center gap-5 sm:gap-7 text-center"
      >
        {isLoading ? (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <FileUp size={32} className="text-accent" />
            </div>
            <div>
              <p className="text-lg font-medium text-text-primary">Processing file…</p>
              <p className="text-sm text-text-secondary mt-1">{progress}%</p>
            </div>
            <div className="w-full h-1.5 bg-borderrounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </>
        ) : (
          <>
            <motion.div
              className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Upload size={36} className="text-accent" />
            </motion.div>
            <div>
              <p className="text-lg font-medium text-text-primary">Drop your .std file here</p>
              <p className="text-sm text-text-secondary mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-text-secondary opacity-60">{SUPPORTED_FORMATS}</p>
          </>
        )}
      </div>
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
