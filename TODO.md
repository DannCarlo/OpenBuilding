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

## ✅ P2 — Realistic View Mode — DONE

### What was delivered
- Renamed `solid` → `realistic` in `viewStore`, `BottomToolbar` (label + Sparkles icon), and all references
- Material-aware skins via `getMaterialSkin()` in `lib/colors.ts` (single source of truth):
  - **STEEL** → metallic grey (`#B4B6BC`, roughness 0.28, metalness 0.85)
  - **CONCRETE** → matte warm grey (`#C6C5C1`, roughness 0.92, metalness 0.05)
  - **OTHER/unknown** → neutral grey fallback
- `MemberGeometryData` now carries `materialType`, `isSelected`, `isHovered`, `hasWarning`
- Interaction states (selection gold, hover blue, warning orange) override the skin color
- **Semi mode** keeps the section-type/purpose colors (`data.color`: columns red, beams blue, steel silver…) at 50% opacity — NOT material skins — so you can still tell element roles while seeing through
- `Plates.tsx` uses material skins only in realistic mode; realistic plates are **fully opaque** (highlight via color change), semi plates keep the green plate color + translucent
- Single `mode: DisplayMode` prop passed down (Members + Plates) — no separate `isWireframe`/`isRealistic` booleans
- `key={mode}` on `<meshStandardMaterial>` forces material re-instantiation on mode switch (fixes stale `transparent` flag not applying on prop diff)
- `Lighting.tsx` installs an offline `RoomEnvironment` (PMREM) so metallic steel gets real reflections — no network fetch

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
- [x] **P2 — Realistic view mode** (material skins, env reflections, toolbar rename)
- [x] ARCHITECTURE.md synced
