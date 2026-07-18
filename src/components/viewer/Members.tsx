import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useSceneGeometry, type MemberGeometryData } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';

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
        roughness={0.5}
        metalness={0.3}
        opacity={opacity}
        transparent={opacity < 1}
        wireframe={wireframe}
        emissive={hovered ? color : new THREE.Color(0x000000)}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  );
}

/**
 * Create section geometry from available dimensions. Returns a BufferGeometry.
 *   yd only              → CylinderGeometry (circular)
 *   yd + zd              → BoxGeometry (rectangular)
 *   yd + zd + zb         → ExtrudeGeometry (trapezoidal)
 *   yd + zd + yb + zb    → ExtrudeGeometry (T-shape)
 *   none                 → CylinderGeometry (default radius)
 */
function createSectionGeometry(data: MemberGeometryData): THREE.BufferGeometry {
  const { depthY: yd, depthZ: zd, depthYB: yb, depthZB: zb, length, radius } = data;

  // T-shape
  if (yd != null && zd != null && yb != null && zb != null) {
    return buildExtrudedShape(buildTShapePoints(yd, zd, yb, zb), length);
  }
  // Trapezoidal
  if (yd != null && zd != null && zb != null) {
    return buildExtrudedShape(buildTrapezoidPoints(yd, zd, zb), length);
  }
  // Rectangular
  if (yd != null && zd != null) {
    return new THREE.BoxGeometry(zd, length, yd);
  }
  // Circular or default
  return new THREE.CylinderGeometry(radius, radius, length, 8);
}

/** Build a 2D Shape from vertex pairs [[x,z], ...], then extrude along Y */
function buildExtrudedShape(points: [number, number][], length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: length, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -length / 2, 0);
  return geo;
}

/** Trapezoid: wider top (ZD), narrower bottom (ZB), height YD */
function buildTrapezoidPoints(yd: number, zd: number, zb: number): [number, number][] {
  const hy = yd / 2, hTop = zd / 2, hBot = zb / 2;
  return [
    [-hTop,  hy], [ hTop,  hy],  // top
    [ hBot, -hy], [-hBot, -hy],  // bottom
  ];
}

/** T-shape: flange ZD × (YD−YB), web ZB × YB */
function buildTShapePoints(yd: number, zd: number, yb: number, zb: number): [number, number][] {
  const hy = yd / 2, hFl = zd / 2, hWb = zb / 2, fh = yd - yb;
  return [
    [-hFl,  hy], [ hFl,  hy],           // flange top
    [ hFl,  hy - fh], [ hWb,  hy - fh], // flange bottom → web top
    [ hWb, -hy], [-hWb, -hy],           // web bottom
    [-hWb,  hy - fh], [-hFl,  hy - fh], // web top → flange bottom
  ];
}
