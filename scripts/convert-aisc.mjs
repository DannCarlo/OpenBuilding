/**
 * Converts AISC Shapes Database CSV → structure_viewer JSON registry.
 *
 * Run:  node scripts/convert-aisc.mjs
 *
 * Output:  src/data/aisc-sections.json
 *
 * The CSV has imperial columns followed by SI columns on each row.
 * We use SI values (mm, mm², mm⁴) for profiles and convert to meters.
 * Canonical keys use imperial AISC_Manual_Label (what STAAD references).
 */

import { readFileSync, writeFileSync } from 'fs';

// Column indices (0-based) — these were determined by inspecting the CSV header.
// Imperial columns:
const IMP = {
  Type: 0,
  EDI: 1,
  Label: 2,       // AISC_Manual_Label (imperial) — e.g. "W12X26"
  W: 4,            // lb/ft
  A: 5,            // in²
  d: 6,            // in — depth (W, C) or long leg (L)
  Ht: 8,           // in — HSS rect height
  OD: 10,          // in — HSS round / Pipe outer diameter
  bf: 11,          // in — flange width (W, C)
  B: 13,           // in — HSS rect width
  b: 14,           // in — angle leg width (L)
  ID: 15,          // in — HSS round / Pipe inner diameter
  tw: 16,          // in — web thickness (W, C)
  tf: 19,          // in — flange thickness (W, C)
  t: 22,           // in — wall/leg thickness (HSS, L, P)
  Ix: 38,          // in⁴
  Iy: 42,          // in⁴
  J: 48,           // in⁴ — torsional constant
};

// SI columns start approximately at column 76 (varies slightly — we scan by finding
// the first SI AISC_Manual_Label which repeats the imperial label in SI format).
// For robustness we detect the SI half dynamically.
const IMP_COL_COUNT = 76; // approximate — we'll find the SI start dynamically

// Units — SI columns: mm for length, mm² for area, 10⁶ mm⁴ for Ix/Iy/J
const MM_TO_M = 0.001;
const MM2_TO_M2 = 1e-6;
const M6MM4_TO_M4 = 1e-6;   // AISC convention: Ix/Iy/J are in 10⁶ mm⁴

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const csvPath = 'public/aisc-shapes-database-v160-2 - Database v16.0.csv';
const outPath = 'src/data/aisc-sections.json';

const raw = readFileSync(csvPath, 'utf-8');
const lines = raw.split('\n');
const header = lines[0];

// Find SI column start — look for second occurrence of "AISC_Manual_Label"
const headerCols = header.split(',');
const siStart = headerCols.indexOf('AISC_Manual_Label', headerCols.indexOf('AISC_Manual_Label') + 1);
if (siStart < 0) throw new Error('Could not find SI column start');

// Map SI column names to indices
function siCol(name) {
  const idx = headerCols.indexOf(name, siStart);
  if (idx < 0) throw new Error(`SI column "${name}" not found`);
  return idx;
}

const SI = {
  Label: siCol('AISC_Manual_Label'),
  W:     siCol('W'),
  A:     siCol('A'),
  d:     siCol('d'),
  Ht:    siCol('Ht'),
  OD:    siCol('OD'),
  bf:    siCol('bf'),
  B:     siCol('B'),
  b:     siCol('b'),
  ID:    siCol('ID'),
  tw:    siCol('tw'),
  tf:    siCol('tf'),
  t:     siCol('t'),
  tnom:  siCol('tnom'),   // HSS/Pipe nominal wall thickness
  Ix:    siCol('Ix'),
  Iy:    siCol('Iy'),
  J:     siCol('J'),
};

function getSI(row, colIdx) {
  const v = parseFloat(row[colIdx]);
  return isNaN(v) ? undefined : v;
}

// ---------------------------------------------------------------------------
// Row processing
// ---------------------------------------------------------------------------

