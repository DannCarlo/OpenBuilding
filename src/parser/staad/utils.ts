// STAAD-specific parser utilities.
// These implement STAAD .std syntax conventions — not shared with other formats.

import type { StaadUnits, StaadJoint } from './types';

/**
 * Parse the UNIT line: e.g. "UNIT METER KN" or "UNIT FEET KIP"
 */
export function parseUnitLine(line: string): StaadUnits | null {
  const match = line.match(/^\s*UNIT\s+(\w+)\s+(\w+)/i);
  if (!match) return null;
  return {
    length: match[1].toUpperCase(),
    force: match[2].toUpperCase(),
  };
}

/**
 * Normalize joint coordinates to meters
 */
export function normalizeJoint(
  joint: StaadJoint,
  conversionFactor: number
): StaadJoint {
  return {
    ...joint,
    x: joint.x * conversionFactor,
    y: joint.y * conversionFactor,
    z: joint.z * conversionFactor,
  };
}

/**
 * Expand a STAAD range like "1014 TO 1021" into an array of numbers.
 * Handles ranges mixed with individual IDs: "2001 TO 2007 2012 2014"
 * STAAD-specific: ETABS/SAP2000 do not use "TO" range syntax.
 */
export function expandRange(tokens: string[]): number[] {
  const ids: number[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i].toUpperCase();
    if (token === 'TO' && i > 0 && i < tokens.length - 1) {
      const start = parseInt(tokens[i - 1], 10);
      const end = parseInt(tokens[i + 1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        ids.pop();
        const step = start <= end ? 1 : -1;
        for (let id = start; step > 0 ? id <= end : id >= end; id += step) {
          ids.push(id);
        }
        i += 2;
        continue;
      }
    }
    const num = parseInt(token, 10);
    if (!isNaN(num)) {
      ids.push(num);
    }
    i++;
  }
  return ids;
}

/**
 * Strip STAAD inline comments (text after !).
 * Also handles <! ... !> block comments.
 * STAAD-specific: ETABS uses $, SAP2000 uses // or # for comments.
 */
export function stripComments(line: string): string {
  let cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '');
  const commentIdx = cleaned.indexOf('!');
  if (commentIdx >= 0) {
    cleaned = cleaned.substring(0, commentIdx);
  }
  return cleaned.trim();
}

/**
 * Check if a line is a STAAD continuation (ends with -).
 * STAAD-specific: ETABS/SAP2000 do not use - line continuations.
 */
export function isContinuation(line: string): boolean {
  return /\s*-\s*$/.test(line.trimEnd());
}

/**
 * Check if line is empty or a STAAD comment-only line.
 * Recognizes ! and * as STAAD comment prefixes.
 */
export function isEmptyOrComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('!') || trimmed.startsWith('*');
}
