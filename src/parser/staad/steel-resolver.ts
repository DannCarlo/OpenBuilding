/**
 * STAAD TABLE name → canonical AISC section key resolver.
 *
 * This module knows STAAD-specific naming quirks and unpacks them into
 * canonical keys that the app-level STEEL_REGISTRY understands.
 *
 * Each format parser (ETABS, SAP2000, etc.) gets its own resolver —
 * the registry itself never sees format-specific naming.
 */

// ---------------------------------------------------------------------------
// resolveStaadSteelKey — the one public function
// ---------------------------------------------------------------------------

export interface ResolvedSteelKey {
  /** Canonical AISC key for STEEL_REGISTRY lookup, or null if unrecognized */
  sectionKey: string | null;
  /** Back-to-back spacing in meters (double angles only) */
  spacing?: number;
  /** STAAD "SP" value as-is in current units (for display) */
  spacingRaw?: number;
  /** Configuration type: "LD" (long leg back-to-back), "SD" (short leg back-to-back) */
  config?: 'LD' | 'SD';
}

/**
 * Map a STAAD TABLE designation to a canonical AISC section key.
 *
 * STAAD quirks handled:
 *   "ST W12X26"        → key="W12X26"
 *   "W W12X26"         → key="W12X26"
 *   "LD L20203 SP 5"   → key="L2X2X3/16", config="LD", spacing=5×unitConversion
 *   "SD L20203 SP 5"   → key="L2X2X3/16", config="SD", spacing=5×unitConversion
 *   "L L20203"         → key="L2X2X3/16"  (single angle)
 *   "ST C6X8.2"        → key="C6X8.2"
 *   "ST P4"            → key="Pipe4STD"
 *   "ST PIPE4"         → key="Pipe4STD"
 *   "TUB TUB4X2X0.25"  → key="HSS4X2X1/4"
 *   "ST HSS4X4X0.25"   → key="HSS4X4X1/4"
 *
 * @param tableName  Raw STAAD TABLE string (everything after the TABLE keyword)
 * @param spacingConversion  Length conversion factor for SP value (e.g. inches → meters)
 */
export function resolveStaadSteelKey(
  tableName: string,
  spacingConversion: number = 1
): ResolvedSteelKey {
  const cleaned = tableName.trim();
  const upper = cleaned.toUpperCase();

  // ── Double Angle: LD/SD L20203 SP 0.005 ──────────────────────
  const daMatch = upper.match(/^(LD|SD)\s+L(\d+)(?:\s+SP\s+([\d.]+))?/i);
  if (daMatch) {
    const config = daMatch[1].toUpperCase() as 'LD' | 'SD';
    const angleCode = daMatch[2];
    const spRaw = daMatch[3] ? parseFloat(daMatch[3]) : undefined;
    const angleKey = unpackAngleCode(angleCode);
    if (angleKey) {
      return {
        sectionKey: angleKey,
        spacing: spRaw != null ? spRaw * spacingConversion : undefined,
        spacingRaw: spRaw,
        config,
      };
    }
    return { sectionKey: null };
  }

  // ── Single Angle: L L20203 ────────────────────────────────────
  const lMatch = upper.match(/^L\s+L(\d+)/i);
  if (lMatch) {
    const angleKey = unpackAngleCode(lMatch[1]);
    return { sectionKey: angleKey };
  }

  // ── Wide Flange: ST W12X26 or W W12X26 ────────────────────────
  const wMatch = upper.match(/(?:ST\s+)?(W\d+X[\d.]+)/i);
  if (wMatch) {
    return { sectionKey: wMatch[1].replace(/\s+/g, '') };
  }

  // ── Channel: ST C6X8.2 ────────────────────────────────────────
  const cMatch = upper.match(/(?:ST\s+)?(C\d+X[\d.]+)/i);
  if (cMatch) {
    return { sectionKey: cMatch[1].replace(/\s+/g, '') };
  }

  // ── Pipe: ST P4 or ST PIPE4 ───────────────────────────────────
  const pMatch = upper.match(/(?:ST\s+)?(?:PIPE)?P(\d+)/i);
  if (pMatch) {
    // Map to AISC pipe naming: P4 → Pipe4STD
    return { sectionKey: `Pipe${pMatch[1]}STD` };
  }

  // ── HSS / Tube: TUB TUB4X2X0.25 or HSS4X4X0.25 ────────────────
  const hssMatch = upper.match(/(?:ST\s+)?(?:TUB\s+)?(?:TUB)?(HSS)?(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)X([\d.]+)/i);
  if (hssMatch) {
    const h = hssMatch[2];
    const w = hssMatch[3];
    const t = hssMatch[4];
    // Convert decimal thickness to fraction if possible
    const tFrac = decimalToImperialFraction(parseFloat(t));
    return { sectionKey: `HSS${h}X${w}X${tFrac}` };
  }

  // ── Unrecognized ──────────────────────────────────────────────
  return { sectionKey: null };
}

