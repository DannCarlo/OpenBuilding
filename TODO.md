# TODO — Upcoming Work

---

## Guiding Principles

- **DRY & clean code** — no duplication, single sources of truth, consistent patterns.
- **Plan > Code** — spend more time architecting than writing. The objective is a codebase that is easy to understand, clean, and scalable.
- **Ask before acting** — if anything is ambiguous, ask clarifying questions before proceeding.
- **Keep ARCHITECTURE.md in sync** — every structural change must be reflected in the architecture doc.

---

## ✅ P1 — Materials Property for Members — DONE

### What was delivered
- Parse `DEFINE MATERIAL` block (ISOTROPIC, E, POISSON, DENSITY, TYPE, STRENGTH)
- Parse `CONSTANTS` MATERIAL assignments (`MATERIAL X ALL`, `MATERIAL X MEMB 1 TO 5`)
- Attach material to **members** and **plates** via `ALL` sentinel + per-ID lookup
- Material type inference: `FC##` → CONCRETE, `STEEL` → STEEL, unknown → OTHER + warning
- Strength properties parsed: FY (yield), FU (ultimate), FCU (compressive)
- Unit-aware display in InfoPanel: E (GPa/ksi), Density (kg/m³), Fy/Fu/Fcu (MPa/ksi)
- InfoPanel organized into sections: Identity, 📐 Geometry, 🧱 Material, ⚠ Warnings
- `renderWarnings` changed to `string[]` for multiple warnings per element
- Material shown on both member and plate info panels (shared `MaterialSection` component)

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
- [x] **P1 — Materials property** (parse, attach, display, strength, unit-aware, plates too)
- [x] ARCHITECTURE.md synced
