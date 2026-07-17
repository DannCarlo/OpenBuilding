// Color palette for structural elements

export const MEMBER_COLORS: Record<string, string> = {
  default: '#4A90D9',        // blue for beams
  column: '#E85D47',         // coral for columns
  brace: '#7B68EE',          // purple for braces
  beam: '#4A90D9',           // blue for beams
  girder: '#3A7BD5',         // darker blue for girders
};

// Color by section type
export const SECTION_COLORS: Record<string, string> = {
  PRIS: '#4A90D9',
  TABLE: '#50C878',
  UNKNOWN: '#888888',
};

// Support type colors
export const SUPPORT_COLORS: Record<string, string> = {
  FIXED: '#E85D47',
  PINNED: '#F4A261',
  ROLLER: '#50C878',
  UNKNOWN: '#888888',
};

// Get a color for a member based on its section type
export function getMemberColor(sectionType?: string): string {
  if (!sectionType) return MEMBER_COLORS.default;
  return SECTION_COLORS[sectionType] || MEMBER_COLORS.default;
}

// Get color for a support type
export function getSupportColor(supportType: string): string {
  return SUPPORT_COLORS[supportType] || SUPPORT_COLORS.UNKNOWN;
}
