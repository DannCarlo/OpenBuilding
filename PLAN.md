# Structure Viewer — Project Plan

> **A premium, Apple-design-inspired 3D model viewer for structural analysis files (.std, future: ETABS, etc.)**
>
> *Last updated: 2026-07-17*

---

## 1. Executive Summary

A web-based application where users upload a STAAD.Pro `.std` input file and instantly see a fully interactive 3D model of the structure. The app focuses purely on **geometry visualization** (nodes, members, elements, supports) with toggleable **wireframe** and **solid/section** views. No analysis, no loads — just beautiful 3D model viewing. Designed to feel like an Apple product: minimal, fluid, premium.

---

## 2. Existing Solutions — Landscape Analysis

| Solution | Description | Relevance |
|---|---|---|
| **StructValidate** (GitHub: kamesh27) | React + FastAPI, parses .STD/.ANL, 3D viz via React-Three-Fiber, steel design checks | 🔥 **Closest match** — but focused on design validation, not pure viewing |
| **staad-pro-3d-generator** (GitHub: ladyFaye1998) | Generates .std from JSON; uses Plotly for 3D wireframe | ❌ Opposite direction (generator, not viewer) |
| **STAAD_NodeJS** (GitHub: chintanp, 11yr old) | Node.js parser for .ANL results files | ❌ Outdated, results-only, no 3D |
| **Bentley STAAD.Pro** (official) | Full-fat desktop application | ❌ Desktop only, expensive, overkill for viewing |
| **Bentley Navigator** | General BIM model viewer | ❌ Requires Bentley ecosystem/i-model format |
| **iTwin Analytical Synchronizer** | Syncs STAAD to iTwin cloud | ❌ Enterprise cloud platform, not a simple viewer |

### 🎯 Gap Identified

**No dedicated, lightweight, web-based STAAD .std 3D viewer exists.** Every existing solution either requires the full STAAD.Pro desktop software, is outdated, or serves a different purpose (design validation, generation). There is a clear opportunity for a clean, fast, zero-install web viewer.

---

## 3. Vision & Scope

### Phase 1 — MVP (Now)
- Upload `.std` file (drag & drop)
- Parse `JOINT COORDINATES`, `MEMBER INCIDENCES`, `MEMBER PROPERTIES`, `SUPPORTS`, `ELEMENT INCIDENCES` (plates/solids)
- Render 3D model with:
  - **Wireframe mode** (lines only, color-coded by member type)
  - **Solid section mode** (extruded profiles along member lines)
  - **Semi-transparent solid + wireframe** overlay
- Orbit/pan/zoom camera controls
- Node labels toggle
- Support symbol rendering (pins, fixed, etc.)
- Member/section info on hover/click
- Light/dark theme

### Phase 2 — Enhancements
- `.ANL` results file companion upload (color-code by axial/shear/moment)
- Export to glTF / OBJ
- Screenshot / high-res render
- Measurement tool (distance between nodes)
- Multiple viewports (front, top, side, isometric)

### Phase 3 — Multi-Format
- ETABS `.e2k` / `.$et` file support
- SAP2000 `.s2k` / `.$2k` file support
- Robot Structural Analysis files
- IFC import
- Plugin architecture for custom parsers

---

## 4. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | React 18 + TypeScript + Vite | Modern, fast, type-safe |
| **3D Engine** | Three.js via **React-Three-Fiber** + **Drei** | Declarative 3D in React, huge ecosystem |
| **Styling** | Tailwind CSS + **Framer Motion** | Utility-first + fluid animations |
| **State** | Zustand | Lightweight, no boilerplate |
| **File Parsing** | Custom TypeScript parser (client-side) | `.std` is plain text; no server needed for parsing |
| **Icons** | Lucide React | Clean, Apple-style icon set |
| **Deployment** | Vercel / Cloudflare Pages | Free tier, edge CDN |
| **Testing** | Vitest + React Testing Library | Fast, Vite-native |
| **Linting** | ESLint + Prettier | Code quality |

### Why Client-Side Parsing?

