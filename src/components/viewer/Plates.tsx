import { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useModelStore } from '../../store/modelStore';
import { useViewStore, type DisplayMode } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';
import { getMaterialSkin, SELECTED_COLOR } from '../../lib/colors';

const MIN_THICK = 0.05; // fallback when thickness is missing or zero

// ---------------------------------------------------------------------------
// Face triangulation tables (CCW winding → outward normal for top/sides)
// ---------------------------------------------------------------------------
const QUAD_INDICES = [
  0,2,1, 0,3,2,     // bottom (inward)
  4,5,6, 4,6,7,     // top (outward)
  0,1,5, 0,5,4,     // side 0→1
  1,2,6, 1,6,5,     // side 1→2
  2,3,7, 2,7,6,     // side 2→3
  3,0,4, 3,4,7,     // side 3→0
];

const TRI_INDICES = [
  0,2,1,             // bottom (inward)
  3,4,5,             // top (outward)
  0,1,4, 0,4,3,     // side 0→1
  1,2,5, 1,5,4,     // side 1→2
  2,0,3, 2,3,5,     // side 2→0
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Face normal from first 3 points (assumes CCW winding). */
function faceNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3()
    .crossVectors(
      new THREE.Vector3().subVectors(b, a),
      new THREE.Vector3().subVectors(c, a),
    )
    .normalize();
}

/**
 * Build a solid prism from a planar polygon (3 or 4 nodes) extruded along
 * its face normal by per-node half‑thicknesses.
 *
 *  - nodeCount = 3 → 6-vertex pentahedron
 *  - nodeCount = 4 → 8-vertex hexahedron
 *
 * Vertices 0..n-1 are the bottom face, n..2n-1 the top face.
 * The reference surface is the mid‑plane.
 */
function buildPrism(
  pts: THREE.Vector3[],
  thicknesses: number[],
  normal: THREE.Vector3,
  nodeCount: 3 | 4,
): { vertices: Float32Array; indices: number[] } {
  const n = nodeCount;
  const half = Array.from({ length: n }, (_, i) =>
    Math.max(thicknesses[i] ?? MIN_THICK, MIN_THICK) / 2,
  );

  const vertices = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const h = half[i];
    // bottom
    const bi = i * 3;
    vertices[bi]     = p.x - normal.x * h;
    vertices[bi + 1] = p.y - normal.y * h;
    vertices[bi + 2] = p.z - normal.z * h;
    // top
    const ti = (i + n) * 3;
    vertices[ti]     = p.x + normal.x * h;
    vertices[ti + 1] = p.y + normal.y * h;
    vertices[ti + 2] = p.z + normal.z * h;
  }

  return { vertices, indices: n === 4 ? [...QUAD_INDICES] : [...TRI_INDICES] };
}

/**
 * Renders plate/shell elements as solid 3D bodies with per-node thickness.
 * Reference surface = mid-plane; half thickness above, half below.
 * Click to select, hover for highlight.
 */
export function Plates() {
  const model = useModelStore((s) => s.model);
  const displayMode = useViewStore((s) => s.displayMode);
  const selectedPlateId = useUIStore((s) => s.selectedPlateId);
  const selectPlate = useUIStore((s) => s.selectPlate);

  const solids = useMemo(() => {
    if (!model || model.plates.length === 0) return null;

    const nodeMap = new Map(model.nodes.map(n => [n.id, n]));

    const result: { geo: THREE.BufferGeometry; id: number; materialType?: string }[] = [];

    for (const pl of model.plates) {
      const pts = pl.nodeIds
        .map(nid => nodeMap.get(nid))
        .filter(Boolean)
        .map(n => new THREE.Vector3(n!.x, n!.y, n!.z));

      if (pts.length < 3) continue;

      const normal = faceNormal(pts[0], pts[1], pts[2]);
      const nodeCount = pts.length >= 4 ? 4 : 3;
      const data = buildPrism(pts.slice(0, nodeCount), pl.thicknesses, normal, nodeCount as 3 | 4);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(data.vertices, 3));
      geo.setIndex(data.indices);
      geo.computeVertexNormals();

      result.push({ geo, id: pl.id, materialType: pl.material?.type });
    }
    return result;
  }, [model]);

  if (!solids || solids.length === 0) return null;

  return (
    <group>
      {solids.map(({ geo, id, materialType }) => (
        <PlateMesh
          key={id}
          geometry={geo}
          plateId={id}
          mode={displayMode}
          materialType={materialType}
          selected={selectedPlateId === id}
          onClick={() => selectPlate(selectedPlateId === id ? null : id)}
        />
      ))}
    </group>
  );
}

function PlateMesh({
  geometry,
  plateId: _id,
  mode,
  materialType,
  selected,
  onClick,
}: {
  geometry: THREE.BufferGeometry;
  plateId: number;
  mode: DisplayMode;
  materialType?: string;
  selected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const realistic = mode === 'realistic';
  const wireframe = mode === 'wireframe';

  // Material-aware skin (realistic mode only); semi keeps the green plate color
  const skin = getMaterialSkin(materialType);
  const defaultPlateColor = '#50C878';

  let baseColor: string;
  if (selected) baseColor = SELECTED_COLOR;
  else if (hovered) baseColor = '#88DDA0';
  else baseColor = realistic ? skin.color : defaultPlateColor;

  // Realistic mode is fully opaque (highlight via color change).
  // Semi mode stays translucent, with stronger opacity on selection/hover.
  const opacity = realistic ? 1 : selected ? 0.7 : hovered ? 0.6 : 0.45;
  const roughness = realistic ? skin.roughness : 0.6;
  const metalness = realistic ? skin.metalness : 0.1;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
    >
      <meshStandardMaterial
        key={mode}
        color={baseColor}
        roughness={roughness}
        metalness={metalness}
        opacity={opacity}
        transparent={opacity < 1}
        side={THREE.FrontSide}
        wireframe={wireframe}
      />
    </mesh>
  );
}
