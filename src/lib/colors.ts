// Color palette for structural elements

import type { SupportRestraints } from '../parser/types';

export const MEMBER_COLORS: Record<string, string> = {
  default: '#4A90D9',        // blue for beams
  column: '#E85D47',         // coral for columns
  brace: '#7B68EE',          // purple for braces
  beam: '#4A90D9',           // blue for beams
  girder: '#3A7BD5',         // darker blue for girders
};

// Color by section type (format-agnostic names)
export const SECTION_COLORS: Record<string, string> = {
  RECTANGULAR: '#4A90D9',
  CIRCULAR: '#F4A261',
  TRAPEZOIDAL: '#9B59B6',
  TSHAPE: '#E74C3C',
  STANDARD: '#50C878',
  UNKNOWN: '#888888',
  // Steel variants — metallic silver palette
  STEEL_ANGLE: '#D4D4D8',
  STEEL_DOUBLE_ANGLE: '#C8C8CE',
  STEEL_WIDE_FLANGE: '#CDCDD3',
  STEEL_CHANNEL: '#D0D0D6',
  STEEL_PIPE: '#D6D6DA',
  STEEL_TUBE: '#CCCCD2',
  STEEL_HSS_ROUND: '#E8C44A',
  STEEL_HSS_RECT: '#D4A843',
  STEEL_GENERIC: '#C4C4CA',
};

// Support type colors
export const SUPPORT_COLORS: Record<string, string> = {
  FIXED: '#E85D47',
  PINNED: '#F4A261',
  ROLLER: '#50C878',
  ENFORCED_BUT: '#7B68EE',   // periwinkle — custom restraint set
  UNKNOWN: '#888888',
};

/** Warning color for members with rendering limitations (double angles, missing sections, etc.). */
export const RENDER_WARNING_COLOR = '#FF8C00'; // dark orange

/** Selection highlight color (gold) */
export const SELECTED_COLOR = '#FFD700';

/** Hover highlight color (light blue) */
export const HOVER_COLOR = '#66AAFF';

// ── Material-aware render skins (realistic mode) ─────────────────────────

export interface RenderSkin {
  color: string;
  roughness: number;
  metalness: number;
}

/** Skins keyed by Material.type ('STEEL' | 'CONCRETE' | 'OTHER'). */
export const MATERIAL_SKINS: Record<string, RenderSkin> = {
  STEEL: { color: '#B4B6BC', roughness: 0.28, metalness: 0.85 },
  CONCRETE: { color: '#C6C5C1', roughness: 0.92, metalness: 0.05 },
  OTHER: { color: '#9C9CA4', roughness: 0.55, metalness: 0.35 },
};

export const DEFAULT_SKIN: RenderSkin = MATERIAL_SKINS.OTHER;

/** Resolve a render skin for a material type, falling back to neutral grey. */
export function getMaterialSkin(materialType?: string): RenderSkin {
  if (materialType && MATERIAL_SKINS[materialType]) return MATERIAL_SKINS[materialType];
  return DEFAULT_SKIN;
}

// Get a color for a member based on its section type
export function getMemberColor(sectionType?: string): string {
  if (!sectionType) return MEMBER_COLORS.default;
  return SECTION_COLORS[sectionType] || MEMBER_COLORS.default;
}

/**
 * Deterministic color for an ENFORCED_BUT support derived from its restraint
 * pattern — each DOF carries a distinct prime weight, so any single DOF
 * flipping (e.g. FX restrained vs free) produces a visibly different color.
 * Stays in the violet/indigo family to remain recognizably "custom restraint".
 */
function enforcedButColor(restraints: SupportRestraints): string {
  const hash =
    (restraints.fx ? 1 : 0) * 131 +
    (restraints.fy ? 1 : 0) * 137 +
    (restraints.fz ? 1 : 0) * 139 +
    (restraints.mx ? 1 : 0) * 149 +
    (restraints.my ? 1 : 0) * 151 +
    (restraints.mz ? 1 : 0) * 163;
  const hue = 225 + (hash % 60);                  // 225°..285° (violet → indigo)
  const sat = 45 + ((hash >> 2) % 30);            // 45%..74%
  const light = 40 + ((hash >> 4) % 20);          // 40%..59%
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

// Get color for a support type. ENFORCED_BUT colors reflect the actual
// restraint pattern so different restraint sets are visually distinct.
export function getSupportColor(supportType: string, restraints?: SupportRestraints): string {
  if (supportType === 'ENFORCED_BUT' && restraints) return enforcedButColor(restraints);
  return SUPPORT_COLORS[supportType] || SUPPORT_COLORS.UNKNOWN;
}
