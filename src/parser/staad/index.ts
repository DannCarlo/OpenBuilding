import type { StaadParseResult, ParserMode } from './types';
import type { BaseParseResult, ParseNode, ParseMember, ParseSection, ParseSupport } from '../types';
import { parseUnitLine, normalizeJoint, isContinuation, isEmptyOrComment, expandRange } from './utils';
import { getLengthConversion } from '../utils';
import { parseJointLine } from './commands/joint-coordinates';
import { parseMemberLine } from './commands/member-incidences';
import { parseMemberPropertyLine } from './commands/member-properties';
import { parseSupportLine } from './commands/supports';
import { parseGroupBlock } from './commands/group-definitions';

/**
 * Parse a STAAD .std input file and return a format-agnostic BaseParseResult.
 */
export function parseStaadFile(text: string): BaseParseResult {
  const result: StaadParseResult = {
    joints: [],
    members: [],
    memberProperties: [],
    plates: [],
    plateProperties: [],
    supports: [],
    groups: [],
    betaAngles: new Map(),
    units: { length: 'METER', force: 'KN' },
    warnings: [],
  };

  // Normalize line endings and split into lines
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Preprocess: join continuation lines (lines ending with -)
  const lines = joinContinuations(rawLines);

  let mode: ParserMode = 'idle';
  let groupBlockLines: string[] = [];
  let inGroupBlock = false;

  for (const rawLine of lines) {
    if (isEmptyOrComment(rawLine)) continue;

    const line = rawLine.trim();
    const upperLine = line.toUpperCase();

    // Handle START/END blocks
    if (upperLine.startsWith('START GROUP DEFINITION')) {
      inGroupBlock = true;
      groupBlockLines = [];
      mode = 'groups';
      continue;
    }
    if (upperLine.startsWith('END GROUP DEFINITION')) {
      inGroupBlock = false;
      result.groups = parseGroupBlock(groupBlockLines);
      mode = 'idle';
      continue;
    }
    if (upperLine.startsWith('START ') || upperLine.startsWith('DEFINE ')) {
      mode = 'skip';
      continue;
    }
    if (upperLine.startsWith('END ') || upperLine.startsWith('END DEFINE ')) {
      mode = 'idle';
      continue;
    }

    // If we're collecting group block lines
    if (inGroupBlock) {
      groupBlockLines.push(line);
      continue;
    }

    // If skipping a block, ignore until END
    if (mode === 'skip') continue;

    // Detect section keywords
    if (upperLine.startsWith('JOINT COORDINATES')) {
      mode = 'joints';
      continue;
    }
    if (upperLine.startsWith('MEMBER INCIDENCES')) {
      mode = 'members';
      continue;
    }
    if (upperLine.startsWith('MEMBER PROPERTY')) {
      mode = 'memberProp';
      continue;
    }
    if (upperLine.startsWith('SUPPORTS')) {
      mode = 'supports';
      continue;
    }
    if (upperLine.startsWith('ELEMENT INCIDENCES')) {
      mode = 'elements';
      continue;
    }
    if (upperLine.startsWith('ELEMENT PROPERTY')) {
      mode = 'elementProp';
      continue;
    }
    if (upperLine.startsWith('CONSTANTS')) {
      mode = 'constants';
      continue;
    }

    // Check if we hit a new major section that should change mode
    if (isNewSectionKeyword(upperLine)) {
      mode = 'idle'; // reset - we don't parse this section
      // Check if it's UNIT
      if (upperLine.startsWith('UNIT ')) {
        const units = parseUnitLine(line);
        if (units) result.units = units;
      }
      continue;
    }

    // Parse based on current mode
    switch (mode) {
      case 'joints': {
        const joints = parseJointLine(line);
        for (const j of joints) result.joints.push(j);
        break;
      }
      case 'members': {
        const members = parseMemberLine(line);
        for (const m of members) result.members.push(m);
        break;
      }
      case 'memberProp': {
        const prop = parseMemberPropertyLine(line);
        if (prop) result.memberProperties.push(prop);
        break;
      }
      case 'supports': {
        const support = parseSupportLine(line);
        if (support) result.supports.push(support);
        break;
      }
      case 'constants': {
        parseConstantLine(line, result.betaAngles, result.warnings);
        break;
      }
      case 'elements': {
        const el = parseElementLine(line);
        if (el) result.plates.push(el);
        break;
      }
      case 'elementProp': {
        const ep = parseElementPropertyLine(line);
        if (ep) result.plateProperties.push(ep);
        break;
      }
      default:
        break;
    }
  }

  // Normalize joint coordinates to meters
  const conversion = getLengthConversion(result.units.length);
  if (conversion !== 1) {
    result.joints = result.joints.map(j => normalizeJoint(j, conversion));
  }

  // Translate STAAD-specific result → shared BaseParseResult
  return toBaseResult(result);
}

