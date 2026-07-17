import type { StaadGroup } from '../types';
import { expandRange, stripComments } from '../utils';

/**
 * Parse group definitions between START GROUP DEFINITION and END GROUP DEFINITION.
 * Returns an array of groups found.
 */
export function parseGroupBlock(lines: string[]): StaadGroup[] {
  const groups: StaadGroup[] = [];
  let currentGroupType: StaadGroup['type'] = 'UNKNOWN';

  for (const rawLine of lines) {
    const line = stripComments(rawLine);
    if (!line) continue;

    const upper = line.toUpperCase().trim();

    // Check for group type headers
    if (upper === 'FLOOR') {
      currentGroupType = 'FLOOR';
      continue;
    } else if (upper === 'MEMBER') {
      currentGroupType = 'MEMBER';
      continue;
    }

    // Parse group entry: NAME [IDs/ranges]
    // e.g. "_2F_STORAGE 2002 2004 2005 2007"
    // e.g. "_RF_ROOF 3002 3004 TO 3007 3010 TO 3013"
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const name = parts[0];
      const idTokens = parts.slice(1);
      const memberIds = expandRange(idTokens);

      if (memberIds.length > 0) {
        groups.push({
          name,
          type: currentGroupType,
          memberIds,
        });
      }
    }
  }

  return groups;
}
