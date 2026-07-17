import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useViewStore } from '../../store/viewStore';

/**
 * Wraps the R3F Canvas with suspense and background color.
 */
export function ViewerCanvas() {
  const theme = useViewStore((s) => s.theme);
  const bgColor = theme === 'dark' ? '#0a0a0b' : '#f5f5f7';

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [10, 8, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: bgColor }}
        onPointerMissed={() => {
          document.body.style.cursor = '';
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
