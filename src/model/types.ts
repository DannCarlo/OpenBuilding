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
  type: 'RECTANGULAR' | 'CIRCULAR' | 'TRAPEZOIDAL' | 'TSHAPE' | 'STANDARD' | 'TAPERED' | 'USER' | 'UNKNOWN';
  depthY?: number;
  depthZ?: number;
  depthYB?: number;
  depthZB?: number;
  tableName?: string;
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
