# Structure Viewer — Full Refactor Plan ✅ ALL PHASES COMPLETE

> **Goal:** Replace the current dimension-scalar + dispatch-branch architecture with a profile-polygon + metadata architecture that is format-agnostic, shape-unlimited, and analysis-ready.
>
> *Created: 2026-07-18 · Completed: 2026-07-18*
>
> **Phase 1** ✅ · **Phase 2** ✅ · **Phase 3** ✅ · **Phase 4** ✅

---

## 1. Problem Statement

### 1.1 What the current architecture does

Every section shape is a special case threaded through the entire stack:

```
STAAD YD/ZD/YB/ZB scalars
  → ParseSection.depthY / depthZ / depthYB / depthZB
  → MemberSection (identical scalar fields)
  → MemberGeometryData (identical scalar fields again)
  → createSectionGeometry() — manual if-branches per shape
  → buildSteelGeometry() — separate re-parse for steel
```

### 1.2 Why this doesn't scale

| Problem | Example |
|---|---|
| **New shape = new if-branch** | Adding HSS tube means editing `createSectionGeometry`, `useSceneGeometry`, `ParseSection` type, `InfoPanel` labels |
| **New format = knowledge scattered** | ETABS section parser would need to know about `depthY` semantics, same as STAAD |
| **Hollow sections broken** | Pipe/HSS render as solid disks (no hole representation possible with scalars) |
| **Steel geometry re-parsed at render time** | `buildSteelGeometry()` calls `parseSteelSection()` on every frame |
| **InfoPanel hard-coded per steel type** | `getDimensionLabels()` maps each variant to fixed 4-slot labels |
| **Not analysis-ready** | Scalar dims cannot yield Area, Ix, Iy, torsion constant — requires polygon boundary |

---

## 2. Proposed Solution

### 2.1 Core idea

Parsers produce **two things** for each section:

1. **`SectionProfile`** — the raw polygon boundary (outer + optional holes). This is the geometry contract. The renderer only ever sees this.

2. **`SectionMeta`** — human-readable metadata: label, family, named dimensions in display order, source standard. The InfoPanel only ever sees this.

Everything else (shape-specific if-branches, scalar fields, steel re-parsing) is deleted.

### 2.2 New contracts

```typescript
// ── Geometry contract ─────────────────────────────────────────────────────

/** A cross-section polygon. Origin should be the centroid for correct beam theory. */
export interface SectionProfile {
  /** Outer boundary vertices as [x, z] pairs in the member's local cross-section plane.
   *  x = local horizontal (weak axis), z = local vertical (strong axis).
   *  Centroid at origin. */
  outer: [number, number][];
  /** Inner voids — one array per hole (pipe bore, HSS cavity, etc.) */
  holes?: [number, number][][];
}

// ── Display contract ──────────────────────────────────────────────────────

/** A single named dimension for display in the InfoPanel. */
export interface SectionDim {
  name: string;    // e.g. "Depth", "Flange Width", "Wall Thickness"
  value: number;   // meters
}

/** Human-readable metadata about a section. Produced at parse time, consumed by InfoPanel. */
export interface SectionMeta {
  /** Short display label  e.g. "W12×26", "300×600 Rectangle", "L 2×2×3/16″", "Ø219 Pipe" */
  label: string;
  /** Section family e.g. "Wide Flange", "Rectangle", "Single Angle", "Pipe", "T-Shape" */
  family: string;
  /** Named dimensions in InfoPanel display order */
  dims: SectionDim[];
  /** Source format/standard  e.g. "AISC", "STAAD-PRIS", "Custom", "Eurocode" */
  source: string;
  /** Pre-computed cross-section properties (optional — computable from profile) */
  area?: number;   // m²
  ix?: number;     // m⁴  second moment about local x (weak axis)
  iy?: number;     // m⁴  second moment about local y (strong axis)
}

// ── Updated ParseSection ──────────────────────────────────────────────────

export interface ParseSection {
  /** Shape family tag — used for color lookup and legend. */
  type: 'RECTANGULAR' | 'CIRCULAR' | 'TRAPEZOIDAL' | 'TSHAPE' | 'CUSTOM' | 'TAPERED' | 'USER' | 'UNKNOWN'
    | 'STEEL_ANGLE' | 'STEEL_DOUBLE_ANGLE' | 'STEEL_WIDE_FLANGE' | 'STEEL_CHANNEL' | 'STEEL_PIPE' | 'STEEL_TUBE' | 'STEEL_GENERIC';

  /** Cross-section polygon — the geometry source of truth. */
  profile?: SectionProfile;

  /** Human-readable metadata for InfoPanel. */
  meta?: SectionMeta;

  /** Canonical steel section key (registry lookup). */
  sectionKey?: string;

  /** Fallback description. */
  description: string;
}
```

