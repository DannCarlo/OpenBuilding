import type { SectionType, SectionProfile, SectionMeta } from '../parser/types';

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
  type: SectionType;
  /** Cross-section polygon */
  profile?: SectionProfile;
  /** Human-readable metadata for InfoPanel */
  meta?: SectionMeta;
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
