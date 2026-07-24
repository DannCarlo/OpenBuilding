// App constants

export const APP_NAME = 'OpenBuilding';

export const SUPPORTED_EXTENSIONS = ['.std'];
// Future: ['.std', '.$et', '.e2k', '.s2k', '.sdb']

export const SUPPORTED_FORMATS = 'STAAD.Pro (.std)';

export const MAX_FILE_SIZE_MB = 50;

// Member cylinder radius fallback in meters (when no section data)
export const DEFAULT_MEMBER_RADIUS = 0.05;

// Grid settings
export const GRID_SIZE = 50;
export const GRID_DIVISIONS = 50;
export const GRID_COLORS = {
  light: { center: '#d5d5da', minor: '#e8e8ed' },
  dark:  { center: '#3a3a3e', minor: '#222226' },
} as const;