STAAD `.std` files are **plain text** with a well-defined command syntax. A typical `.std` file is < 10 MB even for large models. Parsing in the browser with a TypeScript/JavaScript parser is:
- **Instant** — no upload latency
- **Private** — file never leaves the user's machine
- **Cheap** — no server costs
- **Offline-capable** — works as a PWA

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │  Upload   │  │  Parser  │  │     3D Viewer          │  │
│  │  (Drag/   │──▶ (Pure    │──▶│  (React-Three-Fiber)  │  │
│  │   Drop)   │  │  TS)     │  │                       │  │
│  └──────────┘  └──────────┘  │  ┌─────────────────┐  │  │
│                               │  │ Scene Graph     │  │  │
│  ┌──────────┐                 │  │  - Nodes (dots) │  │  │
│  │  State   │◀────────────────│  │  - Members      │  │  │
│  │ (Zustand)│                 │  │  - Plates       │  │  │
│  └──────────┘                 │  │  - Supports     │  │  │
│        │                      │  │  - Labels       │  │  │
│        ▼                      │  └─────────────────┘  │  │
│  ┌──────────┐                 └───────────────────────┘  │
│  │   UI      │                                           │
│  │  Panels   │  ┌──────────┐  ┌──────────────────────┐  │
│  │  - Sidebar│  │  Export   │  │  View Controls       │  │
│  │  - Toolbar│  │  (glTF)   │  │  - Wireframe/Solid   │  │
│  │  - Info   │  │           │  │  - Theme              │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
.std File (text)
    │
    ▼
┌──────────────┐
│  Lexer       │  Tokenize STAAD command syntax
│  (tokenize)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Parser      │  Build Abstract Syntax Tree (AST)
│  (parse)     │  Extract: Joints, Members, Elements,
│              │           Properties, Supports
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Model       │  Normalized geometry model
│  Builder     │  { nodes: [], members: [], elements: [],
│              │    supports: [], properties: [] }
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  3D Scene    │  Convert to Three.js geometries:
│  Builder     │  - Nodes → SphereGeometry
│              │  - Members → CylinderGeometry / ExtrudeGeometry
│              │  - Plates → BufferGeometry (triangulated)
│              │  - Supports → Custom shape meshes
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Rendered    │  Displayed in <Canvas>
│  Scene       │
└──────────────┘
```

---

## 6. STAAD .std File Format — Key Commands to Parse

The `.std` file is a plain-text file with STAAD command syntax. Below are the **real patterns** observed in `sample.std` (a 3-story concrete frame).

### 6.1 Real Syntax Patterns (from sample.std)

```staad
STAAD SPACE                          ← Analysis type (SPACE = 3D, PLANE = 2D, TRUSS)
START JOB INFORMATION                ← Metadata block → skip
ENGINEER DATE 03-May-25
END JOB INFORMATION
INPUT WIDTH 79                       ← Formatting → skip
SET NL 100                           ← Setting → skip
UNIT METER KN                        ← Units: LENGTH FORCE

JOINT COORDINATES                    ← NODE DEFINITIONS
1001 0 0 0; 1002 4 0 0; 1003 0 0 1.296; 1004 4 0 1.296;
← Note: semicolons separate entries on the same line!
← Note: joint IDs are NOT necessarily 1,2,3... they can be any integers

MEMBER INCIDENCES                    ← BEAM/COLUMN CONNECTIVITY
1014 1001 2001; 1015 1002 2003; 1016 1003 2004;
← Format: MemberID JointI JointJ; (also semicolon-delimited)

START GROUP DEFINITION               ← Named groups → parse for labeling
FLOOR
_2F_STORAGE 2002 2004 2005 2007
_2F_TERRACE 2010 TO 2016
MEMBER
_CHB_WALL 2001 TO 2007 2012 2014
_RAIL 2015 2016
END GROUP DEFINITION

MEMBER PROPERTY                      ← SECTION PROPERTIES (no "AMERICAN" keyword here)
1014 TO 1021 1032 TO 1039 PRIS YD 0.35 ZD 0.25
← PRIS YD ZD = rectangular section (Y-depth, Z-depth in current units)
← "TO" = range: 1014 TO 1021 means members 1014,1015,...,1021
← Can also be: TABLE ST W12X26 (steel), TAPERED, etc.
3001 TO 3007 3010 TO 3013 PRIS YD 0.3 ZD 0.2

