# Structure Viewer — Architecture & Code Guide

> **App:** STAAD .std 3D Model Viewer — Web-based structural analysis model viewer with Apple-inspired premium UI.
> **Repo:** `structure_viewer`
> **Status:** MVP Complete — 6 section shapes, BETA angles, mobile responsive, light mode default

---

## Folder Structure

```
structure_viewer/
├── src/
│   ├── App.tsx                          # Root component — layout orchestration, theme sync
│   ├── main.tsx                         # React entry point — R3F deprecation suppression
│   ├── index.css                        # Tailwind v4 entry + @theme design tokens + global resets
│   │
│   ├── parser/                          # ★ Multi-format parser (client-side, pure TypeScript)
│   │   ├── index.ts                     # Format dispatcher — centralized entry point for all parsers
│   │   ├── types.ts                     # BaseParseResult — shared output contract ALL parsers produce
│   │   ├── utils.ts                     # Only getLengthConversion() — the one truly shared utility
│   │   └── staad/                       # STAAD .std parser (format-specific)
│   │       ├── index.ts                 # parseStaadFile → toBaseResult() → BaseParseResult
│   │       ├── types.ts                 # StaadJoint, StaadMember, StaadParseResult, ParserMode
│   │       ├── utils.ts                 # parseUnitLine, expandRange, stripComments (all STAAD-specific)
│   │       └── commands/
│   │           ├── joint-coordinates.ts # JOINT COORDINATES → StaadJoint[]
│   │           ├── member-incidences.ts # MEMBER INCIDENCES → StaadMember[]
│   │           ├── member-properties.ts # MEMBER PROPERTY → StaadMemberProperty[]
│   │           ├── supports.ts         # SUPPORTS → StaadSupport[]
│   │           └── group-definitions.ts# START/END GROUP DEFINITION → StaadGroup[]
│   │
│   ├── model/                           # Format-independent normalized geometry model
│   │   ├── types.ts                     # ParsedModel, ModelNode, ModelMember, MemberSection, ModelSupport
│   │   └── builder.ts                   # BaseParseResult → ParsedModel (pure assembly, zero format knowledge)
│   │
│   ├── store/                           # Zustand state management
│   │   ├── modelStore.ts                # Model data, file name, loading/error state
│   │   ├── viewStore.ts                 # Display mode, labels/grid/support toggles, theme
│   │   └── uiStore.ts                  # Selected/hovered member, info panel visibility
│   │
│   ├── components/
│   │   ├── viewer/                      # ★ React-Three-Fiber 3D scene
│   │   │   ├── ViewerCanvas.tsx         # <Canvas> wrapper with theme-aware background
│   │   │   ├── Scene.tsx                # Root scene composition (lights + grid + nodes + members + supports + labels)
│   │   │   ├── useSceneGeometry.ts      # ★ Core hook — model → Three.js geometry data (nodes, members, supports, labels, bounds)
│   │   │   ├── Nodes.tsx                # InstancedMesh spheres at joint positions
│   │   │   ├── Members.tsx              # Per-member geometry — boxes for rectangular, cylinders for circular/unknown
│   │   │   ├── Supports.tsx             # Symbolic support markers (cone = fixed, sphere = pinned)
│   │   │   ├── Labels.tsx               # 3D text labels (node IDs) via @react-three/drei <Text>
│   │   │   ├── Grid.tsx                 # Ground reference grid — theme-aware colors from constants
│   │   │   ├── CameraControls.tsx       # OrbitControls with auto-fit on model load
│   │   │   └── Lighting.tsx             # Ambient + directional + hemisphere lights, theme-aware intensity
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx           # Full-viewport shell (all children absolute-positioned)
│   │   │   ├── TopBar.tsx               # Logo, file name, upload/theme toggle buttons
│   │   │   └── StatusBar.tsx            # Bottom-center glass panel — node/member/support counts
│   │   ├── upload/
│   │   │   └── UploadOverlay.tsx        # Welcome screen (shown when no model) — drag-drop upload with progress
│   │   ├── toolbar/
│   │   │   └── ViewToolbar.tsx          # Right-side floating toolbar — display modes + toggles
│   │   ├── panels/
│   │   │   └── InfoPanel.tsx            # Slide-out member info panel (section, length, connectivity)
│   │   └── ui/
│   │       ├── GlassPanel.tsx           # Reusable frosted-glass container (backdrop-filter blur)
│   │       └── IconButton.tsx           # Clean icon button with active state + tooltip
│   │
│   ├── hooks/
│   │   ├── useFileUpload.ts             # File drop/select handler → triggers parser pipeline
│   │   └── useModelParser.ts            # FileReader → STAAD parser → model builder → Zustand store
│   │
│   ├── lib/
│   │   ├── colors.ts                    # Member/section/support color palette (RECTANGULAR, CIRCULAR, STANDARD)
│   │   └── constants.ts                 # App name, supported extensions, geometry defaults, GRID_COLORS
│   │
│   └── types/                           # (reserved for shared types)
│
├── sample.std                           # Test fixture — 3-story RC frame (30 joints, 45 members)
├── public/
│   └── favicon.svg                      # App favicon
├── index.html                           # HTML shell — #root mount point
├── vite.config.ts                       # Vite + React + Tailwind CSS v4 plugin + @ path alias
├── tsconfig.json                        # TypeScript project references
├── tsconfig.app.json                    # App TS config (strict, bundler module resolution)
├── tsconfig.node.json                   # Node TS config (vite.config)
├── package.json                         # Dependencies & scripts
├── PLAN.md                              # Project plan, scope, design decisions
└── ARCHITECTURE.md                      # ← You are here
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React + TypeScript | 19.2 / 6.0 | Type-safe component architecture |
| Build Tool | Vite | 8.1 | Fast HMR, optimized builds |
| 3D Engine | Three.js | 0.185 | WebGL rendering |
| 3D React Bindings | @react-three/fiber | 9.6 | Declarative Three.js in React |
| 3D Helpers | @react-three/drei | 10.7 | OrbitControls, Text, prebuilt utilities |
| Styling | Tailwind CSS | 4.3 | Utility-first CSS via @tailwindcss/vite |
| State Management | Zustand | 5.0 | Lightweight, hook-based stores |
| Animations | Framer Motion | 12.4 | Spring physics, layout animations |
| Icons | Lucide React | 1.24 | Clean, consistent icon set |
| File Parsing | Custom TypeScript | — | Client-side .std text parser |

---

## Key Design Rules

1. **Client-side parsing only.** `.std` files are plain text. The parser runs entirely in the browser — no server, no upload latency, complete privacy.
2. **Parser produces `BaseParseResult`, model consumes it.** Each format parser (STAAD, ETABS, SAP2000) internally handles its own syntax, then translates to the shared `BaseParseResult` contract defined in `parser/types.ts`. The `model/builder.ts` has zero knowledge of any specific format — it assembles `ParsedModel` from the universal `BaseParseResult`.
3. **Geometry computation is memoized.** `useSceneGeometry()` runs all expensive Three.js math in a single `useMemo` — recomputes only when the model or view settings change.
4. **UI is layered on top of 3D.** All UI components are absolutely positioned over the full-viewport `<Canvas>`. The 3D scene is always the background.
5. **Stores are separated by concern.** `modelStore` (data), `viewStore` (display settings), `uiStore` (interaction state). Components import only what they need.
6. **Theme via CSS custom properties + Tailwind.** `@theme` in `index.css` defines design tokens. `.light` class toggles the palette. Zustand `theme` state syncs to `document.documentElement.classList`.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (React SPA)                       │
│                                                                   │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │  Upload   │   │   Parser     │   │     3D Viewer            │  │
│  │  (Drag/   │──▶│  (Pure TS)   │──▶│  (React-Three-Fiber)    │  │
│  │   Drop)   │   │              │   │                          │  │
│  └──────────┘   │ parser/staad/ │   │  ┌────────────────────┐  │  │
│                  │   ↓ toBase   │   │  │  useSceneGeometry   │  │  │
│  ┌──────────┐   │ BaseParseRes  │   │  │  (useMemo)          │  │  │
│  │  Zustand  │◀──│      ↓       │   │  │  - node positions   │  │  │
│  │  Stores   │   │ model/builder│   │  │  - member transforms │  │  │
│  │           │   │ (pure asm)   │   │  │  - support markers   │  │  │
│  └─────┬─────┘   └──────────────┘   │  │  - label positions   │  │  │
│        │                             │  │  - model bounds      │  │  │
│        ▼                             │  └────────────────────┘  │  │
│  ┌──────────┐                        │                          │  │
│  │   UI      │                        │  Nodes │ Members │ Sups  │  │
│  │  Panels   │                        │  Labels│ Grid    │ Cam   │  │
│  └──────────┘                        └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
.std File (text)
    │
    ▼
┌──────────────────────┐
│  STAAD Parser         │  Section-based state machine
│  (parser/staad/index) │  Keywords → mode switches
└──────────┬───────────┘
           │  StaadParseResult (internal, STAAD-specific)
           ▼
┌──────────────────────┐
│  toBaseResult()       │  PRIS→RECTANGULAR, TABLE→STANDARD
│  (inside staad/index) │  Joint→Node, FIXED_BUT→FIXED
│                       │  Expand ranges, build prop/group maps
└──────────┬───────────┘
           │  BaseParseResult (shared contract)
           ▼
┌──────────────────────┐
│  Model Builder        │  Pure assembly — validates connectivity
│  (model/builder)      │  Zero format knowledge
└──────────┬───────────┘
           │  ParsedModel { nodes[], members[], supports[], warnings[] }
           ▼
┌──────────────────────┐
│  Zustand Store        │  modelStore.setModel(model, fileName)
│  (store/modelStore)   │  uiStore.setShowUpload(false)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  useSceneGeometry     │  useMemo → MemberGeometryData[], node positions
│  (viewer/)            │  Column detection (|dir.y| > 0.8 → coral)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  R3F Components       │  <Nodes /> → InstancedMesh spheres
│  (viewer/)            │  <Members /> → per-member CylinderGeometry
│                       │  <Supports /> → ConeGeometry / SphereGeometry
└──────────────────────┘
```