### 2.3 What `createSectionGeometry` becomes

```typescript
function createSectionGeometry(data: MemberGeometryData): THREE.BufferGeometry {
  if (data.profile) {
    return buildExtrudedProfile(data.profile, data.length);
  }
  return new THREE.CylinderGeometry(data.radius, data.radius, data.length, 8);
}
```

That's it. No shape dispatch. No steel branches. No re-parsing. Adding a new section shape anywhere in the world never requires touching this file again.

### 2.4 What `buildExtrudedProfile` does (replaces `buildExtrudedShape`)

```typescript
export function buildExtrudedProfile(profile: SectionProfile, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(profile.outer[0][0], profile.outer[0][1]);
  for (let i = 1; i < profile.outer.length; i++) shape.lineTo(profile.outer[i][0], profile.outer[i][1]);
  shape.closePath();

  // ★ Holes: pipe bore, HSS cavity, box section void, etc.
  for (const hole of profile.holes ?? []) {
    const h = new THREE.Path();
    h.moveTo(hole[0][0], hole[0][1]);
    for (let i = 1; i < hole.length; i++) h.lineTo(hole[i][0], hole[i][1]);
    h.closePath();
    shape.holes.push(h);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: length, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -length / 2, 0);
  return geo;
}
```

### 2.5 How InfoPanel becomes generic

```typescript
// Before: getDimensionLabels(type) → hardcoded 4-slot lookup
// After: member.section.meta.dims.map(d => <InfoRow label={d.name} value={fmt(d.value)} />)

{member.section?.meta && (
  <>
    <InfoRow label="Section" value={member.section.meta.label} />
    <InfoRow label="Family"  value={member.section.meta.family} />
    <div className="w-full h-px bg-border my-1" />
    {member.section.meta.dims.map(d => (
      <InfoRow key={d.name} label={d.name} value={fmt(d.value)} />
    ))}
    {member.section.meta.area && (
      <InfoRow label="Area" value={`${(member.section.meta.area * 1e6).toFixed(1)} mm²`} />
    )}
  </>
)}
```

No `getDimensionLabels()`, no `DIM_LABELS` map, no special-casing per steel variant. Any section family works with zero InfoPanel changes.

---

## 3. How the Steel Plan fits in

The **STEEL-PLAN.md** architecture (canonical keys + `STEEL_REGISTRY`) is incorporated **as Phase 3** of this refactor, with one change: the registry stores `profile: SectionProfile` and `meta: SectionMeta` instead of scalar dimensions.

```typescript
// lib/steel-db.ts

interface SteelSectionEntry {
  key: string;
  label: string;                   // "W12×26"
  variant: SteelSectionVariant;    // for color lookup
  profile: SectionProfile;         // pre-built polygon from real AISC dims
  meta: SectionMeta;               // dims array for InfoPanel
}

const STEEL_REGISTRY = new Map<string, SteelSectionEntry>([
  ['W12X26', {
    key: 'W12X26',
    label: 'W12×26',
    variant: 'STEEL_WIDE_FLANGE',
    profile: buildIShapeProfile(0.310, 0.165, 0.0058, 0.0097),
    meta: {
      label: 'W12×26',
      family: 'Wide Flange',
      source: 'AISC',
      dims: [
        { name: 'Depth',         value: 0.310  },
        { name: 'Flange Width',  value: 0.165  },
        { name: 'Web Thickness', value: 0.0058 },
        { name: 'Flange Thk',   value: 0.0097 },
      ],
      area: 0.004935,   // 7.65 in²
      iy: 2.44e-5,      // 204 in⁴
      ix: 9.6e-7,       // 17.3 in⁴
    },
  }],
]);
```

`buildSteelGeometry()` is completely removed — steel members flow through `buildExtrudedProfile()` like everything else.

---

## 4. Section Profiles — Design Decisions

### 4.1 No exported `build**` functions

The original plan had named builders like `buildRectangularProfile()`, `buildIShapeProfile()` etc. These are cut. They are an unnecessary indirection — a middle layer between "parser knows the dims" and "renderer gets a polygon".

