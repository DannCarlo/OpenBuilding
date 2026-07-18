/**
 * Section profile utilities — format-agnostic.
 *
 * Public exports:
 *   - Type re-exports: SectionProfile, SectionDim, SectionMeta
 *   - computeSectionProperties(profile) → { area, ix, iy }
 *
 * All polygon construction helpers are private to this module.
 * Parsers construct profile polygons inline using their own coordinate math.
 */

import type { SectionProfile } from '../parser/types';

// Re-export types for convenience (canonical source is parser/types.ts)
export type { SectionProfile, SectionDim, SectionMeta } from '../parser/types';

// ---------------------------------------------------------------------------
// computeSectionProperties — the one public utility
// ---------------------------------------------------------------------------

/**
 * Compute cross-section area and second moments of inertia from a polygon profile.
 *
 * The polygon should be centered at its centroid for correct Ix/Iy values.
 * This function automatically shifts the outer polygon to its centroid before
 * computing properties, so callers can construct polygons relative to any
 * convenient origin.
 *
 * Holes (pipe bore, HSS cavity) are subtracted from the outer polygon values.
 */
export function computeSectionProperties(profile: SectionProfile): { area: number; ix: number; iy: number } {
  // Compute centroid of outer boundary
  const [cx, cy] = polygonCentroid(profile.outer);

  // Shift outer to centroid, compute properties
  const shiftedOuter = shiftPoints(profile.outer, cx, cy);
  const outerProps = polygonProperties(shiftedOuter);

  // Holes: shift each by the same amount, subtract
  let holeArea = 0, holeIx = 0, holeIy = 0;
  for (const hole of profile.holes ?? []) {
    const shiftedHole = shiftPoints(hole, cx, cy);
    const hp = polygonProperties(shiftedHole);
    holeArea += hp.area;
    holeIx   += hp.ix;
    holeIy   += hp.iy;
  }

  return {
    area: outerProps.area - holeArea,
    ix:   outerProps.ix   - holeIx,
    iy:   outerProps.iy   - holeIy,
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Shoelace formula + second moment integrals about origin for a single polygon. */
function polygonProperties(pts: [number, number][]): { area: number; ix: number; iy: number } {
  let area = 0, ix = 0, iy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    ix   += cross * (y0 * y0 + y0 * y1 + y1 * y1);
    iy   += cross * (x0 * x0 + x0 * x1 + x1 * x1);
  }
  return { area: Math.abs(area) / 2, ix: Math.abs(ix) / 12, iy: Math.abs(iy) / 12 };
}

/** Polygon centroid via the shoelace formula. */
function polygonCentroid(pts: [number, number][]): [number, number] {
  let cx = 0, cy = 0, area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx  += (x0 + x1) * cross;
    cy  += (y0 + y1) * cross;
  }
  area = Math.abs(area) / 2;
  if (area < 1e-20) return [0, 0];
  return [cx / (6 * area), cy / (6 * area)];
}

/** Shift all points by (dx, dy). */
function shiftPoints(pts: [number, number][], dx: number, dy: number): [number, number][] {
  return pts.map(([x, y]) => [x - dx, y - dy]);
}

/** Approximate a circle as an n-gon polygon. */
export function polygonCircle(r: number, n: number = 24): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  });
}