---

## Parser Architecture

### Two-Layer Design

```
parser/
├── types.ts          ← BaseParseResult (shared output contract)
├── utils.ts          ← getLengthConversion() (only shared utility)
├── index.ts          ← Dispatcher (re-exports all format parsers)
│
├── staad/            ← STAAD-specific: types, utils, commands, state machine
├── etabs/            ← Future: ETABS-specific
└── sap2000/          ← Future: SAP2000-specific
```

Each format parser is self-contained with its own types, utilities, and command parsers. The only shared pieces are the `BaseParseResult` output contract and `getLengthConversion`.

### STAAD Parser State Machine

`parser/staad/index.ts` uses a **section-based state machine** driven by line-start keyword detection.

### State Machine Modes

| Mode | Trigger Keyword | Data Extracted |
|---|---|---|
| `idle` | *(initial / after END)* | Scans for next section keyword |
| `joints` | `JOINT COORDINATES` | `ID X Y Z` entries split by `;` |
| `members` | `MEMBER INCIDENCES` | `MemberID JointI JointJ` entries split by `;` |
| `memberProp` | `MEMBER PROPERTY` | Range-expanded IDs + `PRIS YD ZD [YB ZB]` or `TABLE ST <name>` |
| `constants` | `CONSTANTS` | `BETA <angle> MEMB <list>` → beta angle map |
| `supports` | `SUPPORTS` | Range-expanded joint IDs + support type |
| `groups` | `START GROUP DEFINITION` | Collects lines until `END GROUP DEFINITION`; parses as block |
| `skip` | `START *`, `DEFINE *`, `LOAD *`, etc. | Discards lines until matching `END` or next section keyword |