**The profile is just data.** Each parser/resolver constructs the `outer: [[x,z],...]` array inline using tiny private coordinate helpers. The helpers are implementation details, not part of the public API.

**Public exports from `lib/section-profiles.ts`:**
```typescript
export type { SectionProfile, SectionDim, SectionMeta };   // types only
export { computeSectionProperties };                         // one utility function
```

**Public export from `lib/geometry-utils.ts`:**
```typescript
export { buildExtrudedProfile };  // the one renderer function
```

That's the entire public API surface. Parsers own their polygon construction logic. The renderer owns nothing but the extrusion step.

**Example — parser constructs profile inline:**
```typescript
// parser/staad/index.ts (inside toBaseResult)

// PRIS YD 0.3 ZD 0.6 → rectangle
if (prop.type === 'PRIS' && prop.yd && prop.zd) {
  const yd = prop.yd * scale, zd = prop.zd * scale;
  const hy = yd / 2, hz = zd / 2;
  const profile: SectionProfile = {
    outer: [[-hz, -hy], [hz, -hy], [hz, hy], [-hz, hy]],
  };
  const props = computeSectionProperties(profile);  // exact for idealized shapes
  section.profile = profile;
  section.meta = {
    label: `${(zd*1000).toFixed(0)}×${(yd*1000).toFixed(0)}`,
    family: 'Rectangle',
    source: 'STAAD-PRIS',
    dims: [{ name: 'Height', value: yd }, { name: 'Width', value: zd }],
    ...props,
  };
}
```

For shapes with non-trivial polygon math (circles, I-shapes), the parser may call private module-level helpers — but those are never exported.

---

### 4.2 Area, Ix, Iy — two strategies, same field

**Prismatic sections (rectangle, circle, T-shape, trapezoid):**

The polygon IS the exact section for these idealized shapes. Shoelace formula and second moment integrals give mathematically precise values — not approximations. These are computed once at parse time via `computeSectionProperties(profile)` and stored in `meta`.

**Steel sections (AISC registry):**

Real steel shapes have fillets, tapered flanges, and root radii that a simplified polygon does not capture. A polygon-computed area for W12×26 gives ~7.2 in² vs the AISC tabulated 7.65 in². The difference matters for utilization checks. Steel section entries in `STEEL_REGISTRY` store AISC tabulated values directly in `meta` — polygon computation is **not** used for steel.

```typescript
// Prismatic — compute from polygon (exact for idealized shapes)
const props = computeSectionProperties(profile);
meta.area = props.area;
meta.ix   = props.ix;
meta.iy   = props.iy;

// Steel — store AISC tabulated values (accounts for fillets)
meta.area = 0.004935;  // 7.65 in² from AISC SCM
meta.ix   = 9.6e-7;
meta.iy   = 2.44e-5;
```

**Performance:** `computeSectionProperties` runs once during parsing, result stored in `meta`. The renderer never touches it. No frame-rate impact.

---

### 4.3 `computeSectionProperties` — the one computation utility

A shoelace-based polygon property computer. No external library needed — the math is ~25 lines.

```typescript
// lib/section-profiles.ts

export function computeSectionProperties(profile: SectionProfile): { area: number; ix: number; iy: number } {
  const outerProps = polygonProperties(profile.outer);
  const holeProps  = (profile.holes ?? []).map(polygonProperties);
  return {
    area: outerProps.area - holeProps.reduce((s, h) => s + h.area, 0),
    ix:   outerProps.ix   - holeProps.reduce((s, h) => s + h.ix,   0),
    iy:   outerProps.iy   - holeProps.reduce((s, h) => s + h.iy,   0),
  };
}

/** Shoelace + second moment integrals for a single polygon (centroid assumed at origin). */
function polygonProperties(pts: [number, number][]) {
  let area = 0, ix = 0, iy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    ix   += cross * (y0 * y0 + y0 * y1 + y1 * y1);
    iy   += cross * (x0 * x0 + x0 * x1 + x1 * x1);
  }
  return { area: Math.abs(area) / 2, ix: Math.abs(ix) / 12, iy: Math.abs(iy) / 12 };
}
```

Holes are subtracted from the outer polygon values. This correctly handles pipes, HSS tubes, and any hollow section.

---

### 4.4 AISC data — JSON import, not hardcoded TypeScript

Instead of hardcoding W-section dimensions as TypeScript, `STEEL_REGISTRY` is built from a JSON data file:

```
src/data/aisc-sections.json   ← AISC W, C, L, HSS, Pipe section database
```

