// STAAD .std parser types

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

export interface StaadUnits {
  length: string;  // METER, FEET, INCH, CM, MM
  force: string;   // KN, KIP, KG, N
}

export interface StaadParseResult {
  joints: StaadJoint[];
  members: StaadMember[];
  memberProperties: StaadMemberProperty[];
  supports: StaadSupport[];
  groups: StaadGroup[];
  units: StaadUnits;
  warnings: string[];
}

// Parser mode state machine
export type ParserMode =
  | 'idle'
  | 'joints'
  | 'members'
  | 'memberProp'
  | 'supports'
  | 'groups'
  | 'skip'; // actively skipping a block
