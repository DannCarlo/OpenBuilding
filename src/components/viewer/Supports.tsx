import * as THREE from 'three';
import { useSceneGeometry } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';

/**
 * Renders support symbols at support joint locations.
 */
export function Supports() {
  const geo = useSceneGeometry();
  const showSupports = useViewStore((s) => s.showSupports);

  if (!geo || !showSupports) return null;

  return (
    <group>
      {geo.supportData.map((s, i) => (
        <SupportMarker key={i} position={s.position} color={s.color} type={s.type} />
      ))}
    </group>
  );
}

function SupportMarker({
  position,
  color,
  type,
}: {
  position: [number, number, number];
  color: string;
  type: string;
}) {
  const c = new THREE.Color(color);
  const size = 0.2;

  if (type === 'FIXED') {
    // Pyramid/cone pointing down to indicate fixed
    return (
      <mesh position={[position[0], position[1] - size / 2, position[2]]}>
        <coneGeometry args={[size * 0.7, size, 6]} />
        <meshStandardMaterial color={c} roughness={0.4} metalness={0.3} />
      </mesh>
    );
  }

  if (type === 'PINNED') {
    // Small sphere
    return (
      <mesh position={[position[0], position[1] - size / 2, position[2]]}>
        <sphereGeometry args={[size * 0.5, 8, 8]} />
        <meshStandardMaterial color={c} roughness={0.4} metalness={0.3} />
      </mesh>
    );
  }

  // Default: small box
  return (
    <mesh position={[position[0], position[1] - size / 2, position[2]]}>
      <boxGeometry args={[size * 0.6, size * 0.3, size * 0.6]} />
      <meshStandardMaterial color={c} roughness={0.4} metalness={0.3} />
    </mesh>
  );
}
