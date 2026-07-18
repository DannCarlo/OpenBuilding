// Shared parser types — the contract ALL format parsers (STAAD, ETABS, SAP2000, etc.)
// must produce. The model builder and 3D viewer consume ONLY these types.

/** A point in 3D space (format-agnostic: not "Joint" or "Point") */
export interface ParseNode {
  id: number;
  x: number;
  y: number;
  z: number;
}

// ── Section profile contracts (new — Phase 1) ────────────────────────────

/** A cross-section polygon. Origin should be the centroid for correct beam theory. */
export interface SectionProfile {
  /** Outer boundary vertices as [x, z] pairs in the member's local cross-section plane.
   *  x = local horizontal (weak axis), z = local vertical (strong axis).
   *  Centroid at origin. */
  outer: [number, number][];
  /** Inner voids — one array per hole (pipe bore, HSS cavity, etc.) */
  holes?: [number, number][][];
}

/** A single named dimension for display in the InfoPanel. */
export interface SectionDim {
  name: string;    // e.g. "Depth", "Flange Width", "Wall Thickness"
  value: number;   // meters
}

/** Human-readable metadata about a section. Produced at parse time, consumed by InfoPanel. */
export interface SectionMeta {
  /** Short display label  e.g. "W12×26", "300×600 Rectangle" */
  label: string;
  /** Section family e.g. "Wide Flange", "Rectangle", "Single Angle", "Pipe" */
  family: string;
  /** Named dimensions in InfoPanel display order */
  dims: SectionDim[];
  /** Source format/standard  e.g. "AISC", "STAAD-PRIS", "Custom" */
  source: string;
  /** Pre-computed cross-section properties (optional) */
  area?: number;   // m²
  ix?: number;     // m⁴  second moment about local x (weak axis)
  iy?: number;     // m⁴  second moment about local y (strong axis)
}

// ── Updated ParseSection ──────────────────────────────────────────────────

/** Section data already normalized to format-agnostic terminology */
export interface ParseSection {
  /** Shape family tag — used for color lookup and legend. */
  type: 'RECTANGULAR' | 'CIRCULAR' | 'TRAPEZOIDAL' | 'TSHAPE' | 'CUSTOM' | 'TAPERED' | 'USER' | 'UNKNOWN'
    | 'STEEL_ANGLE' | 'STEEL_DOUBLE_ANGLE' | 'STEEL_WIDE_FLANGE' | 'STEEL_CHANNEL' | 'STEEL_PIPE' | 'STEEL_TUBE' | 'STEEL_GENERIC';

  /** Cross-section polygon — the geometry source of truth. */
  profile?: SectionProfile;

  /** Human-readable metadata for InfoPanel. */
  meta?: SectionMeta;

  /** Canonical steel section key (registry lookup). */
  sectionKey?: string;

  /** Fallback description (used when meta is not present). */
  description: string;
}

/** A structural member with connectivity and optional section */
export interface ParseMember {
  id: number;
  startNodeId: number;
  endNodeId: number;
  section: ParseSection | null;
  groupNames: string[];
  beta?: number; // rotation angle in degrees around member axis
  startOffset?: { dx: number; dy: number; dz: number };
  endOffset?: { dx: number; dy: number; dz: number };
}

/** A boundary condition at a node */
export interface ParseSupport {
  nodeId: number;
  type: 'FIXED' | 'PINNED' | 'ROLLER' | 'UNKNOWN';
}

/** A plate/shell element with per-node thicknesses */
export interface ParsePlate {
  id: number;
  nodeIds: number[];
  thicknesses: number[];
}

/** Universal parse result — every format parser outputs this shape */
export interface BaseParseResult {
  nodes: ParseNode[];
  members: ParseMember[];
  plates: ParsePlate[];
  supports: ParseSupport[];
  warnings: string[];
}
