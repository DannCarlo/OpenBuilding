import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useViewStore } from '../../store/viewStore';

/**
 * Theme-aware scene lighting.
 * Light mode: bright, airy, with warm sky tint.
 * Dark mode: moody, contrasty, with cool ambient.
 * Also installs an offline RoomEnvironment so metallic
 * (realistic-mode steel) surfaces get real reflections.
 */
export function Lighting() {
  const theme = useViewStore((s) => s.theme);
  const isDark = theme === 'dark';
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  // Procedural environment map for PBR reflections (no network fetch)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    return () => {
      scene.environment = null;
      envTex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <ambientLight intensity={isDark ? 0.35 : 0.55} />
      <directionalLight position={[10, 20, 10]} intensity={isDark ? 0.7 : 0.9} />
      <directionalLight position={[-5, 5, -5]} intensity={isDark ? 0.2 : 0.25} />
      <hemisphereLight
        args={[isDark ? '#8899bb' : '#b1d0ff', isDark ? '#334455' : '#e0e0e0', isDark ? 0.15 : 0.25]}
      />
    </>
  );
}
