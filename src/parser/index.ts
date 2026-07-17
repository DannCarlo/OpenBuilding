import type { StaadParseResult, ParserMode } from './types';
import { parseUnitLine, isContinuation, isEmptyOrComment, getLengthConversion, normalizeJoint } from './utils';
import { parseJointLine } from './commands/joint-coordinates';
import { parseMemberLine } from './commands/member-incidences';
import { parseMemberPropertyLine } from './commands/member-properties';
import { parseSupportLine } from './commands/supports';
import { parseGroupBlock } from './commands/group-definitions';

/**
 * Main STAAD .std file parser.
 * Uses a section-based state machine to extract geometry data.
 */
export function parseStaadFile(text: string): StaadParseResult {
  const result: StaadParseResult = {
    joints: [],
    members: [],
    memberProperties: [],
    supports: [],
    groups: [],
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
      default:
        break;
    }
  }

  // Normalize joint coordinates to meters
  const conversion = getLengthConversion(result.units.length);
  if (conversion !== 1) {
    result.joints = result.joints.map(j => normalizeJoint(j, conversion));
  }

  return result;
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
