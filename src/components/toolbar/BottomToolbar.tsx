import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, Hand, Box, Grid3X3, Layers,
  Eye, EyeOff, Anchor, Maximize2, BarChart3, Wrench,
} from 'lucide-react';
import { Popover } from '../ui/Popover';
import { useModelStore } from '../../store/modelStore';
import { useViewStore, type DisplayMode, type NavMode } from '../../store/viewStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAT_COLORS: Record<string, string> = {
  nodes: '#4A90D9',
  members: '#E85D47',
  supports: '#50C878',
  plates: '#9B59B6',
};

const displayModes: { mode: DisplayMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'solid', icon: <Box size={14} />, label: 'Solid' },
  { mode: 'wireframe', icon: <Grid3X3 size={14} />, label: 'Wire' },
  { mode: 'semi', icon: <Layers size={14} />, label: 'Semi' },
];

const navModes: { mode: NavMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'orbit', icon: <Crosshair size={14} />, label: 'Orbit' },
  { mode: 'pan', icon: <Hand size={14} />, label: 'Pan' },
];

// ---------------------------------------------------------------------------
// Shared button className builders
// ---------------------------------------------------------------------------

function modeBtnClass(active: boolean) {
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
    transition-all duration-150
    ${active
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`;
}

function toggleBtnClass(active: boolean) {
  return `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
    transition-all duration-150
    ${active
      ? 'bg-blue-50 text-blue-600'
      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`;
}

function actionBtnClass(disabled = false) {
  return `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
    transition-all duration-150
    ${disabled
      ? 'text-slate-300 cursor-default'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`;
}

// ---------------------------------------------------------------------------
// Popover item button
// ---------------------------------------------------------------------------

function popoverItemClass(active: boolean, variant: 'mode' | 'toggle') {
  if (variant === 'mode') {
    return `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left
      transition-all duration-150
      ${active
        ? 'bg-slate-900 text-white'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`;
  }
  return `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left
    transition-all duration-150
    ${active
      ? 'bg-blue-50 text-blue-600'
      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BottomToolbar() {
  const model = useModelStore((s) => s.model);
  const {
    displayMode, setDisplayMode,
    navMode, setNavMode,
    showGrid, toggleGrid,
    showLabels, toggleLabels,
    showSupports, toggleSupports,
    showStats, toggleStats,
    triggerFitView,
  } = useViewStore();

  const [openPopover, setOpenPopover] = useState<string | null>(null);

  if (!model) return null;

  const nodeCount = model.nodes.length;
  const memberCount = model.members.length;
  const supportCount = model.supports.length;
  const plateCount = model.plates.length;

  // ------------------------------------------------------------------
  // Shared toolbar content
  // ------------------------------------------------------------------

  const desktopContent = (
    <>
      {/* Group 1: Nav Mode */}
      <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
        {navModes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setNavMode(mode)}
            className={modeBtnClass(navMode === mode)}
            title={label}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Group 2: Display Mode */}
      <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
        {displayModes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setDisplayMode(mode)}
            className={modeBtnClass(displayMode === mode)}
            title={label}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Group 3: View Toggles */}
      <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
        <button onClick={toggleGrid} className={toggleBtnClass(showGrid)} title="Toggle grid">
          <Grid3X3 size={14} />
          <span className="hidden sm:inline">Grid</span>
        </button>
        <button onClick={toggleLabels} className={toggleBtnClass(showLabels)} title="Toggle labels">
          {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="hidden sm:inline">Labels</span>
        </button>
        <button onClick={toggleSupports} className={toggleBtnClass(showSupports)} title="Toggle supports">
          <Anchor size={14} />
          <span className="hidden sm:inline">Support</span>
        </button>
      </div>

      {/* Group 4: Fit View */}
      <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
        <button onClick={triggerFitView} className={actionBtnClass()} title="Fit view (F)">
          <Maximize2 size={14} />
          <span className="hidden sm:inline">Fit</span>
        </button>
      </div>

      {/* Group 5: Stats */}
      <div className="flex items-center gap-0.5">
        <button onClick={toggleStats} className={actionBtnClass()} title="Toggle stats">
          <BarChart3 size={14} />
        </button>
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 pl-3 ml-2 border-l border-slate-200 overflow-hidden whitespace-nowrap"
            >
              <StatDot color={STAT_COLORS.nodes} value={nodeCount} label="Nodes" />
              <StatDot color={STAT_COLORS.members} value={memberCount} label="Members" />
              <StatDot color={STAT_COLORS.supports} value={supportCount} label="Supports" />
              {plateCount > 0 && (
                <StatDot color={STAT_COLORS.plates} value={plateCount} label="Plates" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <>
      {/* ── Desktop ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 hidden lg:flex
                      items-center justify-center pb-3 pt-1 px-4 select-none pointer-events-none">
        <div className="flex items-center gap-1
                        bg-white/70 backdrop-blur-xl
                        border border-slate-200/50
                        rounded-2xl px-2 py-2
                        shadow-lg shadow-slate-200/50
                        pointer-events-auto">
          {desktopContent}
        </div>
      </div>

      {/* ── Mobile: fixed full-width scrollable bottom bar (TradingView-style) ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden
                      bg-white/80 backdrop-blur-xl
                      border-t border-slate-200/50
                      overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 px-3 py-2.5 min-w-max">

          {/* 3D Dropdown */}
          <Popover
            label="3D"
            icon={<Crosshair size={14} />}
            open={openPopover === '3d'}
            onOpenChange={(v) => setOpenPopover(v ? '3d' : null)}
          >
            {navModes.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => { setNavMode(mode); setOpenPopover(null); }}
                className={popoverItemClass(navMode === mode, 'mode')}
              >
                {icon} {label}
              </button>
            ))}
          </Popover>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* View Dropdown */}
          <Popover
            label="View"
            icon={<Eye size={14} />}
            open={openPopover === 'view'}
            onOpenChange={(v) => setOpenPopover(v ? 'view' : null)}
          >
            {displayModes.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => { setDisplayMode(mode); setOpenPopover(null); }}
                className={popoverItemClass(displayMode === mode, 'mode')}
              >
                {icon} {label}
              </button>
            ))}
          </Popover>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Util Dropdown */}
          <Popover
            label="Util"
            icon={<Wrench size={14} />}
            open={openPopover === 'util'}
            onOpenChange={(v) => setOpenPopover(v ? 'util' : null)}
          >
            <button
              onClick={() => { toggleGrid(); setOpenPopover(null); }}
              className={popoverItemClass(showGrid, 'toggle')}
            >
              <Grid3X3 size={14} /> Grid {showGrid ? 'on' : 'off'}
            </button>
            <button
              onClick={() => { toggleLabels(); setOpenPopover(null); }}
              className={popoverItemClass(showLabels, 'toggle')}
            >
              {showLabels ? <Eye size={14} /> : <EyeOff size={14} />} Labels {showLabels ? 'on' : 'off'}
            </button>
            <button
              onClick={() => { toggleSupports(); setOpenPopover(null); }}
              className={popoverItemClass(showSupports, 'toggle')}
            >
              <Anchor size={14} /> Support {showSupports ? 'on' : 'off'}
            </button>
          </Popover>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Fit View */}
          <button onClick={triggerFitView} className={actionBtnClass()} title="Fit view">
            <Maximize2 size={14} />
            <span>Fit</span>
          </button>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Stats Toggle + Inline */}
          <button onClick={toggleStats} className={actionBtnClass()} title="Toggle stats">
            <BarChart3 size={14} />
          </button>
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
              >
                <DotOnly color={STAT_COLORS.nodes} value={nodeCount} />
                <DotOnly color={STAT_COLORS.members} value={memberCount} />
                <DotOnly color={STAT_COLORS.supports} value={supportCount} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tiny inline helpers
// ---------------------------------------------------------------------------

function StatDot({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-[11px] text-slate-600 font-mono tabular-nums font-semibold">{value}</span>
    </div>
  );
}

function DotOnly({ color, value }: { color: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-slate-600 font-mono tabular-nums font-semibold">{value}</span>
    </div>
  );
}
