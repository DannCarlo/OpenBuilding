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
}

export interface MemberSection {
  type: 'RECTANGULAR' | 'STANDARD' | 'TAPERED' | 'USER' | 'UNKNOWN';
  depthY?: number;
  depthZ?: number;
  tableName?: string;
  description: string;
}

export interface ModelSupport {
  nodeId: number;
  type: 'FIXED' | 'PINNED' | 'ROLLER' | 'UNKNOWN';
}

export interface ParsedModel {
  nodes: ModelNode[];
  members: ModelMember[];
  supports: ModelSupport[];
  warnings: string[];
}
