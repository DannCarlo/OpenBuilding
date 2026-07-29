/**
 * Builds src/data/staad-to-aisc.json from public/staad_sections_csv/*.csv.
 *
 * Reads each CSV's StaadName & Name columns, normalizes the Name to match
 * aisc-sections.json key format, verifies the key exists, and outputs a
 * flat { StaadName: aiscKey } mapping.
 *
 * Run:  node scripts/build-staad-mapping.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSV_DIR = resolve(ROOT, 'public/staad_sections_csv');
const AISC_PATH = resolve(ROOT, 'src/data/aisc-sections.json');
const OUT_PATH = resolve(ROOT, 'src/data/staad-to-aisc.json');

// ── Load aisc-sections.json keys for validation ────────────────────────
const aiscData = JSON.parse(readFileSync(AISC_PATH, 'utf-8'));
const aiscKeys = new Set(Object.keys(aiscData.sections));
console.log(`Loaded ${aiscKeys.size} keys from aisc-sections.json`);

// ── Utility: decimal inches → imperial fraction string ─────────────────
function decimalToFraction(dec) {
  const fractions = [
    [1, 8, 0.125],
    [3, 16, 0.1875],
    [1, 4, 0.25],
    [5, 16, 0.3125],
    [3, 8, 0.375],
    [7, 16, 0.4375],
    [1, 2, 0.5],
    [9, 16, 0.5625],
    [5, 8, 0.625],
    [11, 16, 0.6875],
    [3, 4, 0.75],
    [13, 16, 0.8125],
    [7, 8, 0.875],
    [15, 16, 0.9375],
    [1, 1, 1.0],
  ];
  let best = fractions[0];
  let bestDiff = Math.abs(dec - best[2]);
  for (const f of fractions) {
    const diff = Math.abs(dec - f[2]);
    if (diff < bestDiff) { best = f; bestDiff = diff; }
  }
  const [num, den] = best;
  const g = gcd(num, den);
  const n = num / g, d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

function gcd(a, b) {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

// ── Utility: decimal inch dim → string (handles .5 as -1/2) ────────────
function formatDim(d) {
  const whole = Math.floor(d);
  const frac = d - whole;
  if (frac < 0.01) return `${whole}`;
  if (Math.abs(frac - 0.5) < 0.01) {
    return whole === 0 ? '1/2' : `${whole}-1/2`;
  }
  // fallback: just use decimal
  return `${d}`;
}

// ── Normalizers per CSV type ───────────────────────────────────────────

/** Angle: build key from dimensions D (long leg), B (short leg), T (thickness) */
function angleToKey(d, b, t) {
  const longStr = formatDim(d);
  const shortStr = formatDim(b);
  const tStr = decimalToFraction(t);
  return `L${longStr}X${shortStr}X${tStr}`;
}

/** HSS Round: HSS20X.500 → HSS20.000X0.500 */
function normalizeHssRound(name) {
  const m = name.match(/^HSS(\d+(?:\.\d+)?)X\.(\d+)$/i);
  if (!m) return name;
  const od = parseFloat(m[1]);
  const t = parseFloat('0.' + m[2]);
  return `HSS${od.toFixed(3)}X${t.toFixed(3)}`;
}

/** Pipe: PIPE1/2SCH40 → Pipe1/2STD */
function normalizePipe(name) {
  return name
    .replace(/^PIPE/, 'Pipe')
    .replace(/SCH40$/, 'STD')
    .replace(/SCH80$/, 'XS')
    .replace(/SCH60$/, 'XS'); // SCH60 → XS (closest match)
}

/** Tube: use D,B,T columns to build HSS key */
function tubeToHssKey(d, b, t) {
  const hStr = formatDim(d);
  const wStr = formatDim(b);
  const tStr = decimalToFraction(t);
  return `HSS${hStr}X${wStr}X${tStr}`;
}

// ── CSV processing ─────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    if (vals.length < headers.length) continue;
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j]; });
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

const mapping = {};   // StaadName → aiscKey
let mappedCount = 0;
let skippedCount = 0;
const skipped = [];

