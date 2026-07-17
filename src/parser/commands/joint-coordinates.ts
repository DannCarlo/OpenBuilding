import type { StaadJoint } from '../types';
import { stripComments } from '../utils';

/**
 * Parse a JOINT COORDINATES line.
 * Format: ID X Y Z; ID X Y Z; ...
 * Entries are separated by semicolons.
 */
export function parseJointLine(line: string): StaadJoint[] {
  const cleaned = stripComments(line);
  if (!cleaned) return [];

  const joints: StaadJoint[] = [];

  // Split by semicolon to get individual joint entries
  const entries = cleaned.split(';');

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 4) {
      const id = parseInt(parts[0], 10);
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);

      if (!isNaN(id) && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
        joints.push({ id, x, y, z });
      }
    }
  }

  return joints;
}