// ---------------------------------------------------------------------------
// Private — angle code unpacking
// ---------------------------------------------------------------------------

/**
 * Unpack a STAAD packed angle code → canonical key like "L2X2X3/16".
 *
 * STAAD packs angle dimensions as: <longLeg><shortLeg><thickness16ths>
 *   "20203" → L 2"×2"×3/16"  (longLeg=2, shortLeg=2, thickness=3/16")
 *   "40305" → L 4"×3"×5/16"  (longLeg=4, shortLeg=3, thickness=5/16")
 *   "120308"→ L 12"×3"×1/2"  (longLeg=12, shortLeg=3, thickness=8/16"=1/2")
 */
function unpackAngleCode(code: string): string | null {
  if (!code || code.length < 3) return null;

  // Extract thickness in 1/16" — last 1-2 digits
  let thick16ths: number;
  let rest: string;

  if (code.length >= 2) {
    thick16ths = parseInt(code.slice(-2), 10);
    rest = code.slice(0, -2);
  } else {
    thick16ths = parseInt(code, 10);
    rest = '';
  }

  // Retry with 1 digit if 2-digit parse doesn't make sense
  if (isNaN(thick16ths) || thick16ths < 1 || thick16ths > 31) {
    thick16ths = parseInt(code.slice(-1), 10);
    rest = code.slice(0, -1);
  }

  // Extract leg lengths — last 1-2 = short leg, rest = long leg
  let shortLeg: number;
  let longLeg: number;

  if (rest.length >= 2) {
    shortLeg = parseInt(rest.slice(-1), 10);
    longLeg = parseInt(rest.slice(0, -1), 10);
    // Retry with 2-char short leg if long leg > 12
    if (longLeg > 12 && rest.length >= 3) {
      shortLeg = parseInt(rest.slice(-2), 10);
      longLeg = parseInt(rest.slice(0, -2), 10);
    }
  } else if (rest.length === 1) {
    shortLeg = parseInt(rest, 10);
    longLeg = shortLeg;
  } else {
    return null;
  }

  if (isNaN(longLeg) || longLeg < 1) return null;
  if (isNaN(shortLeg) || shortLeg < 1) shortLeg = longLeg;
  if (isNaN(thick16ths) || thick16ths < 1) return null;

  // Convert thickness to fraction string
  const thickFrac = simplifyFraction(thick16ths, 16);

  return `L${longLeg}X${shortLeg}X${thickFrac}`;
}

// ---------------------------------------------------------------------------
// Private — fraction helpers
// ---------------------------------------------------------------------------

/** Simplify a fraction: 3/16 → "3/16", 8/16 → "1/2", 16/16 → "1" */
function simplifyFraction(num: number, den: number): string {
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

function gcd(a: number, b: number): number {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

/**
 * Convert a decimal inch value to the closest imperial fraction string
 * used by AISC keys.  e.g. 0.25 → "1/4", 0.375 → "3/8", 0.5 → "1/2"
 */
function decimalToImperialFraction(dec: number): string {
  // Common AISC thickness fractions
  const fractions: [number, number, number][] = [
    [1, 8, 0.125],   // 1/8
    [3, 16, 0.1875], // 3/16
    [1, 4, 0.25],    // 1/4
    [5, 16, 0.3125], // 5/16
    [3, 8, 0.375],   // 3/8
    [7, 16, 0.4375], // 7/16
    [1, 2, 0.5],     // 1/2
    [9, 16, 0.5625], // 9/16
    [5, 8, 0.625],   // 5/8
    [11, 16, 0.6875],// 11/16
    [3, 4, 0.75],    // 3/4
    [13, 16, 0.8125],// 13/16
    [7, 8, 0.875],   // 7/8
  ];

  let best = fractions[0];
  let bestDiff = Math.abs(dec - best[2]);
  for (const f of fractions) {
    const diff = Math.abs(dec - f[2]);
    if (diff < bestDiff) { best = f; bestDiff = diff; }
  }
  return simplifyFraction(best[0], best[1]);
}
