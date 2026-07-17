// App constants

export const APP_NAME = 'Structure Viewer';

export const SUPPORTED_EXTENSIONS = ['.std'];
// Future: ['.std', '.$et', '.e2k', '.s2k', '.sdb']

export const SUPPORTED_FORMATS = 'STAAD.Pro (.std)';

export const MAX_FILE_SIZE_MB = 50;

// Node sphere radius in meters (scaled for visibility)
export const NODE_RADIUS = 0.08;

// Member cylinder radius fallback in meters (when no section data)
export const DEFAULT_MEMBER_RADIUS = 0.05;

// Support marker size
export const SUPPORT_SIZE = 0.25;

// Grid settings
export const GRID_SIZE = 50;
export const GRID_DIVISIONS = 50;
export const GRID_COLOR = '#333333';
export const GRID_CENTER_COLOR = '#555555';
