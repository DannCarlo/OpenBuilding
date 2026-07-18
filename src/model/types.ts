// Normalized geometry model types (format-independent)

export interface ModelNode {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface ModelMember {
  id: number;
  startNodeId: number;
  endNodeId: number;
  section: MemberSection | null;
  groupNames: string[];
  beta?: number; // rotation angle in degrees around member axis
  startOffset?: { dx: number; dy: number; dz: number };
  endOffset?: { dx: number; dy: number; dz: number };
}

export interface MemberSection {
  type: 'RECTANGULAR' | 'CIRCULAR' | 'TRAPEZOIDAL' | 'TSHAPE' | 'CUSTOM' | 'TAPERED' | 'USER' | 'UNKNOWN'
    | 'STEEL_ANGLE' | 'STEEL_DOUBLE_ANGLE' | 'STEEL_WIDE_FLANGE' | 'STEEL_CHANNEL' | 'STEEL_PIPE' | 'STEEL_TUBE' | 'STEEL_GENERIC';
  /** Cross-section polygon */
  profile?: import('../parser/types').SectionProfile;
  /** Human-readable metadata for InfoPanel */
  meta?: import('../parser/types').SectionMeta;
  /** Canonical steel section key */
  sectionKey?: string;
  /** Fallback description */
  description: string;
}

export interface ModelSupport {
  nodeId: number;
  type: 'FIXED' | 'PINNED' | 'ROLLER' | 'UNKNOWN';
}

export interface ModelPlate {
  id: number;
  nodeIds: number[];
  thicknesses: number[];
}

export interface ParsedModel {
  nodes: ModelNode[];
  members: ModelMember[];
  plates: ModelPlate[];
  supports: ModelSupport[];
  warnings: string[];
}