CONSTANTS                            ← Beta angle + material assignments
BETA 90 MEMB 1016 1018 TO 1021 ...
MATERIAL FC21 MEMB 1014 TO 1021 ...
← Material mapping → parse for info display; not needed for geometry

MEMBER RELEASE                       ← End releases → skip for MVP
2008 2009 3008 3009 START FY FZ MX MY MZ

SUPPORTS                             ← BOUNDARY CONDITIONS
1001 TO 1008 FIXED
← Range syntax + support type on same line

ELEMENT INCIDENCES                   ← PLATE/SHELL ELEMENTS (not present in sample)
1 1 2 3 4                            ← Quad element connecting joints 1,2,3,4

! inline comments start with !
<! STAAD PRO GENERATED DATA DO NOT MODIFY !!!   ← multiline comment blocks

LOAD 1 LOADTYPE ...                  ← Loads → skip everything from here
PERFORM ANALYSIS                     ← Analysis → skip
FINISH                               ← End of file → stop parsing
```

### 6.2 Parser Strategy (Refined)

The parser uses a **section-based state machine** driven by keyword detection:

```
                   ┌──────────────────────────────┐
                   │         START                 │
                   └─────────────┬────────────────┘
                                 │ read line
                                 ▼
                   ┌──────────────────────────────┐
                   │       Line Classifier         │
                   │  (keyword match at line start)│
                   └─────────────┬────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────────┐
        ▼                        ▼                            ▼
┌───────────────┐    ┌───────────────────────┐    ┌───────────────────┐
│ "JOINT        │    │ "MEMBER INCIDENCES"   │    │ "MEMBER PROPERTY" │
│  COORDINATES" │    │                       │    │                   │
│ → jointMode   │    │ → memberIncidMode     │    │ → memberPropMode  │
└───────┬───────┘    └───────────┬───────────┘    └─────────┬─────────┘
        │                        │                          │
        ▼                        ▼                          ▼
┌───────────────┐    ┌───────────────────────┐    ┌───────────────────┐
│ Parse:        │    │ Parse:                │    │ Parse:            │
│ ID X Y Z      │    │ ID JointI JointJ      │    │ ID [TO ID] PRIS..│
│ Split by ;    │    │ Split by ;            │    │ TABLE ST W12X26  │
│ Store nodes[] │    │ Store members[]       │    │ Store props{}    │
└───────────────┘    └───────────────────────┘    └───────────────────┘

        ┌────────────────────────┼────────────────────────────┐
        ▼                        ▼                            ▼
┌───────────────┐    ┌───────────────────────┐    ┌───────────────────┐
│ "SUPPORTS"    │    │ "START GROUP          │    │ "FINISH" / Another│
│ → supportMode │    │  DEFINITION"          │    │  command keyword  │
│               │    │ → groupMode (nest)    │    │ → exit mode       │
└───────────────┘    └───────────────────────┘    └───────────────────┘

