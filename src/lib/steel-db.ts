/**
 * Centralized steel section database.
 *
 * STEEL_REGISTRY is built from src/data/aisc-sections.json at module init.
 * Public API: lookupSteelSection(key), hasSteelSection(key).
 * All polygon builders are private to this module.
 */

import type { SectionProfile, SectionMeta, SectionDim, SteelSectionVariant } from '../parser/types';
import aiscData from '../data/aisc-sections.json';

// Re-export for convenience (source of truth is parser/types.ts)
export type { SteelSectionVariant };

// ---------------------------------------------------------------------------
// SteelSectionEntry — the registry item (Phase 3)
// ---------------------------------------------------------------------------

export interface SteelSectionEntry {
  key: string;
  label: string;
  variant: SteelSectionVariant;
  profile: SectionProfile;
  meta: SectionMeta;
}

// ---------------------------------------------------------------------------
// STEEL_REGISTRY — built once at module init from AISC JSON
// ---------------------------------------------------------------------------

/** Approximate a circle as n-gon */
function polygonCircle(r: number, n: number = 24): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}

/** Build a SteelSectionEntry from a raw JSON row — delegates to buildSteelProfile. */
function buildEntry(raw: {
  key: string; variant: string; label: string;
  dims: Record<string, number>; dimNames: string[];
  area: number; ix?: number; iy?: number;
}): SteelSectionEntry {
  const { key, variant, label, dims, dimNames, area, ix, iy } = raw;
  const { profile, meta } = buildSteelProfile({
    variant: variant as SteelSectionVariant,
    dims, dimNames, label,
    area, ix, iy,
    source: 'AISC',
  });
  return { key, label, variant: variant as SteelSectionVariant, profile, meta };
}

/** Build the registry from JSON data */
function buildRegistry(): Map<string, SteelSectionEntry> {
  const map = new Map<string, SteelSectionEntry>();
  for (const [key, raw] of Object.entries(aiscData.sections)) {
    try {
      map.set(key, buildEntry(raw as Parameters<typeof buildEntry>[0]));
    } catch {
      // skip malformed entries silently
    }
  }
  return map;
}

const STEEL_REGISTRY: Map<string, SteelSectionEntry> = buildRegistry();

// ---------------------------------------------------------------------------
// Public API (Phase 3+)
// ---------------------------------------------------------------------------

/** Look up a steel section by canonical AISC key. Returns undefined if not found. */
export function lookupSteelSection(key: string): SteelSectionEntry | undefined {
  return STEEL_REGISTRY.get(key);
}

/** Check if a canonical key exists in the registry. */
export function hasSteelSection(key: string): boolean {
  return STEEL_REGISTRY.has(key);
}

// ---------------------------------------------------------------------------
// buildSteelProfile — shared core (used by registry + parser fallback)
// ---------------------------------------------------------------------------

export interface BuildSteelProfileParams {
  variant: SteelSectionVariant;
  dims: Record<string, number>;
  dimNames: string[];
  label: string;
  area?: number;
  ix?: number;
  iy?: number;
  source?: string;
}

/**
 * Build a SectionProfile + SectionMeta for any steel variant.
 * This is the single source of truth for steel polygon construction.
 * Used by the registry (buildEntry) and by parser fallbacks.
 */