### Key Parser Rules

1. **Line continuation**: Lines ending with `-` are joined with the next line before processing.
2. **Semicolons**: `JOINT COORDINATES` and `MEMBER INCIDENCES` use `;` as intra-line separator.
3. **Range expansion**: `1014 TO 1021` → `[1014, 1015, ..., 1021]`.
4. **Comment stripping**: `!` marks inline comments. `<! ... !>` are block comments.
5. **Unit normalization**: `UNIT METER KN` → convert all coordinates to meters.
6. **Graceful degradation**: Malformed lines emit warnings, never crash the parse.

### What Gets Skipped (MVP)

Everything not needed for geometry visualization:
- `START JOB INFORMATION` / `DEFINE MATERIAL` / `MEMBER RELEASE` / `MEMBER CRACKED`
- `FLOOR DIAPHRAGM` / `DEFINE UBC LOAD` / `DEFINE WIND LOAD`
- All `LOAD` cases and combinations
- `PERFORM ANALYSIS` / `CHECK CODE` / `SELECT`

### Translation Layer — `toBaseResult()`

After the state machine fills `StaadParseResult`, the `toBaseResult()` function translates STAAD-specific data into the shared `BaseParseResult`:

| STAAD Concept | → | BaseParseResult |
|---|---|---|
| `StaadJoint` (joint) | → | `ParseNode` (node) |
| `StaadMember.jointI` / `jointJ` | → | `ParseMember.startNodeId` / `endNodeId` |
| `PRIS YD ZD` | → | `RECTANGULAR depthY depthZ` |
| `PRIS YD` (no ZD) | → | `CIRCULAR` (radius = YD/2) |
| `PRIS YD ZD ZB` | → | `TRAPEZOIDAL` (tapers in Z) |
| `PRIS YD ZD YB ZB` | → | `TSHAPE` (flange + web) |
| `TABLE ST W12X26` | → | `STANDARD W12X26` |
| `BETA <angle> MEMB` | → | `beta` in ParseMember |
| `FIXED_BUT` | → | `FIXED` |
| Support joint ranges | → | Individual per-node supports |
| Separate properties/groups arrays | → | Merged into each `ParseMember` |

