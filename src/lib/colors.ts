// Color palette for structural elements

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
  UNKNOWN: '#888888',
};

/** Warning color for members with rendering limitations (double angles, missing sections, etc.). */
export const RENDER_WARNING_COLOR = '#FF8C00'; // dark orange

// Get a color for a member based on its section type
export function getMemberColor(sectionType?: string): string {
  if (!sectionType) return MEMBER_COLORS.default;
  return SECTION_COLORS[sectionType] || MEMBER_COLORS.default;
}

// Get color for a support type
export function getSupportColor(supportType: string): string {
  return SUPPORT_COLORS[supportType] || SUPPORT_COLORS.UNKNOWN;
}
