import type { StaadMaterial } from '../types';

/**
 * Parse a DEFINE MATERIAL block (lines between START and END).
 * Returns a Map of material name → StaadMaterial.
 */
export function parseMaterialDefinitions(lines: string[]): Map<string, StaadMaterial> {
  const materials = new Map<string, StaadMaterial>();
  let current: Partial<StaadMaterial> | null = null;
  let currentName = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('!') || line.startsWith('*')) continue;

    const tokens = line.split(/\s+/);
    const upper = tokens[0].toUpperCase();

    if (upper === 'ISOTROPIC') {
      // Save previous material if any
      if (current && currentName) {
        materials.set(currentName, finalizeMaterial(currentName, current));
      }
      currentName = tokens.slice(1).join('_'); // "STEEL_A36" or "STEEL"
      current = {};
    } else if (upper === 'END') {
      if (current && currentName) {
        materials.set(currentName, finalizeMaterial(currentName, current));
      }
      current = null;
      currentName = '';
    } else if (current) {
      // Parse property lines
      if (upper === 'E' && tokens.length >= 2) {
        current.e = parseFloat(tokens[1]);
      } else if (upper === 'POISSON' && tokens.length >= 2) {
        current.poisson = parseFloat(tokens[1]);
      } else if (upper === 'DENSITY' && tokens.length >= 2) {
        current.density = parseFloat(tokens[1]);
      } else if (upper === 'TYPE' && tokens.length >= 2) {
        const t = tokens[1].toUpperCase();
        current.type = (t === 'STEEL' || t === 'CONCRETE') ? t : 'OTHER';
      }
    }
  }

  // Save last material
  if (current && currentName) {
    materials.set(currentName, finalizeMaterial(currentName, current));
  }

  return materials;
}

function finalizeMaterial(name: string, raw: Partial<StaadMaterial>): StaadMaterial {
  const type = raw.type ?? inferMaterialType(name);
  return {
    name,
    type,
    e: raw.e,
    density: raw.density,
    poisson: raw.poisson,
  };
}

/** Infer material type from name when TYPE is not explicitly set. */
function inferMaterialType(name: string): StaadMaterial['type'] {
  const upper = name.toUpperCase();
  if (upper.includes('CONCRETE')) return 'CONCRETE';
  // FC## pattern common in STAAD: FC21, FC28, FC35, etc. (f'c in MPa)
  if (/\bFC\d/.test(upper)) return 'CONCRETE';
  if (upper.includes('STEEL')) return 'STEEL';
  return 'OTHER';
}