Anything else → SKIP (loads, materials, releases, analysis...)
```

### 6.3 Key Parser Rules

1. **Line continuation**: Lines ending with `-` (possibly with whitespace) continue on the next line. Join them before parsing.
2. **Semicolons**: `JOINT COORDINATES` and `MEMBER INCIDENCES` use `;` as intra-line entry separator.
3. **Range expansion**: `1014 TO 1021` → expand to `[1014, 1015, ..., 1021]`.
4. **Comment stripping**: Remove inline comments (text after `!` that isn't inside a string). Skip `<! ... !>` blocks.
5. **Whitespace**: Tokens are whitespace-delimited within each entry.
6. **Case-insensitive keywords**: `JOINT COORDINATES` = `Joint Coordinates` = `joint coordinates`.
7. **Unit normalization**: Parse `UNIT METER KN` → all lengths in meters, forces in KN. Convert to SI internally.
8. **Graceful degradation**: If a line can't be parsed, emit a warning and skip it — don't crash the entire parse.

---

## 7. UI/UX Design — Apple-Inspired Premium Feel

### Design Principles
- **Minimal chrome**: The 3D model IS the interface
- **Blur & transparency**: Frosted glass panels (backdrop-filter blur)
- **Fluid animations**: Spring-based transitions (Framer Motion)
- **Typography**: Inter or SF Pro Display, clean hierarchy
- **Color**: Neutral grays + a single accent color (structural blue #0066FF)
- **Spacing**: Generous whitespace, rounded corners (12-16px)
- **Dark mode first**: With a crisp light mode

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌─────┐                              ┌──────────┐  │
│  │ ☰   │  Structure Viewer            │ 🌙 ⚙️  📤 │  │
│  └─────┘                              └──────────┘  │
│─────────────────────────────────────────────────────│
│ ┌────────┐                                       ┌─┤
│ │ UPLOAD │                                       │T│
│ │  .std  │        3D CANVAS (Full View)          │O│
│ │        │                                       │O│
│ │ Drag & │     ┌──────────────────────┐          │L│
│ │  Drop  │     │                      │          │B│
│ │        │     │    3D Structure       │          │A│
│ │  or    │     │                      │          │R│
│ │ Browse │     │                      │          │─│
│ │        │     └──────────────────────┘          │ │
│ └────────┘                                       │ │
│                                                  │ │
│ [Wireframe] [Solid] [Semi]  [Labels ON/OFF]     │ │
│                                                  │ │
│ ┌──────────────────────────────────────────────┐ │ │
│ │ 🟢 156 Nodes  │  🔵 234 Members  │  🟡 12 Sup│ │ │
│ └──────────────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────┘
```

### Empty State (Before Upload)

A centered, elegant drop zone with subtle animation:
- Large icon (cube/wireframe in gradient)
- "Drop your .std file here"
- Subtle pulsing border animation
- "or click to browse" secondary text
- Glass card with model stats (faded)

### Loaded State

- Upload panel collapses to a thin sidebar or disappears
- 3D model fades in with a subtle scale animation
- Bottom bar slides up with model statistics
- Floating toolbar (top-right) for view controls
- Right toolbar for display modes

### Key Interactions
- **Orbit**: Left mouse drag
- **Pan**: Right mouse drag or Shift+Left drag
- **Zoom**: Scroll wheel or pinch
- **Click member**: Highlight + show info popover
- **Double-click**: Focus/frame on selection
- **Hover**: Subtle highlight glow

---

## 8. Component Tree

```
<App>
  ├── <ThemeProvider>          (dark/light)
  ├── <UploadOverlay>          (initial drag-drop zone)
  ├── <MainLayout>
  │   ├── <TopBar>
  │   │   ├── <Logo />
  │   │   ├── <FileName />
  │   │   └── <Actions>        (theme toggle, settings, export)
  │   ├── <ViewerCanvas>
  │   │   ├── <Canvas>         (React-Three-Fiber)
  │   │   │   ├── <Scene>
  │   │   │   │   ├── <Nodes />
  │   │   │   │   ├── <Members />
  │   │   │   │   ├── <Plates />
  │   │   │   │   ├── <Supports />
  │   │   │   │   ├── <Labels />
  │   │   │   │   └── <Grid />
  │   │   │   ├── <CameraControls />
  │   │   │   └── <Lighting />
  │   │   └── </Canvas>
  │   ├── <Toolbar>            (view modes, labels toggle)
  │   └── <StatusBar>          (node/member count, units)
  ├── <InfoPanel>              (slide-out, member details)
  └── <SettingsPanel>          (slide-out, preferences)
```

---

## 9. Project Structure

