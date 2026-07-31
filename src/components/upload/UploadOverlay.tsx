import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp, Beaker, Blocks, FolderOpen, ExternalLink } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useModelParser } from '../../hooks/useModelParser';
import { useViewStore } from '../../store/viewStore';

/**
 * Welcome screen — shown when no model is loaded.
 * Glass-morphism card with drag-and-drop + quick-test samples.
 * The video background unmounts with the overlay, so it never
 * affects the 3D viewer's performance.
 */
export function UploadOverlay() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleDrop, handleDragOver, handleFileInput, progress } = useFileUpload();
  const { loadSample } = useModelParser();
  const theme = useViewStore((s) => s.theme);
  const isDark = theme === 'dark';

  const isLoading = progress > 0 && progress < 100;

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* ── Lazy video background ────────────────────────── */}
      {/* Mounted only when overlay is visible; unmounts when */}
      {/* a model is loaded → zero cost while viewing.       */}
      <video
        autoPlay
        loop
        muted
        playsInline
        disableRemotePlayback
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/upload-overlay-bg.webm" type="video/webm" />
      </video>

      {/* Tint layer — whitish in light, darkish in dark */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark ? 'bg-black/90' : 'bg-white/90'
        }`}
      />
      {/* ── Unified upload + samples card ────────────────── */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full md:w-auto md:max-w-[92vw] rounded-2xl md:rounded-4xl border border-border/60 bg-white/60 dark:bg-black/30 backdrop-blur-xl shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <FileUp size={32} className="text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">Processing file…</p>
              <p className="text-sm text-text-secondary mt-1">{progress}%</p>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-10 pb-6 flex flex-col items-center gap-4 text-center cursor-pointer hover:bg-accent/[0.05] transition-colors"
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-accent/8 flex items-center justify-center"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Upload size={36} className="text-accent" />
              </motion.div>
              <div>
                <p className="text-base font-semibold text-text-primary">Drop your .std file here</p>
                <p className="text-sm text-text-secondary mt-1">Supports STAAD .std format</p>
              </div>
            </div>

            {/* Browse button */}
            <div className="px-6 py-6 flex items-center justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer shadow-sm"
              >
                <FolderOpen size={16} />
                <span>Browse files</span>
              </button>
            </div>

            {/* Divider + samples */}
            <div className="border-t border-border/40 px-6 py-5 flex flex-col items-center gap-3.5">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-border" />
                <span className="text-[11px] font-medium text-text-secondary uppercase tracking-widest">Try a sample</span>
                <div className="h-px w-8 bg-border" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); loadSample('/sample-steel-test.STD', 'sample-steel-test.STD'); }}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-border/60 bg-white/50 dark:bg-black/20 backdrop-blur-sm hover:border-accent/40 hover:bg-accent/[0.04] transition-all text-sm text-text-secondary hover:text-text-primary cursor-pointer shadow-sm"
                >
                  <Beaker size={17} className="text-accent" />
                  <span className="font-medium">Steel Truss</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); loadSample('/sample-rc-test.std', 'sample-rc-test.std'); }}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-border/60 bg-white/50 dark:bg-black/20 backdrop-blur-sm hover:border-accent/40 hover:bg-accent/[0.04] transition-all text-sm text-text-secondary hover:text-text-primary cursor-pointer shadow-sm"
                >
                  <Blocks size={17} className="text-accent" />
                  <span className="font-medium">RC Building</span>
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".std"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* ── External links ───────────────────────────────── */}
      <div className="absolute bottom-5 left-5 max-md:left-0 max-md:right-0 max-md:flex max-md:justify-center z-20">
        <div className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary">
          <a
            href="https://github.com/DannCarlo/OpenBuilding"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-pointer"
          >
            <ExternalLink size={12} />
            <span>GitHub</span>
          </a>
          <span className="text-border/50 select-none">&middot;</span>
          <span>
            by{' '}
            <a
              href="https://www.linkedin.com/in/danncarlo/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary hover:underline transition-all cursor-pointer"
            >
              @danncarlo
            </a>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