/**
 * Parse a CONSTANTS line (BETA angles).
 */
function parseConstantLine(
  line: string,
  betaMap: Map<number, number>,
  _warnings: string[]
): void {
  const tokens = line.trim().split(/\s+/);
  const betaIdx = tokens.findIndex(t => t.toUpperCase() === 'BETA');
  const membIdx = tokens.findIndex(t => t.toUpperCase() === 'MEMB');
  if (betaIdx < 0 || membIdx < 0 || betaIdx >= tokens.length - 1) return;

  const angle = parseFloat(tokens[betaIdx + 1]);
  if (isNaN(angle)) return;

  const idTokens = tokens.slice(membIdx + 1);
  for (const mid of expandRange(idTokens)) {
    betaMap.set(mid, angle);
  }
}

/** Parse an ELEMENT INCIDENCES line. Format: ID J1 J2 J3 [J4]; ... */
function parseElementLine(line: string): import('./types').StaadPlate | null {
  const cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '').trim();
  if (!cleaned) return null;
  const entry = cleaned.split(';')[0]?.trim();
  if (!entry) return null;
  const parts = entry.split(/\s+/);
  if (parts.length < 4) return null;
  const id = parseInt(parts[0], 10);
  if (isNaN(id)) return null;
  const jointIds = parts.slice(1).map(Number).filter(n => !isNaN(n));
  if (jointIds.length < 3) return null;
  return {
    id,
    type: jointIds.length === 4 ? 'SHELL' : jointIds.length === 3 ? 'PLATE' : 'UNKNOWN',
    jointIds,
  };
}

/** Parse an ELEMENT PROPERTY line. Format: ID THICKNESS t1 [t2 t3 t4] */
function parseElementPropertyLine(line: string): import('./types').StaadPlateProperty | null {
  const cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '').trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return null;
  const id = parseInt(parts[0], 10);
  if (isNaN(id)) return null;
  const thickIdx = parts.findIndex(t => t.toUpperCase() === 'THICKNESS');
  if (thickIdx < 0) return null;
  const thicknesses = parts.slice(thickIdx + 1).map(Number).filter(n => !isNaN(n));
  return { plateIds: [id], thicknesses };
}

/**
 * Translate STAAD-specific parse result to the shared, format-agnostic
 * BaseParseResult that the model builder and 3D viewer consume.
 */
function toBaseResult(staad: StaadParseResult): BaseParseResult {
  const warnings = [...staad.warnings];

  // 1. Joints → Nodes (trivial rename, same shape)
  const nodes: ParseNode[] = staad.joints.map(j => ({
    id: j.id,
    x: j.x,
    y: j.y,
    z: j.z,
  }));

  // 2. Build section lookup (memberId → ParseSection)
  const sectionMap = new Map<number, ParseSection>();
  for (const prop of staad.memberProperties) {
    const section: ParseSection = {
      type: mapSectionType(prop),
      depthY: prop.yd,
      depthZ: prop.zd,
      depthYB: prop.yb,
      depthZB: prop.zb,
      tableName: prop.tableName,
      description: mapSectionDescription(prop),
    };
    for (const mid of prop.memberIds) {
      sectionMap.set(mid, section);
    }
  }

  // 3. Build group lookup (memberId → group names)
  const groupMap = new Map<number, string[]>();
  for (const group of staad.groups) {
    for (const mid of group.memberIds) {
      const existing = groupMap.get(mid) || [];
      existing.push(group.name);
      groupMap.set(mid, existing);
    }
  }

  // 4. Members: combine incidence + section + groups
  const members: ParseMember[] = [];
  for (const m of staad.members) {
    if (!staad.joints.find(j => j.id === m.jointI)) {
      warnings.push(`Member ${m.id}: start joint ${m.jointI} not found`);
      continue;
    }
    if (!staad.joints.find(j => j.id === m.jointJ)) {
      warnings.push(`Member ${m.id}: end joint ${m.jointJ} not found`);
      continue;
    }
    members.push({
      id: m.id,
      startNodeId: m.jointI,
      endNodeId: m.jointJ,
      section: sectionMap.get(m.id) || null,
      groupNames: groupMap.get(m.id) || [],
      beta: staad.betaAngles.get(m.id),
    });
  }

  // 5. Plates: map joint IDs → node IDs, pass thicknesses through
  const plates: import('../types').ParsePlate[] = [];
  const thicknessMap = new Map<number, number[]>();
  for (const pp of staad.plateProperties) {
    for (const pid of pp.plateIds) {
      thicknessMap.set(pid, pp.thicknesses);
    }
  }
  for (const pl of staad.plates) {
    const missing = pl.jointIds.filter(jid => !staad.joints.find(j => j.id === jid));
    if (missing.length > 0) {
      warnings.push(`Plate ${pl.id}: joints not found: ${missing.join(', ')}`);
      continue;
    }
    plates.push({
      id: pl.id,
      nodeIds: pl.jointIds,
      thicknesses: thicknessMap.get(pl.id) || [],
    });
  }

  // 6. Supports: expand joint ranges → individual node IDs, normalize types
  const supports: ParseSupport[] = [];
  for (const s of staad.supports) {
    for (const jointId of s.jointIds) {
      if (!staad.joints.find(j => j.id === jointId)) {
        warnings.push(`Support at joint ${jointId}: joint not found`);
        continue;
      }
      supports.push({
        nodeId: jointId,
        type: s.type === 'FIXED_BUT' ? 'FIXED' : mapSupportType(s.type),
      });
    }
  }

  return { nodes, members, plates, supports, warnings };
}

