// Shared parser types — the contract ALL format parsers (STAAD, ETABS, SAP2000, etc.)
// must produce. The model builder and 3D viewer consume ONLY these types.

/** A point in 3D space (format-agnostic: not "Joint" or "Point") */
export interface ParseNode {
  id: number;
  x: number;
  y: number;
  z: number;
}

/** Section data already normalized to format-agnostic terminology */
export interface ParseSection {
  type: 'RECTANGULAR' | 'CIRCULAR' | 'TRAPEZOIDAL' | 'TSHAPE' | 'STANDARD' | 'TAPERED' | 'USER' | 'UNKNOWN';
  depthY?: number;
  depthZ?: number;
  depthYB?: number;
  depthZB?: number;
  tableName?: string;
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
