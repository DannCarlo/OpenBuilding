import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useSceneGeometry, type MemberGeometryData } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';

/**
 * Renders members as individual cylinder meshes with interaction.
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

  return (
    <mesh
      ref={meshRef}
      position={data.position}
      rotation={data.rotation}
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
      <cylinderGeometry args={[data.radius, data.radius, data.length, 6]} />
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