### Adding a New Format

1. Create `parser/<format>/` with its own `types.ts`, `utils.ts`, `commands/`, `index.ts`
2. Implement `parse<Format>File(text: string): BaseParseResult`
3. Add one export to `parser/index.ts`
4. Add extension check in `useModelParser.ts`
5. **Zero changes to `model/`, `store/`, `viewer/`, or any UI component**

---

## 3D Rendering Pipeline

### useSceneGeometry Hook (the bridge)

`useSceneGeometry()` is the single hook that converts the Zustand `ParsedModel` into Three.js-ready data. It runs inside `useMemo` and only recomputes when the model or view settings change.

**Output:**
```typescript
{
  nodePositions: number[];          // Flat [x,y,z, x,y,z, ...] for InstancedMesh
  nodeColors: number[];             // Flat [r,g,b, r,g,b, ...]
  memberData: MemberGeometryData[]; // Per-member: position, rotation, length, radius, color
  supportData: Array<{             // Per-support: position, color, type
    position: [number, number, number];
    color: string;
    type: string;
  }>;
  labelData: Array<{               // Per-label (if enabled): position, text
    position: [number, number, number];
    text: string;
  }>;
  bounds: { center: [number, number, number]; size: number };
}
```

### Member Rendering Strategy

Each member is rendered with its **actual cross-section shape**, rotated to align with its start→end direction vector:

| Section | Geometry | Size |
|---|---|---|
| **Rectangular** | `BoxGeometry` | depthZ × length × depthY |
| **Circular** | `CylinderGeometry` (8-sided) | radius = depthY / 2 |
| **Trapezoidal** | `ExtrudeGeometry` (trapezoid shape) | YD height, ZD→ZB taper |
| **T-shape** | `ExtrudeGeometry` (T-profile shape) | flange ZD, web ZB×YB |
| **Unknown / no section** | `CylinderGeometry` | `DEFAULT_MEMBER_RADIUS` (0.05m) |

