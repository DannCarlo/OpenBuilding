import type { StaadMember } from '../types';
import { stripComments } from '../utils';

/**
 * Parse a MEMBER INCIDENCES line.
 * Format: MemberID JointI JointJ; MemberID JointI JointJ; ...
 */
export function parseMemberLine(line: string): StaadMember[] {
  const cleaned = stripComments(line);
  if (!cleaned) return [];

  const members: StaadMember[] = [];

  const entries = cleaned.split(';');

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const id = parseInt(parts[0], 10);
      const jointI = parseInt(parts[1], 10);
      const jointJ = parseInt(parts[2], 10);

      if (!isNaN(id) && !isNaN(jointI) && !isNaN(jointJ)) {
        members.push({ id, jointI, jointJ });
      }
    }
  }

  return members;
}