```
structure_viewer/
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── index.css                   # Tailwind imports + globals
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── upload/
│   │   │   ├── UploadOverlay.tsx
│   │   │   └── DropZone.tsx
│   │   ├── viewer/
│   │   │   ├── ViewerCanvas.tsx
│   │   │   ├── Scene.tsx
│   │   │   ├── Nodes.tsx
│   │   │   ├── Members.tsx
│   │   │   ├── Plates.tsx
│   │   │   ├── Supports.tsx
│   │   │   ├── Labels.tsx
│   │   │   ├── Grid.tsx
│   │   │   ├── CameraControls.tsx
│   │   │   └── Lighting.tsx
│   │   ├── toolbar/
│   │   │   ├── ViewToolbar.tsx
│   │   │   └── DisplayModeToggle.tsx
│   │   ├── panels/
│   │   │   ├── InfoPanel.tsx
│   │   │   └── SettingsPanel.tsx
│   │   └── ui/
│   │       ├── GlassPanel.tsx       # Reusable frosted glass container
│   │       ├── IconButton.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── parser/
│   │   ├── index.ts                 # Main parse entry point
│   │   ├── lexer.ts                 # Tokenizer / line classifier
│   │   ├── commands/
│   │   │   ├── joint-coordinates.ts
│   │   │   ├── member-incidences.ts
│   │   │   ├── member-properties.ts
│   │   │   ├── element-incidences.ts
│   │   │   ├── supports.ts
│   │   │   └── units.ts
│   │   ├── types.ts                 # AST types
│   │   └── utils.ts                 # Parsing helpers
│   │
│   ├── model/
│   │   ├── builder.ts               # AST → normalized geometry model
│   │   ├── geometry.ts              # 3D mesh generation helpers
│   │   └── types.ts                 # Model types (Node, Member, Element, etc.)
│   │
│   ├── store/
│   │   ├── modelStore.ts            # Zustand: parsed model data
│   │   ├── viewStore.ts             # Zustand: display settings
│   │   └── uiStore.ts              # Zustand: UI state
│   │
│   ├── hooks/
│   │   ├── useFileUpload.ts
│   │   ├── useModelParser.ts
│   │   └── useClickHandler.ts
│   │
│   ├── lib/
│   │   ├── colors.ts                # Member type → color mapping
│   │   ├── constants.ts
│   │   └── three-helpers.ts         # Three.js utility functions
│   │
│   └── types/
│       └── staad.ts                 # STAAD-specific type definitions
│
├── tests/
│   ├── parser/
│   │   ├── lexer.test.ts
│   │   ├── joints.test.ts
│   │   ├── members.test.ts
│   │   └── fixtures/
│   │       ├── simple-frame.std
│   │       ├── truss.std
│   │       └── plate-model.std
│   └── components/
│       └── UploadOverlay.test.tsx
│
├── PLAN.md                          # This file
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── .eslintrc.cjs
```

---

## 10. Key Technical Decisions & Trade-offs

### 10.1 Three.js Member Rendering — Cylinders vs. Custom Extrusion

**Chosen: CylinderGeometry for MVP, custom ExtrudeGeometry for Phase 2**

- Cylinders are fast to render and work well for wireframe/solid views
- For true "section view" (showing I-beam flanges, etc.), we'll need to extrude the actual section profile shape along the member path — this is Phase 1 stretch / Phase 2

### 10.2 Wireframe Implementation

Two approaches:
- **Three.js `wireframe: true` material property**: Simple, but shows triangulation lines
- **`EdgesGeometry` + `LineBasicMaterial`**: Clean edges only, looks more professional ✅

### 10.3 Support Rendering

Represent supports as small symbolic 3D icons at joint positions:
- **FIXED**: Small pyramid/cone pointing toward joint
- **PINNED**: Small sphere
- **ROLLER**: Small cylinder + arrow
- **SPRING**: Coil geometry (Phase 2)

### 10.4 Large Model Performance

For models with >10,000 nodes/members:
- Use **InstancedMesh** for nodes (spheres)
- Use **InstancedMesh** for members (cylinders) 
- Implement **frustum culling** (Three.js does this by default)
- Add **LOD (Level of Detail)** for far-away members
- Consider **Web Worker** for parsing large files to avoid UI freeze

### 10.5 File Size Limits

- No hard limit — but warn if file > 50 MB
- Show progress bar during parsing (using requestAnimationFrame chunking)
- Consider streaming parser for very large files (Phase 2)

---

## 11. Design System Tokens

