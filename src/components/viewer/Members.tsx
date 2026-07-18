import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useSceneGeometry, type MemberGeometryData } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';
import { buildExtrudedProfile } from '../../lib/geometry-utils';

/**
 * Renders members with proper cross-section shapes.
 * Shape is determined automatically from which dimensions are present.
 */
export function Members() {
  const geo = useSceneGeometry();
  const displayMode = useViewStore((s) => s.displayMode);
  const hoverMember = useUIStore((s) => s.hoverMember);
  const selectMember = useUIStore((s) => s.selectMember);

  if (!geo) return null;

  const isWireframe = displayMode === 'wireframe';
  const isSemi = displayMode === 'semi';

  return (
    <group>
      {geo.memberData.map((m) => (
        <MemberCylinder
          key={m.memberId}
          data={m}
          wireframe={isWireframe}
          semi={isSemi}
          onHover={(hovered) => hoverMember(hovered ? m.memberId : null)}
          onClick={() => selectMember(m.memberId)}
        />
      ))}
    </group>
  );
}

function MemberCylinder({
  data,
  wireframe,
  semi,
  onHover,
  onClick,
}: {
  data: MemberGeometryData;
  wireframe: boolean;
  semi: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = new THREE.Color(data.color);
  const opacity = semi ? 0.5 : 1;
  const isSteel = data.sectionType?.startsWith('STEEL_');
  const metalness = isSteel ? 0.75 : 0.3;
  const roughness = isSteel ? 0.35 : 0.5;

  // Compute rotation: align axes, then apply beta around member direction
  const rot = data.rotation ? new THREE.Euler(data.rotation[0], data.rotation[1], data.rotation[2]) : new THREE.Euler();
  if (data.beta) {
    const alignQ = new THREE.Quaternion().setFromEuler(rot);
    // Member direction is local Y after alignment = world-space vector we can get from the alignment
    const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(alignQ);
    const betaQ = new THREE.Quaternion().setFromAxisAngle(dir, THREE.MathUtils.degToRad(data.beta));
    // beta after alignment: betaQ * alignQ
    betaQ.multiply(alignQ);
    rot.setFromQuaternion(betaQ);
  }

  // Choose geometry — single function determines shape from available dimensions
  const geom = createSectionGeometry(data);

  return (
    <mesh
      ref={meshRef}
      position={data.position}
      rotation={rot}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(false);
        document.body.style.cursor = '';
      }}
    >
      <primitive object={geom} attach="geometry" />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        opacity={opacity}
        transparent={opacity < 1}
        wireframe={wireframe}
        emissive={hovered ? color : new THREE.Color(0x000000)}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  );
}

/** Unified geometry builder — dispatches on profile presence only. */
function createSectionGeometry(data: MemberGeometryData): THREE.BufferGeometry {
  if (data.profile) {
    return buildExtrudedProfile(data.profile, data.length);
  }
  return new THREE.CylinderGeometry(data.radius, data.radius, data.length, 8);
}
