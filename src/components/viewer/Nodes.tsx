import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useViewStore } from '../../store/viewStore';
import { useSceneGeometry } from './useSceneGeometry';

/**
 * Renders all nodes as small spheres.
 */
export function Nodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useSceneGeometry();
  const displayMode = useViewStore((s) => s.displayMode);

  const count = geo ? geo.nodePositions.length / 3 : 0;
  const isWireframe = displayMode === 'wireframe';

  // Setup instance matrices - always call useFrame
  useFrame(() => {
    if (!meshRef.current || !geo || geo.nodePositions.length === 0) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.identity();
      matrix.makeScale(0.08, 0.08, 0.08);
      matrix.setPosition(
        geo.nodePositions[i * 3],
        geo.nodePositions[i * 3 + 1],
        geo.nodePositions[i * 3 + 2]
      );
      meshRef.current.setMatrixAt(i, matrix);
      meshRef.current.setColorAt(i, new THREE.Color('#999999'));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!geo || geo.nodePositions.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#999999"
        roughness={0.6}
        metalness={0.2}
        wireframe={isWireframe}
      />
    </instancedMesh>
  );
}