/** Map STAAD section type → format-agnostic type */
function mapSectionType(prop: import('./types').StaadMemberProperty): ParseSection['type'] {
  if (prop.type === 'PRIS') {
    if (prop.zd == null) return 'CIRCULAR';
    if (prop.yb != null && prop.zb != null) return 'TSHAPE';
    if (prop.zb != null) return 'TRAPEZOIDAL';
    return 'RECTANGULAR';
  }
  switch (prop.type) {
    case 'TABLE': return 'STANDARD';
    case 'TAPERED': return 'TAPERED';
    case 'USER': return 'USER';
    default: return 'UNKNOWN';
  }
}

/** Build human-readable description from STAAD property */
function mapSectionDescription(prop: import('./types').StaadMemberProperty): string {
  if (prop.type === 'PRIS') {
    if (prop.zd == null) return `Circular Ø${prop.yd ?? '?'}m`;
    if (prop.yb != null && prop.zb != null) return `T-shape ${prop.yd}×${prop.zd}/${prop.yb}×${prop.zb}m`;
    if (prop.zb != null) return `Trapezoidal ${prop.yd}×${prop.zd}/${prop.zb}m`;
    return `Rectangular ${prop.yd ?? '?'}×${prop.zd ?? '?'}m`;
  }
  if (prop.type === 'TABLE') {
    return `Standard ${prop.tableName ?? 'unknown'}`;
  }
  return prop.description;
}

/** Map STAAD support type → format-agnostic type */
function mapSupportType(staadType: string): ParseSupport['type'] {
  switch (staadType) {
    case 'FIXED':
    case 'FIXED_BUT': return 'FIXED';
    case 'PINNED': return 'PINNED';
    case 'ROLLER': return 'ROLLER';
    default: return 'UNKNOWN';
  }
}

/**
 * Join lines that end with a continuation marker (-)
 */
function joinContinuations(lines: string[]): string[] {
  const result: string[] = [];
  let buffer = '';

  for (const line of lines) {
    if (isContinuation(line)) {
      buffer += line.trimEnd().replace(/\s*-\s*$/, ' ').trimEnd() + ' ';
    } else {
      if (buffer) {
        result.push(buffer + line);
        buffer = '';
      } else {
        result.push(line);
      }
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result;
}

/**
 * Check if a line starts a new major section keyword
 */
function isNewSectionKeyword(upperLine: string): boolean {
  const keywords = [
    'UNIT ',
    'JOINT COORDINATES',
    'MEMBER INCIDENCES',
    'MEMBER PROPERTY',
    'ELEMENT INCIDENCES',
    'SUPPORTS',
    'CONSTANTS',
    'MEMBER RELEASE',
    'MEMBER CRACKED',
    'FLOOR DIAPHRAGM',
    'DEFINE ',
    'START ',
    'LOAD ',
    'LOAD COMB',
    'PERFORM ANALYSIS',
    'FINISH',
    'CHECK ',
    'SELECT ',
  ];
  return keywords.some(kw => upperLine.startsWith(kw));
}
