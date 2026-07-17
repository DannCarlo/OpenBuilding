import { GlassPanel } from '../ui/GlassPanel';
import { useViewStore, type DisplayMode } from '../../store/viewStore';
import { Box, Grid3X3, Layers, Eye, EyeOff, Anchor } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Right-side toolbar for view mode controls.
 */
export function ViewToolbar() {
  const { displayMode, setDisplayMode, showLabels, toggleLabels, showGrid, toggleGrid, showSupports, toggleSupports } = useViewStore();

  const modes: { mode: DisplayMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'solid', icon: <Box size={16} />, label: 'Solid' },
    { mode: 'wireframe', icon: <Grid3X3 size={16} />, label: 'Wireframe' },
    { mode: 'semi', icon: <Layers size={16} />, label: 'Semi-transparent' },
  ];

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      <GlassPanel className="p-1.5 flex flex-col gap-1">
        {modes.map(({ mode, icon, label }) => (
          <IconButton
            key={mode}
            icon={icon}
            label={label}
            onClick={() => setDisplayMode(mode)}
            active={displayMode === mode}
          />
        ))}
      </GlassPanel>

      <GlassPanel className="p-1.5 flex flex-col gap-1">
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
      </GlassPanel>
    </div>
  );
}