- **Position**: Midpoint of start and end nodes
- **Rotation**: 3-axis orthonormal basis — local Y→direction, local Z→world up (beams) or world X (columns); BETA applied as extra rotation around member axis
- **Color**: Columns (cos(dir·Y) > 0.8) → coral `#E85D47`; beams → blue `#4A90D9`; circular → orange `#F4A261`; trapezoidal → purple `#9B59B6`; T-shape → red `#E74C3C`; selected → gold `#FFD700`; hovered → light blue `#66AAFF`

### Node Rendering

All nodes rendered as a single `InstancedMesh` with `SphereGeometry`. Instance matrices are updated each frame via `useFrame` for efficiency. Scale: 0.08m radius.

### Camera Auto-Fit

`CameraControls` computes model bounds and auto-positions the camera on first load:
- Target = model bounding box center
- Distance = `boundingBoxSize × 1.5`
- Camera placed at 0.8×distance offset in X, 0.6×distance in Y

---

## State Management (Zustand)

### modelStore

| State | Type | Purpose |
|---|---|---|
| `model` | `ParsedModel \| null` | Current parsed and normalized model |
| `fileName` | `string \| null` | Uploaded file name for display |
| `isLoading` | `boolean` | Parser/builder in progress |
| `error` | `string \| null` | Parse or build error message |

| Action | Signature |
|---|---|
| `setModel` | `(model: ParsedModel, fileName: string) => void` |
| `clearModel` | `() => void` |
| `setLoading` | `(loading: boolean) => void` |
| `setError` | `(error: string \| null) => void` |

### viewStore

| State | Type | Purpose |
|---|---|---|
| `displayMode` | `'solid' \| 'wireframe' \| 'semi'` | Member rendering mode |
| `showLabels` | `boolean` | Node ID label visibility |
| `showGrid` | `boolean` | Ground grid visibility |
| `showSupports` | `boolean` | Support marker visibility |
| `theme` | `'dark' \| 'light'` | Color theme |

| Action | Signature |
|---|---|
| `setDisplayMode` | `(mode: DisplayMode) => void` |
| `toggleLabels` | `() => void` |
| `toggleGrid` | `() => void` |
| `toggleSupports` | `() => void` |
| `toggleTheme` | `() => void` |

### uiStore

| State | Type | Purpose |
|---|---|---|
| `selectedMemberId` | `number \| null` | Currently clicked member |
| `hoveredMemberId` | `number \| null` | Currently hovered member |
| `showInfoPanel` | `boolean` | Member info panel visibility |

---

## Component Tree

```
<App>
  ├── <MainLayout>
  │   ├── <ViewerCanvas>                         # Full-viewport R3F Canvas
  │   │   └── <Canvas>
  │   │       └── <Suspense>
  │   │           └── <Scene>
  │   │               ├── <Lighting />            # Ambient + 2× directional + hemisphere
  │   │               ├── <Grid />                # gridHelper at y=0
  │   │               ├── <Nodes />               # InstancedMesh spheres
  │   │               ├── <Members />             # Per-member cylinders
  │   │               ├── <Supports />            # Cone/sphere markers
  │   │               ├── <Labels />              # 3D Text labels
  │   │               └── <CameraControls />      # OrbitControls + auto-fit
  │   │
  │   ├── <TopBar />                              # Logo, file name, upload/theme buttons
  │   ├── <ViewToolbar />                         # Display modes + toggles (conditional: model loaded)
  │   ├── <StatusBar />                           # Node/member/support counts (conditional: model loaded)
  │   ├── <InfoPanel />                           # Selected member details slide-out (desktop sidebar, mobile bottom sheet)
  │   └── {!model && <UploadOverlay />}           # Welcome screen when no model loaded
```

---

## UI Design System

### Color Tokens (Tailwind v4 @theme)

| Token | Light (default) | Dark |
|---|---|---|---|
| `--color-bg-primary` | `#ffffff` | `#0a0a0b` |
| `--color-bg-secondary` | `#f5f5f7` | `#161618` |
| `--color-bg-glass` | `rgba(255,255,255,0.72)` | `rgba(22,22,24,0.72)` |
| `--color-border` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` |
| `--color-accent` | `#0066FF` | `#0066FF` |
| `--color-text-primary` | `#f5f5f7` | `#1d1d1f` |
| `--color-text-secondary` | `#a1a1a6` | `#86868b` |

