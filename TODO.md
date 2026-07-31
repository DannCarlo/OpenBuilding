# TODO — Upcoming Work

---

## Guiding Principles

- **DRY & clean code** — no duplication, single sources of truth, consistent patterns.
- **Plan > Code** — spend more time architecting than writing. The objective is a codebase that is easy to understand, clean, and scalable.
- **Ask before acting** — if anything is ambiguous, ask clarifying questions before proceeding.
- **Keep ARCHITECTURE.md in sync** — every structural change must be reflected in the architecture doc.

---

## P1 — Materials Property for Members

### Description
Add a `material` property to each member, parsed from the STAAD `.std` file. STAAD defines materials via the `CONSTANTS` or `DEFINE MATERIAL` blocks with properties like `E` (elastic modulus), `DENSITY`, `POISSON`, and material type (STEEL, CONCRETE, etc.).

### Scope
- Parse material definitions from STAAD input
- Attach material to each member (default: STEEL for TABLE sections, CONCRETE for PRIS sections)
- Store `material` on `ParseSection` / `MemberSection` (e.g. `{ type: 'STEEL' | 'CONCRETE', e?: number, density?: number }`)
- Material type drives rendering skin (see P2)

---

## P2 — Realistic View Mode

### Description
Replace the current `solid` display mode with `realistic`. When realistic is selected, members render with material-appropriate skins:
- **Steel** → metallic grey with slight roughness
- **Concrete** → matte light-grey with noise/bump texture
- **Unknown/default** → fallback neutral grey

### View Mode Options (updated)
| Mode | Description |
|---|---|
| **Realistic** | Material-aware skins (steel, concrete, etc.) |
| **Semi** | Semi-transparent with material tint |
| **Wireframe** | Unchanged — geometry edges only |

### Scope
- Rename `solid` → `realistic` in `viewStore`, `BottomToolbar`, and all references
- Implement material-to-skin mapping in `Members.tsx` (Three.js `MeshStandardMaterial` with per-material `color`, `roughness`, `metalness`)
- Concrete skin: high roughness (~0.9), low metalness (~0.1), warm grey color
- Steel skin: low roughness (~0.3), high metalness (~0.8), cool grey color
- Update `BottomToolbar` labels and icons

---

## P3 — Distinct Support Type Rendering

### Description
Currently all supports render with the same visual marker regardless of type (FIXED, PINNED, ROLLER). Each support type should have a distinct, recognizable 3D representation.

### Expected
| Type | Visual |
|---|---|
| **FIXED** | Full restraint — block/base plate with cross-hatch or pyramid marker |
| **PINNED** | Hinge — sphere/ball joint with triangular bracket |
| **ROLLER** | Roller — cylinder/triangle with arrow indicating free direction |

### Scope
- Update `Supports.tsx` to render type-specific geometry (not just color differences)
- Use distinct Three.js shapes per type (e.g., `ConeGeometry` for fixed, `SphereGeometry` for pinned, `CylinderGeometry` + triangle for roller)
- Keep the existing color distinction (`SUPPORT_COLORS`) as a secondary cue
- Ensure supports are clearly visible at all zoom levels

---

## Completed ✅

- [x] STAAD→AISC mapping (1,408 entries)
- [x] Angle arrangement detection + `SectionConfig`
- [x] Render warning system (orange members + info panel banner)
- [x] Section label formatting (`L 2-1/2 x 3-1/2`)
- [x] Removed `steel-resolver.ts` in favor of JSON mapping
- [x] ARCHITECTURE.md synced
