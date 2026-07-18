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
    memberOffsets: [],
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
    if (upperLine.startsWith('MEMBER OFFSET')) {
      mode = 'memberOffset';
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
        const els = parseElementLine(line);
        for (const el of els) result.plates.push(el);
        break;
      }
      case 'elementProp': {
        const ep = parseElementPropertyLine(line);
        if (ep) result.plateProperties.push(ep);
        break;
      }
      case 'memberOffset': {
        const off = parseMemberOffsetLine(line);
        if (off) result.memberOffsets.push(off);
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

/** Parse a MEMBER OFFSET line. Format: <id-list> START x y z [END x y z] */
function parseMemberOffsetLine(line: string): import('./types').StaadMemberOffset | null {
  const cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '').trim();
  if (!cleaned) return null;

  const tokens = cleaned.split(/\s+/);

  // Find START/END keyword positions
  const startIdx = tokens.findIndex(t => t.toUpperCase() === 'START');
  const endIdx = tokens.findIndex(t => t.toUpperCase() === 'END');

  if (startIdx < 0 && endIdx < 0) return null;

  // Determine where the ID list ends and offset data begins
  const offsetStart = startIdx >= 0 ? startIdx : endIdx;
  if (offsetStart < 0) return null;

  const idTokens = tokens.slice(0, offsetStart);
  const memberIds = expandRange(idTokens);
  if (memberIds.length === 0) return null;

  const result: import('./types').StaadMemberOffset = { memberIds };

  // Parse START offset
  if (startIdx >= 0) {
    const x = parseFloat(tokens[startIdx + 1]);
    const y = parseFloat(tokens[startIdx + 2]);
    const z = parseFloat(tokens[startIdx + 3]);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      result.start = { x, y, z };
    }
  }

  // Parse END offset
  if (endIdx >= 0) {
    const x = parseFloat(tokens[endIdx + 1]);
    const y = parseFloat(tokens[endIdx + 2]);
    const z = parseFloat(tokens[endIdx + 3]);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      result.end = { x, y, z };
    }
  }

  return result;
}
function parseElementLine(line: string): import('./types').StaadPlate[] {
  const cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '').trim();
  if (!cleaned) return [];

  const plates: import('./types').StaadPlate[] = [];

  for (const entry of cleaned.split(';')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 4) continue;
    const id = parseInt(parts[0], 10);
    if (isNaN(id)) continue;
    const jointIds = parts.slice(1).map(Number).filter(n => !isNaN(n));
    if (jointIds.length < 3) continue;
    plates.push({
      id,
      type: jointIds.length >= 4 ? 'SHELL' : 'PLATE',
      jointIds: jointIds.slice(0, 4), // max 4 for quad shell
    });
  }

  return plates;
}

/** Parse an ELEMENT PROPERTY line. Format: <id-list> THICKNESS t1 [t2 t3 t4] */
function parseElementPropertyLine(line: string): import('./types').StaadPlateProperty | null {
  const cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '').trim();
  if (!cleaned) return null;

  const tokens = cleaned.split(/\s+/);
  if (tokens.length < 4) return null;

  // Find where THICKNESS keyword starts
  const thickIdx = tokens.findIndex(t => t.toUpperCase() === 'THICKNESS');
  if (thickIdx < 0) return null;

  // IDs are everything before THICKNESS — expand TO ranges
  const idTokens = tokens.slice(0, thickIdx);
  const plateIds = expandRange(idTokens);
  if (plateIds.length === 0) return null;

  // Thickness values follow THICKNESS
  const thicknesses = tokens.slice(thickIdx + 1).map(Number).filter(n => !isNaN(n));

  return { plateIds, thicknesses };
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

  // 3.5 Build offset lookup (memberId → start/end offset)
  // Offsets are length values — must be converted to meters
  const offsetConv = getLengthConversion(staad.units.length);
  const offsetMap = new Map<number, { startOffset?: { dx: number; dy: number; dz: number }; endOffset?: { dx: number; dy: number; dz: number } }>();
  for (const off of staad.memberOffsets) {
    for (const mid of off.memberIds) {
      const entry = offsetMap.get(mid) || {};
      if (off.start) {
        entry.startOffset = { dx: off.start.x * offsetConv, dy: off.start.y * offsetConv, dz: off.start.z * offsetConv };
      }
      if (off.end) {
        entry.endOffset = { dx: off.end.x * offsetConv, dy: off.end.y * offsetConv, dz: off.end.z * offsetConv };
      }
      if (entry.startOffset || entry.endOffset) {
        offsetMap.set(mid, entry);
      }
    }
  }

  // 4. Members: combine incidence + section + groups + offsets
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
      ...offsetMap.get(m.id),
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
    'MEMBER OFFSET',
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
