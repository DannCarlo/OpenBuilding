import type { StaadSupport } from '../types';
import type { SupportRestraints } from '../../types';
import { expandRange, stripComments } from '../utils';

/** Build a fully-restrained set (all DOFs restrained). */
function allRestrained(): SupportRestraints {
  return { fx: true, fy: true, fz: true, mx: true, my: true, mz: true };
}

/**
 * Parse a SUPPORTS line.
 * Format: [jointIds/Ranges] <TYPE>
 * e.g. "1001 TO 1008 FIXED"
 *       "101 ENFORCED BUT MX MY"          → ENFORCED_BUT (custom releases)
 *       "102 FIXED BUT FZ MX MY"          → ENFORCED_BUT (FIXED BUT ≡ ENFORCED BUT)
 *
 * Restraints are derived from the keyword / releases so the info panel can
 * show exactly which DOFs (FX/FY/FZ/MX/MY/MZ) are restrained vs. free.
 * For `ENFORCED BUT <DOFs>`, the DOFs listed after BUT are the RELEASES
 * (free); everything else is restrained.
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
  let restraints: SupportRestraints | undefined;

  // Handle "<ENFORCED|FIXED> BUT <releases>" — releases are listed after BUT.
  // Both "ENFORCED BUT" and "FIXED BUT" describe the same thing: a mostly-
  // restrained support with explicit releases → normalize to ENFORCED_BUT.
  const butIdx = tokens.findIndex((t) => t.toUpperCase() === 'BUT');
  if (butIdx !== -1) {
    const releases = tokens.slice(butIdx + 1).map((t) => t.toUpperCase());
    type = 'ENFORCED_BUT';
    // BUT lists RELEASES (free DOFs); start fully restrained, flip them free
    restraints = allRestrained();
    for (const r of releases) {
      const key = r.toLowerCase() as keyof SupportRestraints;
      if (key in restraints) restraints[key] = false;
    }
    description = `ENFORCED BUT ${releases.join(' ')}`;
    idTokens = tokens.slice(0, butIdx);
  } else if (supportType === 'FIXED') {
    type = 'FIXED';
    restraints = allRestrained();
  } else if (supportType === 'PINNED') {
    type = 'PINNED';
    restraints = { fx: true, fy: true, fz: true, mx: false, my: false, mz: false };
  } else if (supportType === 'ROLLER') {
    type = 'ROLLER';
    // STAAD ROLLER convention: free X translation, rotations free, Y/Z restrained
    restraints = { fx: false, fy: true, fz: true, mx: false, my: false, mz: false };
  } else if (supportType === 'SPRING') {
    type = 'SPRING';
  } else if (supportType === 'ENFORCED') {
    type = 'FIXED';
    restraints = allRestrained();
  }

  // Everything before the type (or BUT) are IDs/ranges
  const jointIds = expandRange(idTokens);

  if (jointIds.length === 0) return null;

  return {
    jointIds,
    type,
    description,
    restraints,
  };
}