function addMapping(staadName, aiscKey) {
  if (!aiscKey) { skippedCount++; return; }
  if (!aiscKeys.has(aiscKey)) {
    skipped.push(`${staadName} → ${aiscKey} (not in aisc-sections.json)`);
    skippedCount++;
    return;
  }
  mapping[staadName] = aiscKey;
  mappedCount++;
}

// ── Process each CSV ───────────────────────────────────────────────────

const csvFiles = readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));

for (const file of csvFiles) {
  const text = readFileSync(resolve(CSV_DIR, file), 'utf-8');
  const rows = parseCsv(text);
  if (rows.length === 0) continue;

  const baseName = file.replace('.csv', '');
  console.log(`\nProcessing ${file} (${rows.length} rows)...`);

  for (const row of rows) {
    const staadName = row.StaadName?.trim();
    const name = row.Name?.trim();
    if (!staadName || !name) continue;

    switch (baseName) {
      case 'W Shape':
        addMapping(staadName, name);
        break;

      case 'Channel':
        addMapping(staadName, name);
        break;

      case 'Angle': {
        const d = parseFloat(row.D);
        const b = parseFloat(row.B);
        const t = parseFloat(row.T);
        if (!isNaN(d) && !isNaN(b) && !isNaN(t)) {
          addMapping(staadName, angleToKey(d, b, t));
        } else {
          skipped.push(`${staadName} (Angle: missing D/B/T)`);
          skippedCount++;
        }
        break;
      }

      case 'HSS Rectangle':
        addMapping(staadName, name);
        break;

      case 'HSS Rectangle Old':
        addMapping(staadName, name);
        break;

      case 'HSS Round':
        addMapping(staadName, normalizeHssRound(name));
        break;

      case 'HSS Round Old':
        addMapping(staadName, normalizeHssRound(name));
        break;

      case 'Pipe':
        addMapping(staadName, normalizePipe(name));
        break;

      case 'Tube': {
        // Use D, B, T columns to build HSS key
        const d = parseFloat(row.D);
        const b = parseFloat(row.B);
        const t = parseFloat(row.T);
        if (!isNaN(d) && !isNaN(b) && !isNaN(t)) {
          addMapping(staadName, tubeToHssKey(d, b, t));
        } else {
          skipped.push(`${staadName} (Tube: missing D/B/T)`);
          skippedCount++;
        }
        break;
      }

      case 'Tube Old': {
        const d = parseFloat(row.D);
        const b = parseFloat(row.B);
        const t = parseFloat(row.T);
        if (!isNaN(d) && !isNaN(b) && !isNaN(t)) {
          addMapping(staadName, tubeToHssKey(d, b, t));
        } else {
          skipped.push(`${staadName} (Tube Old: missing D/B/T)`);
          skippedCount++;
        }
        break;
      }

      // Sections not in aisc-sections.json — skip but log
      case 'S Shape':
      case 'M Shape':
      case 'HP Shape':
      case 'MC Channel':
      case 'B Shape':
      case 'Castellated Comp Beam':
      case 'Castellated NonComp Beam':
        skipped.push(`${staadName} (${baseName}: not in aisc-sections.json)`);
        skippedCount++;
        break;

      default:
        // Try direct match
        if (aiscKeys.has(name)) {
          addMapping(staadName, name);
        } else {
          skipped.push(`${staadName} → ${name} (unknown CSV: ${baseName})`);
          skippedCount++;
        }
    }
  }
}

// ── Output ──────────────────────────────────────────────────────────────

writeFileSync(OUT_PATH, JSON.stringify(mapping, null, 2), 'utf-8');
console.log(`\n─── Summary ───`);
console.log(`Mapped:  ${mappedCount}`);
console.log(`Skipped: ${skippedCount}`);
if (skipped.length > 0) {
  console.log(`\nSkipped entries (first 20):`);
  for (const s of skipped.slice(0, 20)) console.log(`  ${s}`);
  if (skipped.length > 20) console.log(`  ... and ${skipped.length - 20} more`);
}
console.log(`\nOutput: ${OUT_PATH}`);
