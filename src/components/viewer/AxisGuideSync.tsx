import { useFrame, useThree } from '@react-three/fiber';
import { axisGuideHandles } from './axisGuideBridge';

/**
 * Lives inside the Canvas. Each frame it projects the world axes into the
 * screen plane of the main camera and writes the resulting line/tip/label
 * transforms into the DOM axis guide (no React re-render).
 *
 * Guide convention (Z-up): X/Y horizontal, Z vertical (model up = Y).
 */
const GUIDE_AXES: [number, number, number][] = [
  [1, 0, 0], // guide X = model X
  [0, 0, 1], // guide Y = model Z (horizontal)
  [0, 1, 0], // guide Z = model Y (up)
];

const AXIS_LENGTH = 38;   // viewBox units
const LABEL_OFFSET = 14;  // viewBox units past the tip
const VIEWBOX = 100;      // SVG viewBox size

export function AxisGuideSync() {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const h = axisGuideHandles.current;
    if (!h) return;

    camera.updateMatrixWorld();
    const e = camera.matrixWorld.elements;
    // Column-major rotation basis: X = right, Y = up, Z = backward
    const right = { x: e[0], y: e[1], z: e[2] };
    const up = { x: e[4], y: e[5], z: e[6] };
    const fwd = { x: -e[8], y: -e[9], z: -e[10] };

    const pxPerUnit = h.container.clientWidth / VIEWBOX;

    for (let i = 0; i < 3; i++) {
      const [dx, dy, dz] = GUIDE_AXES[i];

      // Project direction onto the camera screen plane (CSS y is down)
      const sx = dx * right.x + dy * right.y + dz * right.z;
      const sy = -(dx * up.x + dy * up.y + dz * up.z);

      const ex = sx * AXIS_LENGTH;
      const ey = sy * AXIS_LENGTH;

      // Fade axes pointing away from the camera for a proper 3D feel
      const away = dx * fwd.x + dy * fwd.y + dz * fwd.z;
      const opacity = away >= 0 ? 1 : 0.28;

      h.lines[i].setAttribute('x2', String(ex));
      h.lines[i].setAttribute('y2', String(ey));
      h.lines[i].setAttribute('opacity', String(opacity));
      h.tips[i].setAttribute('cx', String(ex));
      h.tips[i].setAttribute('cy', String(ey));
      h.tips[i].setAttribute('opacity', String(opacity));

      // Label: center on tip + outward offset (convert viewBox → px)
      const lx = (ex + sx * LABEL_OFFSET) * pxPerUnit;
      const ly = (ey + sy * LABEL_OFFSET) * pxPerUnit;
      h.labels[i].style.transform = `translate(calc(-50% + ${lx}px), calc(-50% + ${ly}px))`;
      h.labels[i].style.opacity = String(opacity);
    }
  });

  return null;
}
