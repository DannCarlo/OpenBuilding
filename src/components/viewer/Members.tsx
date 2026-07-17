import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useSceneGeometry, type MemberGeometryData } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';

/**
 * Renders members with proper cross-section shapes.
 * Rectangular/T-shape → box geometry.
 * Trapezoidal → tapered 4-sided cylinder (wider one end).
 * Circular → cylinder geometry.
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

  // Choose geometry based on section type
  const geom = getMemberGeometry(data);

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
      {geom}
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

/** Pick the right geometry for the section type */
function getMemberGeometry(data: MemberGeometryData) {
  // Trapezoidal: extrude trapezoid cross-section (constant along member)
  if (data.sectionType === 'TRAPEZOIDAL' && data.depthY != null && data.depthZ != null && data.depthZB != null) {
    return <primitive object={createTrapezoidShape(data.depthY, data.depthZ, data.depthZB, data.length)} attach="geometry" />;
  }

  // T-shape: extrude T-profile cross-section (constant along member)
  if (data.sectionType === 'TSHAPE' && data.depthY != null && data.depthZ != null && data.depthYB != null && data.depthZB != null) {
    return <primitive object={createTShape(data.depthY, data.depthZ, data.depthYB, data.depthZB, data.length)} attach="geometry" />;
  }

  // Rectangular: box
  if (data.depthY != null && data.depthZ != null) {
    return <boxGeometry args={[data.depthZ, data.length, data.depthY]} />;
  }

  // Circular or default: cylinder
  return <cylinderGeometry args={[data.radius, data.radius, data.length, 8]} />;
}

/**
 * Create a trapezoidal prism — constant trapezoid cross-section extruded along length.
 * YD = total height, ZD = top width, ZB = bottom width.
 * Cross-section in XZ plane (member runs along Y).
 */
function createTrapezoidShape(h: number, topW: number, botW: number, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hh = h / 2;
  const hTop = topW / 2;
  const hBot = botW / 2;
  // Trapezoid shape in XZ plane: wider at top (Z+), narrower at bottom (Z-)
  // Vertices: top-left, top-right, bottom-right, bottom-left
  shape.moveTo(-hTop,  hh);  // top-left
  shape.lineTo( hTop,  hh);  // top-right
  shape.lineTo( hBot, -hh);  // bottom-right
  shape.lineTo(-hBot, -hh);  // bottom-left
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: length,
    bevelEnabled: false,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // ExtrudeGeometry extrudes along Z; we need to rotate so it runs along Y
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -length / 2, 0);
  return geo;
}

/**
 * Create a T-shape prism — constant T-profile cross-section extruded along length.
 * YD = total height, ZD = flange width, YB = web height, ZB = web width.
 */
function createTShape(yd: number, zd: number, yb: number, zb: number, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hy = yd / 2;
  const hFlange = zd / 2;
  const hWeb = zb / 2;
  const flangeH = yd - yb; // flange thickness = total height - web height

  // T-shape in XZ plane: flange on top (+Z), web below
  // Start from top-left of flange, go clockwise
  shape.moveTo(-hFlange,  hy);                      // top-left flange
  shape.lineTo( hFlange,  hy);                      // top-right flange
  shape.lineTo( hFlange,  hy - flangeH);             // right flange bottom
  shape.lineTo( hWeb,     hy - flangeH);             // right web top
  shape.lineTo( hWeb,    -hy);                       // right web bottom
  shape.lineTo(-hWeb,    -hy);                       // left web bottom
  shape.lineTo(-hWeb,     hy - flangeH);             // left web top
  shape.lineTo(-hFlange,  hy - flangeH);             // left flange bottom
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: length,
    bevelEnabled: false,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -length / 2, 0);
  return geo;
}