### Glass Panel Pattern

All floating UI uses the `.glass` CSS class:
```css
.glass {
  background: var(--color-bg-glass);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);       /* 12px */
}
```

### Animation Principles
- **Spring physics**: `ease: [0.22, 0.61, 0.36, 1]` (custom cubic bezier)
- **Fast micro-interactions**: 150ms for hover/press
- **Panel transitions**: 300ms spring for open/close
- **Upload progress**: smooth 200ms width transition
- **Idle breath**: subtle scale pulse on the upload icon

---

## 3D Element Colors

| Element | Color | Hex |
|---|---|---|
| Beam (horizontal member) | Blue | `#4A90D9` |
| Column (vertical member) | Coral | `#E85D47` |
| Brace | Purple | `#7B68EE` |
| Rectangular section | Blue | `#4A90D9` |
| Circular section | Orange | `#F4A261` |
| Trapezoidal section | Purple | `#9B59B6` |
| T-shape section | Red | `#E74C3C` |
| Standard section (steel) | Green | `#50C878` |
| Selected member | Gold | `#FFD700` |
| Hovered member | Light Blue | `#66AAFF` |
| Fixed support | Coral | `#E85D47` |
| Pinned support | Orange | `#F4A261` |
| Roller support | Green | `#50C878` |
| Grid lines (light mode) | `#e8e8ed` / `#d5d5da` |
| Grid lines (dark mode) | `#222226` / `#3a3a3e` |
| Node spheres | Gray | `#999999` |

---

## Build & Development

```bash
npm run dev       # Vite dev server at http://localhost:5173/
npm run build     # tsc -b && vite build → output in dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint check
```

### Key Config

**`vite.config.ts`**:
- `@vitejs/plugin-react` for React Fast Refresh
- `@tailwindcss/vite` for Tailwind v4 CSS processing
- `@` path alias → `/src`

**`tsconfig.app.json`**:
- `strict: true`
- `moduleResolution: "bundler"`
- `jsx: "react-jsx"`

---

## Deprecation Suppression

### THREE.Clock → THREE.Timer

Three.js r185 deprecated `THREE.Clock` in favor of `THREE.Timer`. Since `@react-three/drei` (10.7.7) internally constructs `Clock` instances (in OrbitControls, etc.), we suppress this specific warning in `main.tsx`:

```typescript
const origWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('THREE.Clock') && msg.includes('deprecated')) return;
  origWarn(...args);
};
```

This can be removed once `@react-three/drei` v11 (stable) ships with `Timer` migration.

---

## Multi-Format Architecture (Implemented)

The parser already follows a plugin-ready architecture. Each format is a self-contained directory:

```typescript
// parser/index.ts — the dispatcher
export { parseStaadFile } from './staad';
// export { parseEtabsFile } from './etabs';    // future
// export { parseSap2000File } from './sap2000'; // future

// parser/types.ts — the shared output contract
interface BaseParseResult {
  nodes: ParseNode[];
  members: ParseMember[];
  supports: ParseSupport[];
  warnings: string[];
}
```

Every format parser must implement `parse<Format>File(text: string): BaseParseResult`. The `model/builder.ts` consumes only `BaseParseResult` — it has zero knowledge of STAAD, ETABS, or SAP2000 internals. The 3D viewer renders `ParsedModel` regardless of source format.

---

## Test Fixture: `sample.std`

- **Structure**: 3-story reinforced concrete frame building
- **Joints**: 30 (ground: 1001–1008, 2F: 2001–2012, roof: 3001–3010)
- **Members**: 45 (16 columns + 16 2F beams + 13 roof beams)
- **Supports**: 8 (all base joints fully fixed)
- **Sections**: Rectangular prismatic (PRIS YD ZD)
- **Units**: Meter, Kilonewton

---

*End of ARCHITECTURE.md — Updated 2026-07-17*
