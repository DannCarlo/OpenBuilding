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
 * Get conversion factor to meters for a given length unit
 */
export function getLengthConversion(unit: string): number {
  switch (unit.toUpperCase()) {
    case 'METER':
    case 'METERS':
    case 'M':
      return 1;
    case 'FEET':
    case 'FT':
      return 0.3048;
    case 'INCH':
    case 'INCHES':
    case 'IN':
      return 0.0254;
    case 'CM':
      return 0.01;
    case 'MM':
      return 0.001;
    default:
      return 1; // assume meters
  }
}

/**
 * Expand a range like "1014 TO 1021" into an array of numbers.
 * Handles ranges mixed with individual IDs: "2001 TO 2007 2012 2014"
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
        // Remove the start ID we already added
        ids.pop();
        const step = start <= end ? 1 : -1;
        for (let id = start; step > 0 ? id <= end : id >= end; id += step) {
          ids.push(id);
        }
        i += 2; // skip the end token we just consumed
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
 * Strip inline comments (text after ! that isn't inside a string).
 * Also handles <! ... !> block comments.
 */
export function stripComments(line: string): string {
  // Remove <! ... !> block comments
  let cleaned = line.replace(/<!\s*[\s\S]*?\s*!>/g, '');
  // Remove inline ! comments (but keep the line if it starts with data)
  const commentIdx = cleaned.indexOf('!');
  if (commentIdx >= 0) {
    cleaned = cleaned.substring(0, commentIdx);
  }
  return cleaned.trim();
}

/**
 * Check if a line is a continuation (ends with -)
 */
export function isContinuation(line: string): boolean {
  return /\s*-\s*$/.test(line.trimEnd());
}

/**
 * Check if line is empty or a comment-only line
 */
export function isEmptyOrComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('!') || trimmed.startsWith('*');
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
