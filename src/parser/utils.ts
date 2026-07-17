// Shared parser utilities — truly format-agnostic helpers used by ALL parsers.

/**
 * Get conversion factor to meters for a given length unit.
 * Works across STAAD, ETABS, SAP2000, and any other format.
 */
export function getLengthConversion(unit: string): number {
  switch (unit.toUpperCase()) {
    case 'METER':
    case 'METERS':
    case 'M':
      return 1;
    case 'FEET':
    case 'FT':
      return 0.3048;
    case 'INCH':
    case 'INCHES':
    case 'IN':
      return 0.0254;
    case 'CM':
      return 0.01;
    case 'MM':
      return 0.001;
    default:
      return 1; // assume meters
  }
}
