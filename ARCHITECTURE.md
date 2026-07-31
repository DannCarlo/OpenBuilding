# OpenBuilding — Architecture & Code Guide

> **App:** OpenBuilding — Web-based 3D structural model viewer with Apple-inspired premium UI.
> **Repo:** `structure_viewer`
> **Status:** Refactor complete — profile-polygon architecture, AISC steel registry, unified bottom toolbar

---

## Folder Structure

```
structure_viewer/
├── src/
│   ├── App.tsx                          # Root component — layout orchestration, theme sync
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Tailwind v4 entry + @theme design tokens + global resets
│   │
│   ├── data/
│   │   ├── aisc-sections.json           # ★ AISC 16.0 steel database — 1,223 sections (W, C, L, HSS, Pipe)
│   │   │                                #   Each entry: key, variant, dims, dimNames, area, ix, iy
│   │   └── staad-to-aisc.json           # ★ STAAD name → AISC key mapping (1,408 entries)
│   │                                    #   Built by scripts/build-staad-mapping.mjs from CSV data
│   │
│   ├── parser/                          # ★ Multi-format parser (client-side, pure TypeScript)
│   │   ├── index.ts                     # Format dispatcher
│   │   ├── types.ts                     # ★ Core contracts:
│   │   │                                #   SectionProfile  — polygon boundary + holes
│   │   │                                #   SectionMeta     — label, family, dims[], source, area/ix/iy
│   │   │                                #   SectionDim      — { name, value }
│   │   │                                #   SectionConfig   — { arrangement, label?, props[] } (compound/b2b)
│   │   │                                #   Material        — { name, type, e?, density?, poisson?, strength? }
│   │   │                                #   ParseSection    — { type, profile?, meta?, sectionKey?,
│   │   │                                #                        description, config?, material?, renderWarnings? }
│   │   │                                #   ParseMember, ParseNode, ParseSupport, ParsePlate
│   │   │                                #   BaseParseResult — universal parser output (+ units)
│   │   ├── utils.ts                     # getLengthConversion() — shared utility
│   │   └── staad/                       # STAAD .std parser
│   │       ├── index.ts                 # parseStaadFile → toBaseResult() → BaseParseResult
│   │       │                            #   PRIS sections: inline polygon construction
│   │       │                            #   TABLE sections: direct lookup via staad-to-aisc.json
│   │       │                            #   Angle config detection: ST/LD/SD/SA/RA → SectionConfig
│   │       │                            #   DEFINE MATERIAL parsing → material registry
│   │       │                            #   CONSTANTS MATERIAL assignments (ALL + per-member)
│   │       │                            #   Render warnings: double angle, missing DB, unknown PRIS, no material
│   │       ├── types.ts                 # STAAD-internal types (StaadJoint, StaadMember, etc.)
│   │       ├── utils.ts                 # parseUnitLine, expandRange, stripComments
│   │       └── commands/
│   │           ├── joint-coordinates.ts
│   │           ├── member-incidences.ts
│   │           ├── member-properties.ts  # Extracts tableName + prefix + SP spacing
│   │           ├── material-definitions.ts # Parses DEFINE MATERIAL block → StaadMaterial[]
│   │           ├── supports.ts
│   │           └── group-definitions.ts
│   │
│   ├── model/
│   │   ├── types.ts                     # ParsedModel, ModelMember { section: MemberSection | null }
│   │   │                                # MemberSection mirrors ParseSection (+ config?, material?, renderWarnings?)
│   │   │                                # ModelPlate now carries material? and renderWarnings?
│   │   └── builder.ts                   # BaseParseResult → ParsedModel (pure assembly, passes units)
│   │
│   ├── store/
│   │   ├── modelStore.ts                # model, fileName, isLoading, error
│   │   ├── viewStore.ts                 # displayMode, navMode, showLabels, showGrid, showSupports,
│   │   │                                #   theme, showStats, fitViewTrigger
│   │   └── uiStore.ts                  # selectedMemberId, selectedPlateId, hoveredMemberId, showInfoPanel
│   │
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── ViewerCanvas.tsx         # R3F Canvas wrapper with theme-aware background + UnitsBadge
│   │   │   ├── UnitsBadge.tsx            # Lower-left viewport unit display (METER/KN, etc.)
│   │   │   ├── Scene.tsx                # Root scene composition
│   │   │   ├── useSceneGeometry.ts      # ★ Core hook: model → MemberGeometryData[]
│   │   │   │                            #   MemberGeometryData: { profile?, meta?, position, rotation,
│   │   │   │                            #                          length, radius, beta, color, sectionType }
│   │   │   ├── Members.tsx              # ★ createSectionGeometry: profile → buildExtrudedProfile()
│   │   │   │                            #   3-line implementation. No shape dispatch.
│   │   │   ├── Nodes.tsx                # InstancedMesh spheres
│   │   │   ├── Plates.tsx               # Solid plate/shell bodies (per-node thickness)
│   │   │   ├── Supports.tsx             # Cone (fixed) / sphere (pinned) markers
│   │   │   ├── Labels.tsx               # 3D node ID labels
│   │   │   ├── Grid.tsx                 # Theme-aware ground grid
│   │   │   ├── CameraControls.tsx       # OrbitControls: auto-fit, navMode mouse swap, fitView re-trigger
│   │   │   └── Lighting.tsx             # Ambient + directional + hemisphere lights
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── TopBar.tsx               # Logo + filename + open-file + theme toggle
│   │   ├── upload/
│   │   │   └── UploadOverlay.tsx        # Welcome screen / drag-drop upload
│   │   ├── toolbar/
│   │   │   └── BottomToolbar.tsx        # ★ Unified toolbar (desktop: full spread, mobile: scrollable bar)
│   │   │                                #   Groups: Nav Mode | Display Mode | Toggles | Fit View | Stats
│   │   ├── panels/
│   │   │   └── InfoPanel.tsx            # ★ Componentized: PanelHeader, MaterialSection, WarningsSection
│   │   │                                #   Shared between member & plate panels — zero duplication
│   │   └── ui/
│   │       ├── GlassPanel.tsx
│   │       ├── IconButton.tsx
│   │       └── Popover.tsx              # Portal-based dropdown (mobile toolbar popovers)
│   │
│   ├── hooks/
│   │   ├── useFileUpload.ts
│   │   └── useModelParser.ts            # FileReader → parser → builder → Zustand store
│   │
│   └── lib/
│       ├── section-profiles.ts          # ★ computeSectionProperties(profile) → { area, ix, iy }
│       │                                #   polygonCircle(r, n) math utility
│       │                                #   Re-exports: SectionProfile, SectionDim, SectionMeta
│       ├── steel-db.ts                  # ★ STEEL_REGISTRY (Map<key, SteelSectionEntry>)
│       │                                #   Built from aisc-sections.json at module init
│       │                                #   Exports: lookupSteelSection(key), hasSteelSection(key)
│       │                                #   SteelSectionEntry { key, label, variant, profile, meta }
│       ├── geometry-utils.ts            # ★ buildExtrudedProfile(profile, length) → BufferGeometry
│       │                                #   The one renderer function. Handles outer + holes.
│       ├── colors.ts                    # SECTION_COLORS, getMemberColor(), RENDER_WARNING_COLOR (#FF8C00)
│       └── constants.ts                 # App name, GRID_COLORS, DEFAULT_MEMBER_RADIUS
│
├── scripts/
│   ├── convert-aisc.mjs                 # Converts AISC CSV → aisc-sections.json (re-runnable)
│   └── build-staad-mapping.mjs          # Builds staad-to-aisc.json from sections_csv/*.csv (re-runnable)
│
├── public/
│   ├── aisc-shapes-database-v160-2 - Database v16.0.csv  # Source AISC data
│   ├── sections_csv/                    # STAAD section tables (18 CSVs, StaadName → Name)
│   │   ├── W Shape.csv                  #   W shapes (320 rows)
│   │   ├── Channel.csv                  #   C channels
│   │   ├── Angle.csv                    #   L angles (packed notation)
│   │   ├── HSS Rectangle.csv            #   HSS rectangular
│   │   ├── HSS Round.csv                #   HSS round
│   │   ├── Pipe.csv                     #   Pipe (SCH40/SCH80 → STD/XS)
│   │   ├── Tube.csv / Tube Old.csv      #   Legacy tube notation → HSS
│   │   ├── S Shape.csv / M Shape.csv    #   (not in AISC DB — renderWarning)
│   │   ├── HP Shape.csv / MC Channel.csv#   (not in AISC DB — renderWarning)
│   │   └── ...                          #   B Shape, Castellated, etc.
│   ├── Readme.html                      # AISC CSV column guide
│   └── favicon.svg
│
├── sample.std                           # RC frame fixture
├── sample-steel.STD                     # Steel truss fixture
├── TODO.md                              # ★ Known gaps: double-angle render, missing DB shapes, etc.
└── ARCHITECTURE.md                      # ← You are here
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React + TypeScript | 19.2 / 6.0 | Type-safe component architecture |
| Build Tool | Vite | 8.1 | Fast HMR, optimized builds |
| 3D Engine | Three.js | 0.185 | WebGL rendering |
| R3F | @react-three/fiber | 9.6 | Declarative 3D in React |
| Drei | @react-three/drei | 10.7 | OrbitControls, Text, helpers |
| Styling | Tailwind CSS | 4.3 | Utility-first + liquid glass design |
| Animation | Framer Motion | 12.4 | Slide transitions |
| State | Zustand | 5.0 | Model, view, UI stores |
| Icons | Lucide React | 1.24 | Clean icon set |

---

## Core Architecture — Profile Pipeline

Every section shape flows through a single unified pipeline:

```
STAAD .std file
  ↓