export function buildSteelProfile(params: BuildSteelProfileParams): {
  profile: SectionProfile;
  meta: SectionMeta;
} {
  const { variant, dims, dimNames, label, area, ix, iy, source = 'AISC' } = params;
  let profile: SectionProfile;
  let family: string;

  switch (variant) {
    case 'STEEL_WIDE_FLANGE': {
      const d = dims.d, bf = dims.bf, tw = dims.tw, tf = dims.tf;
      const hh = d / 2, hb = bf / 2, hw = tw / 2;
      profile = {
        outer: [
          [-hb,  hh], [ hb,  hh],
          [ hb,  hh - tf], [ hw,  hh - tf],
          [ hw, -hh + tf], [ hb, -hh + tf],
          [ hb, -hh], [-hb, -hh],
          [-hb, -hh + tf], [-hw, -hh + tf],
          [-hw,  hh - tf], [-hb,  hh - tf],
        ],
      };
      family = 'Wide Flange';
      break;
    }
    case 'STEEL_CHANNEL': {
      const d = dims.d, bf = dims.bf, tw = dims.tw, tf = dims.tf;
      const hh = d / 2, hw = tw / 2;
      profile = {
        outer: [
          [0,  hh], [bf,  hh],
          [bf,  hh - tf], [ hw,  hh - tf],
          [ hw, -hh + tf], [bf, -hh + tf],
          [bf, -hh], [0, -hh],
          [0, -hh + tf], [-hw, -hh + tf],
          [-hw,  hh - tf], [0,  hh - tf],
        ],
      };
      family = 'Channel';
      break;
    }
    case 'STEEL_ANGLE': {
      const leg = dims.leg, t = dims.t;
      const h = leg / 2;
      // 6-point L-shape: heel at bottom-left, one concave corner at (-h+t, -h+t)
      profile = {
        outer: [
          [-h,      -h     ],  // heel bottom-left
          [ h,      -h     ],  // bottom-right (end of horizontal leg)
          [ h,      -h + t ],  // inner-right (top of horizontal leg)
          [-h + t,  -h + t ],  // inner corner
          [-h + t,   h     ],  // top inner (end of vertical leg)
          [-h,       h     ],  // top-left outer
        ],
      };
      family = 'Angle';
      break;
    }
    case 'STEEL_TUBE': {
      const H = dims.Ht, B = dims.B, t = dims.t;
      const hH = H / 2, hB = B / 2;
      const hi = (H - 2 * t) / 2, bi = (B - 2 * t) / 2;
      profile = {
        outer: [[-hB, -hH], [hB, -hH], [hB, hH], [-hB, hH]],
      };
      if (t > 0) {
        profile.holes = [[[-bi, -hi], [bi, -hi], [bi, hi], [-bi, hi]]];
      }
      family = 'Tube';
      break;
    }
    case 'STEEL_HSS_RECT': {
      const H = dims.Ht, B = dims.B, t = dims.t;
      const hH = H / 2, hB = B / 2;
      const hi = (H - 2 * t) / 2, bi = (B - 2 * t) / 2;
      profile = {
        outer: [[-hB, -hH], [hB, -hH], [hB, hH], [-hB, hH]],
      };
      if (t > 0) {
        profile.holes = [[[-bi, -hi], [bi, -hi], [bi, hi], [-bi, hi]]];
      }
      family = 'HSS Rect';
      break;
    }
    case 'STEEL_PIPE': {
      const od = dims.od, t = dims.t;
      const ro = od / 2, ri = t > 0 ? ro - t : 0;
      profile = { outer: polygonCircle(ro) };
      if (ri > 0) {
        profile.holes = [polygonCircle(ri)];
      }
      family = 'Pipe';
      break;
    }
    case 'STEEL_HSS_ROUND': {
      const od = dims.od, t = dims.t;
      const ro = od / 2, ri = t > 0 ? ro - t : 0;
      profile = { outer: polygonCircle(ro) };
      if (ri > 0) {
        profile.holes = [polygonCircle(ri)];
      }
      family = 'HSS Round';
      break;
    }
    default:
      // Generic fallback: use a box approximation if dims available
      family = 'Steel (Generic)';
      if (dims.d && dims.bf) {
        const hy = dims.d / 2, hz = dims.bf / 2;
        profile = { outer: [[-hz, -hy], [hz, -hy], [hz, hy], [-hz, hy]] };
      } else {
        profile = { outer: [[-0.01, -0.01], [0.01, -0.01], [0.01, 0.01], [-0.01, 0.01]] };
      }
  }

  const metaDims: SectionDim[] = dimNames
    .map((name, i) => {
      const keys = Object.keys(dims);
      if (i < keys.length) return { name, value: dims[keys[i]] };
      return null;
    })
    .filter((d): d is SectionDim => d != null);

  const meta: SectionMeta = {
    label,
    family,
    source,
    dims: metaDims,
    ...(area != null ? { area } : {}),
    ...(ix != null ? { ix } : {}),
    ...(iy != null ? { iy } : {}),
  };

  return { profile, meta };
}

// ===========================================================================