```css
/* Colors */
--color-bg-primary:    #0a0a0b (dark) / #f5f5f7 (light)
--color-bg-secondary:  #161618 (dark) / #ffffff (light)
--color-bg-glass:      rgba(22,22,24,0.7) (dark) / rgba(255,255,255,0.7)
--color-border:        rgba(255,255,255,0.08) (dark) / rgba(0,0,0,0.08)
--color-accent:        #0066FF
--color-accent-hover:  #0052CC
--color-text-primary:  #f5f5f7 (dark) / #1d1d1f (light)
--color-text-secondary:#a1a1a6 (dark) / #86868b (light)

/* Spacing */
--radius-sm:  8px
--radius-md:  12px
--radius-lg:  16px
--radius-xl:  24px

/* Shadows */
--shadow-glass: 0 8px 32px rgba(0,0,0,0.12)
--shadow-elevated: 0 20px 60px rgba(0,0,0,0.3)

/* Typography */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono: 'JetBrains Mono', 'SF Mono', monospace

/* Animations */
--ease-spring: cubic-bezier(0.22, 0.61, 0.36, 1)
--duration-fast: 150ms
--duration-normal: 300ms
--duration-slow: 500ms
```

---

## 12. Development Phases & Milestones

### Milestone 1 — Scaffold & Parser (Days 1–3)
- [x] ~~Create PLAN.md~~
- [x] ~~Study sample.std — understand real syntax patterns~~
- [x] ~~Resolve all planning questions~~
- [ ] Initialize Vite + React + TypeScript project
- [ ] Set up Tailwind CSS + design tokens
- [ ] Build STAAD .std lexer (line classifier)
- [ ] Build command parsers (JOINT, MEMBER, ELEMENT, SUPPORT)
- [ ] Unit tests with sample .std fixtures
- [ ] Build normalized model from parsed data

### Milestone 2 — 3D Rendering (Days 4–7)
- [ ] Set up React-Three-Fiber Canvas
- [ ] Render nodes as spheres
- [ ] Render members as cylinders (color by property)
- [ ] Render supports as symbolic geometry
- [ ] Implement camera controls (OrbitControls)
- [ ] Add grid plane for spatial reference
- [ ] Wireframe mode toggle

### Milestone 3 — UI Polish (Days 8–10)
- [ ] Upload overlay with drag-and-drop
- [ ] Glass-panel design system components
- [ ] Top bar + status bar
- [ ] View mode toolbar (Wireframe / Solid / Semi)
- [ ] Labels toggle
- [ ] Dark/light theme
- [ ] Framer Motion transitions

### Milestone 4 — Interaction & Polish (Days 11–13)
- [ ] Click-to-select members (highlight + info popover)
- [ ] Hover effects
- [ ] Double-click to frame/focus
- [ ] Loading states + progress
- [ ] Error handling (malformed files)
- [ ] Responsive layout
- [ ] Performance optimization (InstancedMesh)

### Milestone 5 — Launch Prep (Days 14–15)
- [ ] Export to glTF
- [ ] Sample .std files for demo
- [ ] README + documentation
- [ ] Deploy to Vercel
- [ ] OG image + meta tags

---

## 13. Future: Multi-Format Plugin Architecture

When adding ETABS/SAP2000 support, we'll refactor the parser into a plugin system:

```typescript
interface FormatParser {
  id: string;
  name: string;
  extensions: string[];
  parse(text: string): ParsedModel;
}

// Registry
const parsers: FormatParser[] = [
  new StaadStdParser(),
  new EtabsE2kParser(),   // future
  new Sap2000S2kParser(), // future
];
```

The `ParsedModel` is our normalized internal representation that all parsers produce. The 3D viewer doesn't care what format the file came from — it just renders the `ParsedModel`.

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| STAAD .std syntax variations across versions | Parser may miss data | Test with diverse .std files; make parser lenient |
| Very large models (>100k nodes) | Performance issues | InstancedMesh, LOD, Web Worker parsing |
| Complex section profiles (tapered, user-defined) | Hard to extrude correctly | Simplify to bounding box in MVP; full extrusion in Phase 2 |
| Browser memory limits | Crash on huge files | Streaming parser, file size warning |
| Bentley legal concerns about .std format | IP risk | .std is a published, documented text format; we're reading only |

