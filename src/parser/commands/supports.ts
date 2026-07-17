import type { StaadSupport } from '../types';
import { expandRange, stripComments } from '../utils';

/**
 * Parse a SUPPORTS line.
 * Format: [jointIds/Ranges] <TYPE>
 * e.g. "1001 TO 1008 FIXED"
 */
export function parseSupportLine(line: string): StaadSupport | null {
  const cleaned = stripComments(line);
  if (!cleaned) return null;

  const tokens = cleaned.split(/\s+/);
  if (tokens.length < 2) return null;

  // The last token is the support type
  const supportType = tokens[tokens.length - 1].toUpperCase();

  let type: StaadSupport['type'] = 'UNKNOWN';
  if (supportType === 'FIXED') type = 'FIXED';
  else if (supportType === 'PINNED') type = 'PINNED';
  else if (supportType === 'FIXED_BUT') type = 'FIXED_BUT';
  else if (supportType === 'ROLLER') type = 'ROLLER';
  else if (supportType === 'SPRING') type = 'SPRING';

  // Everything before the last token are IDs/ranges
  const idTokens = tokens.slice(0, -1);
  const jointIds = expandRange(idTokens);

  if (jointIds.length === 0) return null;

  return {
    jointIds,
    type,
    description: tokens[tokens.length - 1],
  };
}
