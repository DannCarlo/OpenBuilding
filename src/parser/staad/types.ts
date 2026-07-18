// STAAD .std parser — format-specific types

export interface StaadJoint {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface StaadMember {
  id: number;
  jointI: number;
  jointJ: number;
}

export interface StaadMemberProperty {
  memberIds: number[];
  type: 'PRIS' | 'TABLE' | 'TAPERED' | 'USER' | 'UNKNOWN';
  yd?: number; // Y-depth for PRIS
  zd?: number; // Z-depth for PRIS
  yb?: number; // Y-bottom (web for T-shape)
  zb?: number; // Z-bottom (narrower end for trapezoid, web for T-shape)
  tableName?: string; // e.g., "ST W12X26"
  description: string; // human-readable
}

export interface StaadSupport {
  jointIds: number[];
  type: 'FIXED' | 'PINNED' | 'FIXED_BUT' | 'ROLLER' | 'SPRING' | 'UNKNOWN';
  description: string;
}

export interface StaadGroup {
  name: string;
  type: 'FLOOR' | 'MEMBER' | 'UNKNOWN';
  memberIds: number[];
}

export interface StaadPlate {
  id: number;
  type: 'SHELL' | 'PLATE' | 'SOLID' | 'UNKNOWN';
  jointIds: number[]; // 3 for tri, 4 for quad, 8 for solid
}

export interface StaadPlateProperty {
  plateIds: number[];
  thicknesses: number[]; // one per node (4 for quad shell)
}

export interface StaadUnits {
  length: string;  // METER, FEET, INCH, CM, MM
  force: string;   // KN, KIP, KG, N
}

export interface StaadParseResult {
  joints: StaadJoint[];
  members: StaadMember[];
  memberProperties: StaadMemberProperty[];
  plates: StaadPlate[];
  plateProperties: StaadPlateProperty[];
  supports: StaadSupport[];
  groups: StaadGroup[];
  betaAngles: Map<number, number>;
  units: StaadUnits;
  warnings: string[];
}

/** STAAD parser state machine modes */
export type ParserMode =
  | 'idle'
  | 'joints'
  | 'members'
  | 'memberProp'
  | 'elements'
  | 'elementProp'
  | 'constants'
  | 'supports'
  | 'groups'
  | 'skip';