---

## 15. Questions — Resolved ✅

| # | Question | Answer |
|---|----------|--------|
| 1 | Sample .std files? | ✅ **Provided** — `sample.std` attached (3-story concrete frame building, 30 joints, 38 members) |
| 2 | PWA / offline-capable? | **No** — just a standard webapp for now |
| 3 | User accounts / cloud save? | **Not yet** — bare client-side only for MVP; maybe in the future |
| 4 | Target audience? | **Quick viewer for engineers** primarily; can scale to client presentations later |
| 5 | Monetization? | **Free during dev**; Google AdSense on production |

---

## 16. Sample File Analysis — `sample.std`

### File Summary
- **Structure type**: 3-story reinforced concrete frame building
- **30 joints**, **38 members**
- **Units**: Meter, Kilonewton
- **Supports**: All base joints (1001–1008) fully fixed
- **Sections**: Rectangular prismatic (`PRIS YD ZD`)

### Parser Insights from Real .std Data

| Observed Pattern | Parser Rule |
|---|---|
| `JOINT COORDINATES` uses **semicolons** (`;`) to separate entries on same line | Split by `;` first, then parse each entry |
| `MEMBER INCIDENCES` also semicolon-delimited | Same pattern |
| **Continuation lines** end with `-` | Join continuation lines before parsing (strip trailing `-` and whitespace) |
| `MEMBER PROPERTY` uses **range syntax**: `1014 TO 1021` | Expand ranges like `start TO end` into individual member IDs |
| `PRIS YD 0.35 ZD 0.25` = rectangular section (meters) | Parse YD/ZD as rectangular section dimensions |
| `MATERIAL ... MEMB 1014 TO 1021 ...` assignment on same line | Parse material-to-member mapping |
| `SUPPORTS` uses range: `1001 TO 1008 FIXED` | Multiple joints, same support type |
| `!` prefix = inline comment | Skip lines starting with `!` or `*` |
| `START/END` blocks: `START JOB INFORMATION`…`END JOB INFORMATION` | Skip block content for MVP (metadata only, no geometry) |
| `START GROUP DEFINITION`…`END GROUP DEFINITION` | Parse for member groupings; useful for color-coding in future |
| `DEFINE MATERIAL START`…`END DEFINE MATERIAL` | Parse material names (FC21, STEEL, LINK) for info display |
| `MEMBER RELEASE` — end releases | Skip for MVP (no analysis visualization) |
| `MEMBER CRACKED` — cracked section reduction | Skip for MVP |
| `FLOOR DIAPHRAGM` — rigid floor constraint | Skip for MVP |
| Load definitions / combinations / `PERFORM ANALYSIS` | **Skip entirely** for MVP — we only need geometry |
| `FINISH` = end of file | Stop parsing |

### Parser Skipping Strategy (MVP)

For MVP, the parser only needs to extract **geometry** from these sections:

```
✅ JOINT COORDINATES       → nodes[]
✅ MEMBER INCIDENCES       → members[]
✅ MEMBER PROPERTY         → member sections (PRIS, TABLE ST, etc.)
✅ SUPPORTS                → support[] points with type
✅ UNIT                    → unit conversion factor
✅ START GROUP DEFINITION  → group names (useful for labeling)
⏭️ Everything else          → skip (loads, materials, releases, analysis, etc.)
```

### Sample Joint Layout Pattern

```
Z-axis (depth)
    │
    ├── 0m ──── 1.296m ──── 7.075m ──── 9.225m
    │
    │   Grid A (X=0)    Grid B (X=2)    Grid C (X=4)
    │
Y=6m │  3001  3004     3002,3005      3003  3006  3007  3008  3009  3010  (Roof)
Y=3m │  2001  2004     2002,2005      2003  2006  2007  2008  2009  2010..2012 (2F)
Y=0m │  1001  1003      —              1002  1004  1005  1006  1007  1008   (Ground)
```

Columns span ground→2F→roof. Beams run horizontally at each floor level along X and Z directions.

---

*End of PLAN.md — Ready for implementation. 🚀*