parser/staad/index.ts (toBaseResult)
  │
  ├── PRIS sections → inline polygon math → SectionProfile + SectionMeta
  │    computeSectionProperties() → area, ix, iy stored in meta
  │    Missing/incomplete PRIS → renderWarning set, cylinder fallback
  │
  └── TABLE sections → tokens parsed for prefix + name + SP spacing
       │
       ├── staad-to-aisc.json lookup (1,408 entries, pre-built from CSV)
       │    ↓
       ├── steel-db.ts / STEEL_REGISTRY → SectionProfile + SectionMeta
       │    Angle sections: ST/LD/SD/SA/RA → SectionConfig attached
       │    Double/compound → renderWarning set, shown in orange
       │
       └── Not found → renderWarning set, cylinder fallback (orange)
  ↓
ParseSection { type, profile, meta, sectionKey, description, config?, renderWarning? }
  ↓
model/builder.ts → MemberSection (identical shape)
  ↓
useSceneGeometry.ts → MemberGeometryData { profile, meta, renderWarning, ... }
  │                    renderWarning → orange color (#FF8C00)
  ↓
Members.tsx / createSectionGeometry:
  if (profile) return buildExtrudedProfile(profile, length)  ← one path
  return cylinder fallback                                    ← one fallback
  ↓
InfoPanel.tsx (componentized):
  🏷 PanelHeader      — Member/Plate title + close
  📐 Geometry         — Section, Family, dims, Area, Style, Spacing
  🧱 MaterialSection  — Name, E, Density, Fy, Fu, Fcu (unit-aware)
  ⚠ WarningsSection   — amber banner at bottom

**Adding a new section shape** = only the parser changes. Renderer + InfoPanel untouched.

**Adding a new format** (ETABS, SAP2000):
1. Create `parser/etabs/index.ts` with a `toBaseResult()` that produces the same `BaseParseResult`
2. Resolve to the same `SectionProfile` + `SectionMeta` (share `steel-db.ts`, `staad-to-aisc.json`)
3. Nothing else changes.

---

## Section Data Contracts

### SectionProfile — geometry source of truth
```typescript
interface SectionProfile {
  outer: [number, number][];    // polygon boundary, centroid at origin
  holes?: [number, number][][]; // inner voids (pipe bore, HSS cavity)
}
```

### SectionMeta — InfoPanel display
```typescript
interface SectionMeta {
  label: string;       // "W12×26", "300×600 mm Rect"
  family: string;      // "Wide Flange", "Rectangle", "Pipe"
  dims: SectionDim[];  // ordered named dimensions
  source: string;      // "AISC", "STAAD-PRIS", "Custom"
  area?: number;       // m² — tabulated (steel) or polygon-computed (prismatic)
  ix?: number;         // m⁴
  iy?: number;         // m⁴
}
```

### SectionDim — one dimension entry
```typescript
interface SectionDim { name: string; value: number; } // value in meters
```

---

## Steel Registry

`STEEL_REGISTRY` is a `Map<string, SteelSectionEntry>` built from `src/data/aisc-sections.json` at module load. 1,223 sections across 6 families:

| Family | Count | Variant | Profile shape |
|---|---|---|---|
| Wide Flange (W) | 289 | STEEL_WIDE_FLANGE | 12-pt I-shape |
| Channel (C) | 32 | STEEL_CHANNEL | 12-pt C-shape |
| Angle (L) | 137 | STEEL_ANGLE | 6-pt L-shape |
| HSS Rectangular | 525 | STEEL_HSS_RECT | 4-pt rect + 4-pt hole |
| HSS Round | 189 | STEEL_HSS_ROUND | 24-gon circle + hole |
| Pipe | 51 | STEEL_PIPE | 24-gon circle + hole |

All dimensions from published AISC Steel Construction Manual v16. Area/Ix/Iy are tabulated AISC values (fillets accounted for), not polygon-computed.

**Type system:** `SectionType` (full union of all section tags) is the single source of truth in `parser/types.ts`. `SteelSectionVariant` is derived via `Extract<SectionType, `STEEL_${string}`>` — stays in sync automatically.

**Adding a new section:** edit `src/data/aisc-sections.json`, re-run `node scripts/convert-aisc.mjs`.

### SectionConfigProp / SectionConfig — compound / arrangement metadata
```typescript
interface SectionConfigProp {
  name: string;    // "Spacing", "Gap", etc.
  value: number;   // meters
  unit?: string;   // "mm" (display hint)
}

interface SectionConfig {
  arrangement: string;   // "ST", "LD", "SD", "SA", "RA", "D", etc.
  label?: string;        // "Long Legs B2B" — InfoPanel Style row
  props: SectionConfigProp[];  // dynamic, like meta.dims
}
```
Set by the parser for angle arrangements. Extended for channels (D), built-up W-shapes, etc. Stored on both `ParseSection.config` and `MemberSection.config`. InfoPanel renders `config.label` as a Style row, then maps over `config.props` for Spacing etc.

### Material — parsed from DEFINE MATERIAL + CONSTANTS
```typescript
interface Material {
  name: string;           // "STEEL_A36", "FC21"
  type: 'STEEL' | 'CONCRETE' | 'OTHER';
  e?: number;             // elastic modulus (raw STAAD units)
  density?: number;       // density (raw STAAD units)
  poisson?: number;       // Poisson ratio
  strength?: {
    fy?: number;          // yield strength (FY)
    fu?: number;          // ultimate tensile (FU)
    fcu?: number;         // compressive strength (FCU)
    ry?: number;          // yield ratio
    rt?: number;          // tensile ratio
  };
}
```
Parsed from `DEFINE MATERIAL` block. Assigned to members/plates via `CONSTANTS` (`MATERIAL X ALL` → sentinel, `MATERIAL X MEMB ids` → per-ID). Type inferred from name if not explicit: `FC##` → CONCRETE, `STEEL` → STEEL, else OTHER with warning. Stored on `ParseSection.material`, `MemberSection.material`, `ParsePlate.material`.

### Render Warnings
```typescript
// On ParseSection, MemberSection, ParsePlate, and MemberGeometryData:
renderWarnings?: string[];  // multiple warnings per element
```
- **Parser** sets `renderWarnings` for: double angles, reversed axis, missing DB sections, unknown PRIS, TAPERED/USER, no material, unknown material type
- **Viewer** renders warned members in orange (`#FF8C00`) when `renderWarnings.length > 0`
- **InfoPanel** shows an amber banner at the bottom listing all warnings

---

## STAAD Steel Mapping

`src/data/staad-to-aisc.json` is a pre-built JSON mapping (1,408 entries) from STAAD names to canonical AISC keys. Built by `scripts/build-staad-mapping.mjs` from the 18 CSV files in `public/sections_csv/`.

The parser strips the arrangement prefix (`ST`/`LD`/`SD`/`SA`/`RA`) and looks up the section name directly:

```
"ST W12X26"         → strip prefix → "W12X26"        → "W12X26"
"LD L20203 SP 0.005"→ strip prefix → "L20203"        → "L2X2X3/16"  (+ SP extracted)
"ST C6X8.2"         → strip prefix → "C6X8.2"        → "C6X8.2"
"ST PIPS5"          → strip prefix → "PIPS5"         → "Pipe1/2STD"
"ST HSST20X12X0.625"→ strip prefix → "HSST20X12X0.625"→ "HSS20X12X5/8"
```

Arrangement prefixes are detected via `mapAngleArrangement()` and result in:
- `SectionConfig` with `arrangement`, `label` (e.g. "Long Legs B2B"), and `props` (e.g. Spacing)
- `sectionType` set to `STEEL_DOUBLE_ANGLE` for LD/SD/SA
- `meta.family` overridden to "Double Angle" for clean InfoPanel display

Sections not found in the mapping (S, M, HP, MC shapes, etc.) get `renderWarning` set and render as orange cylinders.

---

## Cross-Section Properties

`computeSectionProperties(profile)` in `lib/section-profiles.ts` uses the shoelace formula + second-moment integrals:
- **Area**: exact for idealized prismatic shapes (rectangle, circle, T, trapezoid)
- **Ix, Iy**: centroid-corrected (function auto-shifts polygon to centroid)
- **Holes**: subtracted from outer values (correct for pipes, HSS)
- **Steel**: uses AISC tabulated values (not polygon-computed)

All results stored in `meta.area / meta.ix / meta.iy` at parse time. The renderer never re-computes.

---

## InfoPanel — Generic Section Display

InfoPanel has no section-family special-casing. It renders whatever `meta.dims`, `config.label`, and `config.props` contain:

```tsx
{member.section.meta.dims.map(d => (
  <InfoRow key={d.name} label={d.name} value={fmt(d.value)} />
))}
{member.section.config?.label && (
  <InfoRow label="Style" value={member.section.config.label} />
)}
{member.section.config?.props.map(p => (
  <InfoRow key={p.name} label={p.name} value={fmtConfigProp(p)} />
))}
```

Section labels are formatted for readability via `fmtSectionLabel()`:
- `W12X26` → `W 12 × 26`
- `L2-1/2X3-1/2X3-1/8` → `L 2-1/2 × 3-1/2 × 3-1/8`
- `Pipe4STD` → `Pipe 4 STD`

Adding a new section type with 10 custom dimensions requires zero InfoPanel changes.

---

## Design System

- **Light mode default** — `--color-bg`, `--color-text-*`, `--color-border` CSS tokens
- **Dark mode** — `.dark` class on `<html>` toggles all tokens via `viewStore.theme`
- **Liquid glass** — `backdrop-filter: blur(24px) saturate(180%)` on panels + toolbar
- **Apple-inspired** — minimal chrome, smooth transitions (Framer Motion)
- **Desktop toolbar** — centered floating frosted-glass pill at bottom: 5 groups with dividers
- **Mobile toolbar** — fixed full-width scrollable bar at bottom (TradingView-style), horizontally scrollable with hidden scrollbar; dropdowns use portal-based `Popover` menus centered in viewport
- **InfoPanel** — desktop left slide-out (`hidden sm:block`), mobile bottom sheet (`sm:hidden`)

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  TopBar (logo + filename + open-file + theme)       │
├─────────────────────────────────────────────────────┤
│                                                     │
│                 3D Viewport                         │
│              (absolute inset-0)                     │
│                                                     │
│   ┌─ InfoPanel (desktop: left slide-out)            │
│                                                     │
├─────────────────────────────────────────────────────┤
│  BottomToolbar                                      │
│  Desktop: [Orbit|Pan] [Solid|Wire|Semi] [Grid...]   │
│  Mobile:  [3D▾] [View▾] [Util▾] [Fit] [📊] ←scroll→│
└─────────────────────────────────────────────────────┘
```

---

## ViewStore — Toggle Reference

| State | Type | Default | Driven by |
|---|---|---|---|
| `displayMode` | `'solid' \| 'wireframe' \| 'semi'` | `'solid'` | Display Mode group |
| `navMode` | `'orbit' \| 'pan'` | `'orbit'` | Nav Mode group (swaps OrbitControls mouseButtons) |
| `showGrid` | `boolean` | `true` | Toggle: Grid |
| `showLabels` | `boolean` | `false` | Toggle: Labels |
| `showSupports` | `boolean` | `true` | Toggle: Supports |
| `theme` | `'dark' \| 'light'` | `'light'` | TopBar theme button |
| `showStats` | `boolean` | `true` | Toggle: Stats (📊) |
| `fitViewTrigger` | `number` | `0` | Fit View button (increments to trigger re-fit) |

---

## What Each New Format Parser Must Do

```typescript
// For each member section:
// 1. Identify section shape
// 2. Extract dimensions
// 3. Build SectionProfile + SectionMeta (use lib/section-profiles or steel-db)
// 4. Assign section.profile, section.meta, section.type

// The renderer and InfoPanel never need to know the format existed.
```
