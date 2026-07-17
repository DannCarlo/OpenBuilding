import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { useViewStore, type DisplayMode } from '../../store/viewStore';
import { Box, Grid3X3, Layers, Eye, EyeOff, Anchor, Menu, X } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Right-side toolbar for view mode controls.
 * On mobile: collapses into a floating hamburger menu button.
 * On desktop: shows as a vertical glass panel.
 */
export function ViewToolbar() {
  const { displayMode, setDisplayMode, showLabels, toggleLabels, showGrid, toggleGrid, showSupports, toggleSupports } = useViewStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const modes: { mode: DisplayMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'solid', icon: <Box size={16} />, label: 'Solid' },
    { mode: 'wireframe', icon: <Grid3X3 size={16} />, label: 'Wireframe' },
    { mode: 'semi', icon: <Layers size={16} />, label: 'Semi' },
  ];

  const toolbarContent = (
    <>
      <div className="flex flex-row sm:flex-col gap-1">
        {modes.map(({ mode, icon, label }) => (
          <IconButton
            key={mode}
            icon={icon}
            label={label}
            onClick={() => { setDisplayMode(mode); setMenuOpen(false); }}
            active={displayMode === mode}
          />
        ))}
      </div>
      <div className="w-px h-5 sm:w-5 sm:h-px bg-[var(--color-border)]" />
      <div className="flex flex-row sm:flex-col gap-1">
        <IconButton
          icon={showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          label={showLabels ? 'Hide labels' : 'Show labels'}
          onClick={toggleLabels}
          active={showLabels}
        />
        <IconButton
          icon={<Grid3X3 size={16} />}
          label={showGrid ? 'Hide grid' : 'Show grid'}
          onClick={toggleGrid}
          active={showGrid}
        />
        <IconButton
          icon={<Anchor size={16} />}
          label={showSupports ? 'Hide supports' : 'Show supports'}
          onClick={toggleSupports}
          active={showSupports}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-50 hidden sm:flex flex-col gap-3">
        <GlassPanel className="p-2.5 flex flex-col gap-2.5 items-center">
          {toolbarContent}
        </GlassPanel>
      </div>

      {/* Mobile: hamburger menu button + dropdown */}
      <div className="absolute top-16 right-4 z-50 sm:hidden flex flex-col items-end gap-2">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2.5 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] shadow-sm text-[var(--color-text-primary)]"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <GlassPanel className="p-3.5 flex flex-row gap-3.5 items-center">
                {toolbarContent}
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
