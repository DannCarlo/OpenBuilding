import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useViewStore } from '../../store/viewStore';
import { UnitsBadge } from './UnitsBadge';

/**
 * Full-viewport 3D canvas with theme-aware background.
 */
export function ViewerCanvas() {
  const theme = useViewStore((s) => s.theme);
  const bg = theme === 'dark' ? '#0a0a0b' : '#ffffff';

  return (
    <div className="absolute inset-0" style={{ background: bg }}>
      <Canvas
        camera={{ position: [10, 8, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => { document.body.style.cursor = ''; }}
      >
        <Suspense fallback={null}>
          <Scene bgColor={bg} />
        </Suspense>
      </Canvas>
      <UnitsBadge />
    </div>
  );
}
