import { useState } from 'react';
import * as THREE from 'three';
import { useSceneGeometry } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';
import { SELECTED_COLOR, HOVER_COLOR } from '../../lib/colors';

/**
 * Renders support symbols at support joint locations.
 *
 * Each support type gets a distinct, recognizable 3D representation
 * (structural-engineering drawing conventions, extruded to 3D):
 *
 *   FIXED        → base plate + pyramid        (rigid restraint into foundation)
 *   PINNED       → sphere ball joint + triangular bracket  (hinge)
 *   ROLLER       → cylinder roller + triangle  (free to roll in one direction)
 *   ENFORCED_BUT → base plate + sphere          (custom per-DOF restraint set)
 *   UNKNOWN      → neutral box fallback
 *
 * Supports are clickable — selection opens the InfoPanel with the restraint
 * table (FX/FY/FZ/MX/MY/MZ restrained vs free). Color remains a secondary cue.
 */
export function Supports() {
  const geo = useSceneGeometry();
  const showSupports = useViewStore((s) => s.showSupports);
  const selectedSupportNodeId = useUIStore((s) => s.selectedSupportNodeId);
  const selectSupport = useUIStore((s) => s.selectSupport);

  if (!geo || !showSupports) return null;

  return (
    <group>
      {geo.supportData.map((s) => (
        <SupportMarker
          key={s.nodeId}
          position={s.position}
          color={s.color}
          type={s.type}
          selected={s.isSelected}
          onClick={() => selectSupport(selectedSupportNodeId === s.nodeId ? null : s.nodeId)}
        />
      ))}
    </group>
  );
}

function SupportMarker({
  position,
  color,
  type,
  selected,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  type: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Selection (gold) / hover (blue) override the base support color
  const displayColor = selected ? SELECTED_COLOR : hovered ? HOVER_COLOR : color;
  const c = new THREE.Color(displayColor);

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

  const pointerProps = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onClick();
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = '';
    },
  };

  switch (type) {
    case 'FIXED':
      // Base plate (block) + 4-sided pyramid — rigidly locked into foundation
      return (
        <group position={position}>
          <mesh {...pointerProps} position={[0, -0.18, 0]}>
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
          <mesh {...pointerProps} position={[0, -0.1, 0]}>
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
          <mesh {...pointerProps} position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.14, 12]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.14, 0]}>
            <coneGeometry args={[0.14, 0.12, 3]} />
            {mat}
          </mesh>
        </group>
      );

    case 'ENFORCED_BUT':
      // Base plate + sphere — a mostly-restrained support with custom releases
      return (
        <group position={position}>
          <mesh {...pointerProps} position={[0, -0.14, 0]}>
            <boxGeometry args={[0.24, 0.08, 0.24]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            {mat}
          </mesh>
        </group>
      );

    default:
      // UNKNOWN — neutral box
      return (
        <mesh {...pointerProps} position={[position[0], position[1] - 0.12, position[2]]}>
          <boxGeometry args={[0.14, 0.08, 0.14]} />
          {mat}
        </mesh>
      );
  }
}
