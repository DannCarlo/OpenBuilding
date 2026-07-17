import { useViewStore } from '../../store/viewStore';
import { GRID_SIZE, GRID_DIVISIONS, GRID_COLOR, GRID_CENTER_COLOR } from '../../lib/constants';

/**
 * Ground reference grid.
 */
export function Grid() {
  const showGrid = useViewStore((s) => s.showGrid);

  if (!showGrid) return null;

  return (
    <group>
      <gridHelper
        args={[GRID_SIZE, GRID_DIVISIONS, GRID_CENTER_COLOR, GRID_COLOR]}
        position={[0, -0.01, 0]}
      />
    </group>
  );
}
