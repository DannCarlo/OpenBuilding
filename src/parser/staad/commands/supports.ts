import type { StaadSupport } from '../types';
import { expandRange, stripComments } from '../utils';

/**
 * Parse a SUPPORTS line.
 * Format: [jointIds/Ranges] <TYPE>
 * e.g. "1001 TO 1008 FIXED"
 *       "101 ENFORCED BUT MX MY"          → PINNED (translations fixed, rotations released)
 *       "102 ENFORCED BUT FZ MX MY"       → ROLLER (one translation + rotations released)
 */
export function parseSupportLine(line: string): StaadSupport | null {
  const cleaned = stripComments(line);
  if (!cleaned) return null;

  const tokens = cleaned.split(/\s+/);
  if (tokens.length < 2) return null;

  // The last token is the support type (for simple keywords)
  const supportType = tokens[tokens.length - 1].toUpperCase();

  let type: StaadSupport['type'] = 'UNKNOWN';
  let description = tokens[tokens.length - 1];
  let idTokens = tokens.slice(0, -1);

  // Handle "ENFORCED BUT <releases>" — releases are listed after BUT
  const butIdx = tokens.findIndex((t) => t.toUpperCase() === 'BUT');
  if (butIdx !== -1) {
    const releases = tokens.slice(butIdx + 1).map((t) => t.toUpperCase());
    const transReleased = releases.filter((r) => r.startsWith('F'));
    const rotReleased = releases.filter((r) => r.startsWith('M'));
    if (transReleased.length === 0 && rotReleased.length >= 2) {
      type = 'PINNED';                       // translations locked, free to rotate
    } else if (transReleased.length === 1 && rotReleased.length >= 2) {
      type = 'ROLLER';                       // slides in one direction + rotates
    } else if (transReleased.length === 0) {
      type = 'FIXED';                        // effectively fully restrained
    } else {
      type = 'UNKNOWN';                      // partial fixity — conservative
    }
    description = `ENFORCED BUT ${releases.join(' ')}`;
    idTokens = tokens.slice(0, butIdx);
  } else if (supportType === 'FIXED') {
    type = 'FIXED';
  } else if (supportType === 'PINNED') {
    type = 'PINNED';
  } else if (supportType === 'FIXED_BUT') {
    type = 'FIXED_BUT';
  } else if (supportType === 'ROLLER') {
    type = 'ROLLER';
  } else if (supportType === 'SPRING') {
    type = 'SPRING';
  } else if (supportType === 'ENFORCED') {
    type = 'FIXED';
  }

  // Everything before the type (or BUT) are IDs/ranges
  const jointIds = expandRange(idTokens);

  if (jointIds.length === 0) return null;

  return {
    jointIds,
    type,
    description,
  };
}
