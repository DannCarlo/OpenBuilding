import { useViewStore } from '../../store/viewStore';
import { GRID_SIZE, GRID_DIVISIONS, GRID_COLORS } from '../../lib/constants';

/**
 * Ground reference grid with theme-aware colors.
 */
export function Grid() {
  const showGrid = useViewStore((s) => s.showGrid);
  const theme = useViewStore((s) => s.theme);

  if (!showGrid) return null;

  const colors = theme === 'dark' ? GRID_COLORS.dark : GRID_COLORS.light;

  return (
    <group>
      <gridHelper
        args={[GRID_SIZE, GRID_DIVISIONS, colors.center, colors.minor]}
        position={[0, -0.01, 0]}
      />
    </group>
  );
}