The AISC publishes this data freely (it's available from their website and multiple curated GitHub repositories in JSON/CSV form). Benefits:
- Adding new sections = edit one JSON file, no TypeScript changes
- Eurocode (HE, IPE, UB) and JIS sections can be added as additional JSON files later, same pattern
- The registry builder parses the JSON once at module initialization

```typescript
// lib/steel-db.ts

import aisc from '../data/aisc-sections.json';

const STEEL_REGISTRY = new Map<string, SteelSectionEntry>(
  aisc.map(row => [row.key, {
    key: row.key,
    label: row.label,
    variant: row.variant as SteelSectionVariant,
    profile: buildProfileFromRow(row),   // private fn — constructs polygon from row dims
    meta: {
      label: row.label,
      family: row.family,
      source: 'AISC',
      dims: row.dims,                    // pre-authored in JSON
      area: row.area,                    // AISC tabulated, m²
      ix: row.ix,                        // AISC tabulated, m⁴
      iy: row.iy,
    },
  }])
);
```

The private `buildProfileFromRow()` handles the polygon construction per variant. This is the one place where "which polygon does an I-shape need" knowledge lives — entirely inside `steel-db.ts`, not exported.

---

### 4.5 No library needed for geometry

| Task | Approach | Why no library |
|---|---|---|
| Polygon area / Ix / Iy | Shoelace + integrals — ~25 lines | Math is trivial, no dependency worth adding |
| Circle approximation | n-gon polygon — 4 lines | Three.js handles smooth rendering |
| Profile extrusion | `THREE.ExtrudeGeometry` (already in stack) | Already have Three.js |
| Polygon triangulation | `THREE.ExtrudeGeometry` handles this internally | Already have Three.js |

The only external data worth importing is the AISC sections JSON, and that's data — not a library.

---

## 5. Phased Implementation

### Phase 1 — Foundation: types + renderer (backward-compatible) ✅ COMPLETE
**Goal:** New types exist. Renderer uses profile when present. Old models work unchanged.

**Files changed:**

| File | Change |
|---|---|
| `parser/types.ts` | + `SectionProfile`, `SectionDim`, `SectionMeta` interfaces; + `profile?`, `meta?`, `sectionKey?` on `ParseSection`; mark scalar fields `@deprecated` |
| `model/types.ts` | Same additions to `MemberSection` |
| `lib/geometry-utils.ts` | + `buildExtrudedProfile(profile, length)` with hole support; keep old `buildExtrudedShape` for now |
| `components/viewer/useSceneGeometry.ts` | + `profile?` on `MemberGeometryData`; pass `member.section.profile` through |
| `components/viewer/Members.tsx` | `createSectionGeometry` checks `data.profile` first, falls back to old logic |
| `components/panels/InfoPanel.tsx` | Show `meta.dims` when `meta` present; fall back to old `getDimensionLabels()` path |

**Verification:** App loads and renders `sample.std` identically to before.

---

### Phase 2 — STAAD prismatic profile generation ✅ COMPLETE
**Goal:** All STAAD `PRIS` sections (rectangle, circle, T-shape, trapezoid) produce profiles at parse time. No new exported functions — parsers construct polygons inline.

**Files changed:**

| File | Change |
|---|---|
| `lib/section-profiles.ts` | **NEW** — exports: `SectionProfile`, `SectionDim`, `SectionMeta` types (re-exports from parser/types.ts) + `computeSectionProperties(profile)`. Also exports `polygonCircle()` as a math utility. Auto-centroid-shifting for correct Ix/Iy. |
| `parser/staad/index.ts` → `toBaseResult()` | For each PRIS section: construct polygon inline using local coordinate math, call `computeSectionProperties()`, populate `section.profile` and `section.meta`. Section dimensions now correctly scaled by the STAAD unit conversion factor. |

**What this enables:**
- Rectangular, T-shape, and trapezoidal members now render via `buildExtrudedProfile(profile, length)` — exact same visual result, now analysis-ready
- Circular sections become smooth 24-gon (vs current 8-sided cylinder)
- `meta.area`, `meta.ix`, `meta.iy` populated from polygon computation — exact for idealized prismatic shapes, centroid-corrected
- InfoPanel shows structured metadata (`meta.dims`) for all PRIS sections

**Verification:** Full TypeScript compilation passes. `sample.std` loads and renders all 45 members correctly (30 nodes, 45 members, 8 supports).

---

### Phase 3 — Steel registry + resolver (STEEL-PLAN integrated) ✅ COMPLETE
**Goal:** Steel sections look up real AISC dimensions from a JSON data file, produce profiles at parse time. No exported build functions — registry handles polygon construction internally.

**Files changed:**

| File | Change |
|---|---|
| `src/data/aisc-sections.json` | **NEW** — AISC section database (W, C, L, HSS, Pipe families). Sourced from AISC free download or curated GitHub dataset. |
| `lib/steel-db.ts` | Full rewrite: `SteelSectionEntry { key, label, variant, profile, meta }`; `STEEL_REGISTRY` built from JSON import; `lookupSteelSection(key)`. All polygon builders are private to this module. |
| `parser/staad/steel-resolver.ts` | **NEW** — `resolveStaadSteelKey(tableName: string): { sectionKey: string \| null, spacing?: number }` — maps all STAAD TABLE naming quirks to canonical keys |
| `parser/staad/index.ts` → `toBaseResult()` | For TABLE sections: call resolver → get canonical key → `lookupSteelSection(key)` → assign `profile`, `meta`, `sectionKey`, `type` |

**What this enables:**
- Steel wide flanges render as accurate I-shapes from real AISC dimensions (not heuristics)
- Angles render as L-shapes with correct leg/thickness
- Pipes render as hollow cylinders (outer circle + bore hole)
- InfoPanel for steel sections shows proper family-specific labels from `meta.dims`

**STEEL_REGISTRY seed list (Phase 3 minimum):**

| Family | Keys |
|---|---|
| Wide Flange | W8X31, W10X33, W12X26, W14X30, W16X36, W18X40 |
| Channel | C6X8.2, C8X11.5, C10X15.3 |
| Single Angle | L2X2X3/16, L3X3X1/4, L4X4X1/4, L4X3X1/4 |
| Double Angle | 2L2X2X3/16, 2L3X3X1/4 |
| Pipe | Pipe4STD, Pipe6STD, Pipe3STD |
| HSS Rect | HSS4X2X1/4, HSS6X4X3/8 |
| HSS Square | HSS4X4X1/4 |

**Note:** AISC keys use imperial fractional notation (e.g. `1/4` not `0.25`, `3/8` not `0.375`). The STAAD resolver maps STAAD names (`ST P4`, `ST HSS4X4X0.25`) → canonical keys (`Pipe4STD`, `HSS4X4X1/4`).

**Verification:** Load `sample-truss-1.STD`. All steel sections render correctly with accurate geometry. InfoPanel shows real dimensions.

---

### Phase 4 — Cleanup: remove old paths ✅ COMPLETE
**Goal:** Delete all deprecated scalar-based code. `createSectionGeometry` is 3 lines.

**Files changed:**

| File | Change |
|---|---|
| `parser/types.ts` | Remove `depthY`, `depthZ`, `depthYB`, `depthZB`, `tableName` from `ParseSection` |
| `model/types.ts` | Same removal from `MemberSection` |
| `components/viewer/useSceneGeometry.ts` | Remove `depthY`/`depthZ`/`depthYB`/`depthZB`/`tableName` from `MemberGeometryData`. Keep `radius` — it's the rendering fallback for unsectioned members, not a scalar dimension. |
| `components/viewer/Members.tsx` | Remove `legacyCreateSectionGeometry`; imports shrink to just `buildExtrudedProfile` |
| `lib/steel-db.ts` | Remove `parseSteelSection()`, `detectSteelVariant()`, `parseAngleDimensions()`, `formatAngleLabel()`, `getDimensionLabels()`, `DIM_LABELS`, `buildSteelGeometry()`, old `SteelSection` interface |
| `lib/geometry-utils.ts` | Remove old `buildExtrudedShape` + all 5 shape-point builders. File reduced to single `buildExtrudedProfile()` export. |
| `components/panels/InfoPanel.tsx` | Remove `getDimensionLabels()` import and fallback path |
| `parser/staad/index.ts` | Remove legacy steel imports (`parseSteelSection`/`detectSteelVariant`/`formatSteelLabel`); remove TABLE fallback block; remove `mapSectionDescription`; remove TABLE branch from `mapSectionType` |
| `ARCHITECTURE.md` | Updated to reflect post-refactor architecture |

**Verification:** Full TypeScript compilation passes. Both sample files load and render correctly — `sample.std` (30 nodes, 45 members, 8 supports) and `sample-truss-1.STD` (42 nodes, 81 members, 4 supports). Zero console errors.

---

## 6. File Layout After Refactor

```
src/
├── data/
│   └── aisc-sections.json         ★ NEW — AISC section database (W, C, L, HSS, Pipe)
│
├── lib/
│   ├── section-profiles.ts        ★ NEW — exports: SectionProfile/Meta types + computeSectionProperties()
│   │                                        (all polygon builders are private, not exported)
│   ├── steel-db.ts                ★ CHANGED — registry built from JSON import; lookupSteelSection()
│   │                                        (polygon construction is private inside this module)
│   ├── geometry-utils.ts          ★ CHANGED — exports buildExtrudedProfile() (replaces buildExtrudedShape)
│   ├── colors.ts                  unchanged
│   └── constants.ts               unchanged
│
├── parser/
│   ├── types.ts                   ★ CHANGED — SectionProfile, SectionMeta, updated ParseSection
│   ├── utils.ts                   unchanged
│   ├── index.ts                   unchanged
│   └── staad/
│       ├── index.ts               ★ CHANGED — toBaseResult() builds profiles inline + calls resolver
│       ├── types.ts               unchanged
│       ├── steel-resolver.ts      ★ NEW — STAAD TABLE name → canonical key
│       └── commands/
│           └── member-properties.ts  unchanged
│
├── model/
│   └── types.ts                   ★ CHANGED — updated MemberSection (profile + meta)
│
└── components/
    ├── viewer/
    │   ├── useSceneGeometry.ts    ★ CHANGED — include profile + meta in MemberGeometryData
    │   └── Members.tsx            ★ CHANGED — 3-line createSectionGeometry
    └── panels/
        └── InfoPanel.tsx          ★ CHANGED — generic meta.dims rendering
```

**Public API surface (what other files may import):**

| Module | Exported | Not exported (private) |
|---|---|---|
| `lib/section-profiles.ts` | `SectionProfile`, `SectionDim`, `SectionMeta`, `computeSectionProperties()` | polygon coordinate helpers |
| `lib/steel-db.ts` | `SteelSectionVariant`, `SteelSectionEntry`, `lookupSteelSection()` | polygon builders, `buildProfileFromRow()` |
| `lib/geometry-utils.ts` | `buildExtrudedProfile()` | (old `buildExtrudedShape` deleted in Phase 4) |
| `parser/staad/steel-resolver.ts` | `resolveStaadSteelKey()` | angle code parsers, regex helpers |

---

## 7. Analysis Readiness

`computeSectionProperties()` is implemented in Phase 2 and used immediately for prismatic sections. Steel sections use AISC tabulated values (see §4.2). Both write to the same `meta` fields — consumers never need to know which strategy was used.

```typescript
// Already exported from lib/section-profiles.ts after Phase 2
const props = computeSectionProperties(profile);
// → { area: number (m²), ix: number (m⁴), iy: number (m⁴) }
```

Future analysis features (member utilization, stress contours, deflection) can read `member.section.meta.area` / `.ix` / `.iy` directly — no architectural changes needed. The data is already there from parse time.

---

## 8. What Each Format Parser Needs to Do

This is the long-term contract for any new format (ETABS, SAP2000, Robot, etc.):

```
For each member section:
  1. Identify section shape from format's naming
  2. Extract dimensions
  3. Call the appropriate builder from lib/section-profiles.ts OR
     call its own format-specific steel resolver → STEEL_REGISTRY lookup
  4. Assign section.profile and section.meta
  5. Set section.type for color (RECTANGULAR, STEEL_WIDE_FLANGE, etc.)

The renderer and InfoPanel never need to know the format existed.
```

---

## 9. Summary of Decisions

| Decision | Rationale |
|---|---|
| Profile stored at parse time, not render time | Avoids re-parsing on every frame; analysis needs it once |
| `SectionMeta.dims` is an ordered array, not an object | Display order is explicit; no key name constraints; works for any section family |
| Centroid at polygon origin | Required for beam theory (neutral axis = geometric centroid); established from Phase 2 |
| Keep scalar `type` field (RECTANGULAR, STEEL_WIDE_FLANGE, etc.) | Colors and legend still need a family tag; profiles alone can't drive color decisions |
| Holes in profile | Pipes and HSS tubes cannot be represented without them; baking this in from Phase 1 prevents a second refactor |
| Steel registry in `lib/`, resolver in `parser/staad/` | Registry is app-level knowledge; resolver is format-specific knowledge |
| Phases are independently deployable | Each phase leaves the app in a working state; no big-bang cutover |