const entries = {};
let count = 0;
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(',');
  if (cols.length < siStart + 10) continue;

  const type = cols[IMP.Type];
  const key = cols[IMP.Label];        // imperial label — e.g. "W12X26"
  if (!key) continue;

  // Skip non-standard/historical types
  if (!['W', 'C', 'L', 'HSS', 'PIPE'].includes(type)) {
    skipped++;
    continue;
  }

  const dims = {};
  const props = {};

  // Extract relevant dimensions in mm → convert to meters for profile
  const d_mm   = getSI(cols, SI.d);
  const bf_mm  = getSI(cols, SI.bf);
  const tw_mm  = getSI(cols, SI.tw);
  const tf_mm  = getSI(cols, SI.tf);
  const od_mm  = getSI(cols, SI.OD);
  const id_mm  = getSI(cols, SI.ID);
  const ht_mm  = getSI(cols, SI.Ht);
  const B_mm   = getSI(cols, SI.B);
  const b_mm   = getSI(cols, SI.b);
  const ix_mm4 = getSI(cols, SI.Ix) ?? 0;   // mm⁴
  const iy_mm4 = getSI(cols, SI.Iy) ?? 0;
  const j_mm4  = getSI(cols, SI.J) ?? 0;
  const A_mm2  = getSI(cols, SI.A) ?? 0;    // mm²
  const W_kgm  = getSI(cols, SI.W);         // kg/m (informational)
  // HSS/Pipe wall thickness: use tnom (nominal) first, fall back to t
  const t_mm   = getSI(cols, SI.tnom) ?? getSI(cols, SI.t);

  // Build variant + dimension map
  let variant;
  const dimNames = [];

  switch (type) {
    case 'W':
      variant = 'STEEL_WIDE_FLANGE';
      if (d_mm != null) { dims.d = d_mm * MM_TO_M; dimNames.push('Depth'); }
      if (bf_mm != null) { dims.bf = bf_mm * MM_TO_M; dimNames.push('Flange Width'); }
      if (tw_mm != null) { dims.tw = tw_mm * MM_TO_M; dimNames.push('Web Thickness'); }
      if (tf_mm != null) { dims.tf = tf_mm * MM_TO_M; dimNames.push('Flange Thickness'); }
      break;

    case 'C':
      variant = 'STEEL_CHANNEL';
      if (d_mm != null) { dims.d = d_mm * MM_TO_M; dimNames.push('Depth'); }
      if (bf_mm != null) { dims.bf = bf_mm * MM_TO_M; dimNames.push('Flange Width'); }
      if (tw_mm != null) { dims.tw = tw_mm * MM_TO_M; dimNames.push('Web Thickness'); }
      if (tf_mm != null) { dims.tf = tf_mm * MM_TO_M; dimNames.push('Flange Thickness'); }
      break;

    case 'L':
      variant = 'STEEL_ANGLE';
      if (b_mm != null) { dims.leg = b_mm * MM_TO_M; dimNames.push('Leg'); }
      if (t_mm != null) { dims.t = t_mm * MM_TO_M; dimNames.push('Thickness'); }
      break;

    case 'HSS':
      if (od_mm != null) {
        // Round HSS (pipe-like)
        variant = 'STEEL_PIPE';
        dims.od = od_mm * MM_TO_M;
        dimNames.push('Outer Diameter');
        if (t_mm != null) { dims.t = t_mm * MM_TO_M; dimNames.push('Wall Thickness'); }
      } else if (ht_mm != null && B_mm != null) {
        // Rectangular HSS
        variant = 'STEEL_TUBE';
        dims.Ht = ht_mm * MM_TO_M;
        dims.B  = B_mm * MM_TO_M;
        dimNames.push('Height', 'Width');
        if (t_mm != null) { dims.t = t_mm * MM_TO_M; dimNames.push('Wall Thickness'); }
      } else {
        variant = 'STEEL_GENERIC';
      }
      break;

    case 'PIPE':
      variant = 'STEEL_PIPE';
      if (od_mm != null) { dims.od = od_mm * MM_TO_M; dimNames.push('Outer Diameter'); }
      if (t_mm != null) { dims.t = t_mm * MM_TO_M; dimNames.push('Wall Thickness'); }
      break;

    default:
      variant = 'STEEL_GENERIC';
  }

  // Build entry
  entries[key] = {
    key,
    variant,
    label: key.replace('X', '×'),
    dims,
    dimNames,
    // Properties in SI (convert to meters)
    area: A_mm2 * MM2_TO_M2,
    ix:   ix_mm4 * M6MM4_TO_M4,
    iy:   iy_mm4 * M6MM4_TO_M4,
    j:    j_mm4 * M6MM4_TO_M4,
    weightKgPerM: W_kgm,
  };
  count++;
}

// Write JSON
writeFileSync(outPath, JSON.stringify({ sections: entries }, null, 2), 'utf-8');
console.log(`Wrote ${count} sections to ${outPath} (skipped ${skipped} non-standard types)`);
console.log(`Top-level keys: ${Object.keys(entries).length}`);
