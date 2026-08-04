import * as THREE from 'three';
import { useSceneGeometry } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';

/**
 * Renders support symbols at support joint locations.
 *
 * Each support type gets a distinct, recognizable 3D representation
 * (structural-engineering drawing conventions, extruded to 3D):
 *
 *   FIXED   → base plate + pyramid        (rigid restraint into foundation)
 *   PINNED  → sphere ball joint + triangular bracket  (hinge)
 *   ROLLER  → cylinder roller + triangle  (free to roll in one direction)
 *   UNKNOWN → neutral box fallback
 *
 * Color (SUPPORT_COLORS) remains a secondary cue.
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

  // Shared material — slight emissive so markers stay visible in dark scenes
  const mat = (
    <meshStandardMaterial
      color={c}
      roughness={0.4}
      metalness={0.3}
      emissive={c}
      emissiveIntensity={0.15}
    />
  );

  switch (type) {
    case 'FIXED':
      // Base plate (block) + 4-sided pyramid — rigidly locked into foundation
      return (
        <group position={position}>
          <mesh position={[0, -0.18, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.3]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <coneGeometry args={[0.11, 0.16, 4]} />
            {mat}
          </mesh>
        </group>
      );

    case 'PINNED':
      // Sphere (ball joint) resting on a triangular bracket — hinge
      return (
        <group position={position}>
          <mesh position={[0, -0.1, 0]}>
            <coneGeometry args={[0.13, 0.16, 3]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            {mat}
          </mesh>
        </group>
      );

    case 'ROLLER':
      // Horizontal cylinder (roller) above a triangle base — free to roll
      return (
        <group position={position}>
          <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.14, 12]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.14, 0]}>
            <coneGeometry args={[0.14, 0.12, 3]} />
            {mat}
          </mesh>
        </group>
      );

    default:
      // UNKNOWN — neutral box
      return (
        <mesh position={[position[0], position[1] - 0.12, position[2]]}>
          <boxGeometry args={[0.14, 0.08, 0.14]} />
          {mat}
        </mesh>
      );
  }
}
