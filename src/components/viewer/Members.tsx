import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useSceneGeometry, type MemberGeometryData } from './useSceneGeometry';
import { useViewStore, type DisplayMode } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';
import { buildExtrudedProfile } from '../../lib/geometry-utils';
import {
  getMaterialSkin,
  RENDER_WARNING_COLOR,
  SELECTED_COLOR,
  HOVER_COLOR,
} from '../../lib/colors';

/**
 * Renders members with proper cross-section shapes.
 * Display modes:
 *   realistic — material-aware skins (steel metallic, concrete matte)
 *   semi      — semi-transparent, keeps section-type/purpose colors
 *               (columns red, beams blue, steel silver, …) for legibility
 *   wireframe — geometry edges only
 */
export function Members() {
  const geo = useSceneGeometry();
  const displayMode = useViewStore((s) => s.displayMode);
  const hoverMember = useUIStore((s) => s.hoverMember);
  const selectMember = useUIStore((s) => s.selectMember);

  if (!geo) return null;

  return (
    <group>
      {geo.memberData.map((m) => (
        <MemberCylinder
          key={m.memberId}
          data={m}
          mode={displayMode}
          onHover={(hovered) => hoverMember(hovered ? m.memberId : null)}
          onClick={() => selectMember(m.memberId)}
        />
      ))}
    </group>
  );
}

function MemberCylinder({
  data,
  mode,
  onHover,
  onClick,
}: {
  data: MemberGeometryData;
  mode: DisplayMode;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const realistic = mode === 'realistic';
  const semi = mode === 'semi';
  const wireframe = mode === 'wireframe';

  // Material-aware skin used in realistic mode only
  const skin = getMaterialSkin(data.materialType);

  // Final color — interaction states take priority, otherwise:
  //   realistic → material skin, semi → section-type/purpose color (data.color)
  let baseColor: string;
  if (data.isSelected) baseColor = SELECTED_COLOR;
  else if (data.isHovered) baseColor = HOVER_COLOR;
  else if (data.hasWarning) baseColor = RENDER_WARNING_COLOR;
  else baseColor = realistic ? skin.color : data.color;

  const color = new THREE.Color(baseColor);
  const opacity = semi ? 0.5 : 1;
  const isSteelSection = !!data.sectionType?.startsWith('STEEL_');
  const roughness = realistic ? skin.roughness : isSteelSection ? 0.35 : 0.5;
  const metalness = realistic ? skin.metalness : isSteelSection ? 0.75 : 0.3;

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
        key={mode}
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
