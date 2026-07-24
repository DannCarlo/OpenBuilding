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
│   │   └── aisc-sections.json           # ★ AISC 16.0 steel database — 1,223 sections (W, C, L, HSS, Pipe)
│   │                                    #   Each entry: key, variant, dims, dimNames, area, ix, iy
│   │
│   ├── parser/                          # ★ Multi-format parser (client-side, pure TypeScript)
│   │   ├── index.ts                     # Format dispatcher
│   │   ├── types.ts                     # ★ Core contracts:
│   │   │                                #   SectionProfile  — polygon boundary + holes
│   │   │                                #   SectionMeta     — label, family, dims[], source, area/ix/iy
│   │   │                                #   SectionDim      — { name, value }
│   │   │                                #   ParseSection    — { type, profile?, meta?, sectionKey?, description }
│   │   │                                #   ParseMember, ParseNode, ParseSupport, ParsePlate
│   │   │                                #   BaseParseResult — universal parser output
│   │   ├── utils.ts                     # getLengthConversion() — shared utility
│   │   └── staad/                       # STAAD .std parser
│   │       ├── index.ts                 # parseStaadFile → toBaseResult() → BaseParseResult
│   │       │                            #   PRIS sections: inline polygon construction + computeSectionProperties()
│   │       │                            #   TABLE sections: resolveStaadSteelKey() → lookupSteelSection()
│   │       ├── types.ts                 # STAAD-internal types (StaadJoint, StaadMember, etc.)
│   │       ├── utils.ts                 # parseUnitLine, expandRange, stripComments
│   │       ├── steel-resolver.ts        # ★ STAAD TABLE name → canonical AISC key
│   │       │                            #   e.g. "LD L20203 SP 0.005" → "L2X2X3/16"
│   │       │                            #        "ST W12X26"          → "W12X26"
│   │       │                            #        "ST P4"              → "Pipe4STD"
│   │       └── commands/
│   │           ├── joint-coordinates.ts
│   │           ├── member-incidences.ts
│   │           ├── member-properties.ts
│   │           ├── supports.ts
│   │           └── group-definitions.ts
│   │
│   ├── model/
│   │   ├── types.ts                     # ParsedModel, ModelMember { section: MemberSection | null }
│   │   │                                # MemberSection mirrors ParseSection (profile, meta, sectionKey, type)
│   │   └── builder.ts                   # BaseParseResult → ParsedModel (pure assembly)
│   │
│   ├── store/
│   │   ├── modelStore.ts                # model, fileName, isLoading, error
│   │   ├── viewStore.ts                 # displayMode, navMode, showLabels, showGrid, showSupports,
│   │   │                                #   theme, showStats, fitViewTrigger
│   │   └── uiStore.ts                  # selectedMemberId, selectedPlateId, hoveredMemberId, showInfoPanel
│   │
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── ViewerCanvas.tsx         # R3F Canvas wrapper with theme-aware background
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
│   │   │   └── InfoPanel.tsx            # ★ Renders member.section.meta.dims — fully generic,
│   │   │                                #   no section-family special-casing
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
│       ├── colors.ts                    # SECTION_COLORS (keyed by variant), getMemberColor()
│       └── constants.ts                 # App name, GRID_COLORS, DEFAULT_MEMBER_RADIUS
│
├── scripts/
│   └── convert-aisc.mjs                 # Converts AISC CSV → aisc-sections.json (re-runnable)
│
├── public/
│   ├── aisc-shapes-database-v160-2 - Database v16.0.csv  # Source AISC data
│   ├── Readme.html                      # AISC CSV column guide
│   └── favicon.svg
│
├── sample.std                           # RC frame fixture (30 joints, 45 members, 8 supports)
├── sample-steel.STD                     # Steel truss fixture (42 nodes, 81 members, 4 supports)
├── toolbar.md                           # Bottom toolbar design plan + design tokens
├── REFACTOR.md                          # ✅ All 4 phases complete — profile-polygon refactor
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
  │
  └── TABLE sections → steel-resolver.ts → canonical key
                         ↓
                       steel-db.ts / STEEL_REGISTRY
                         ↓
                       SectionProfile (polygon from AISC dims)
                       SectionMeta   (AISC tabulated area/ix/iy)
  ↓
ParseSection { type, profile, meta, sectionKey, description }
  ↓
model/builder.ts → MemberSection (identical shape)
  ↓
useSceneGeometry.ts → MemberGeometryData { profile, meta, ... }
  ↓
Members.tsx / createSectionGeometry:
  if (profile) return buildExtrudedProfile(profile, length)  ← one path
  return cylinder fallback                                    ← one fallback
  ↓
InfoPanel.tsx:
  member.section.meta.dims.map(d => <InfoRow .../>)          ← generic
```

**Adding a new section shape** = only the parser producing that shape changes. Renderer untouched. InfoPanel untouched.

**Adding a new format** (ETABS, SAP2000):
1. Create `parser/etabs/index.ts` + `parser/etabs/steel-resolver.ts`
2. Resolve to the same `SectionProfile` + `SectionMeta`
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

---

## STAAD Steel Resolver

`parser/staad/steel-resolver.ts` → `resolveStaadSteelKey(tableName)` handles all STAAD naming quirks:

| STAAD TABLE string | Canonical key |
|---|---|
| `ST W12X26` | `W12X26` |
| `LD L20203 SP 0.005` | `L2X2X3/16` (+ spacing extracted) |
| `L L20203` | `L2X2X3/16` |
| `ST C6X8.2` | `C6X8.2` |
| `ST P4` | `Pipe4STD` |
| `TUB TUB4X2X0.25` | `HSS4X2X1/4` |
| `ST HSS4X4X0.25` | `HSS4X4X1/4` |

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

InfoPanel has no section-family special-casing. It renders whatever `meta.dims` contains:

```tsx
{member.section.meta.dims.map(d => (
  <InfoRow key={d.name} label={d.name} value={fmt(d.value)} />
))}
{member.section.meta.area != null && (
  <InfoRow label="Area" value={`${(meta.area * 1e6).toFixed(1)} mm²`} />
)}
```

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
