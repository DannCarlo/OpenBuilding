# TODO — Known Rendering & Data Gaps

Ranked by importance (★ = critical, ☆ = nice-to-have).

---

## ★★★ P1 — Compound / Double Section Rendering

These sections are correctly **parsed** and **classified** (type, config, spacing all set), but the 3D viewer only renders a **single profile**. The renderer needs to draw two shapes with the configured spacing and orientation.

| # | Issue | STAAD tags | Status |
|---|---|---|---|
| 1 | **Double angle — long legs b2b** | `LD` | Parsed ✅ · Render ❌ |
| 2 | **Double angle — short legs b2b** | `SD` | Parsed ✅ · Render ❌ |
| 3 | **Star angle arrangement** | `SA` | Parsed ✅ · Render ❌ |
| 4 | **Double channel — back-to-back** | `D` | Not yet parsed ❌ |
| 5 | **Double W-shape / built-up sections** | (various) | Not yet parsed ❌ |

**Renderer work needed:**
- Accept `SectionConfig` with `arrangement` + `spacing`
- Compute two profiles offset by spacing
- Correct orientation per arrangement type (LD vs SD)
- Handle star arrangement (connected at heel)

---

## ★★ P2 — Angle Axis Reversal

| # | Issue | STAAD tag | Status |
|---|---|---|---|
| 6 | Reversed Y-Z axis for single angle | `RA` | Parsed ✅ · Render ❌ |

**Note:** `RA` stores correctly (`config.arrangement = 'RA'`) but the renderer doesn't flip the profile axes.

---

## ★★ P3 — Missing Steel Database Sections

Sections present in STAAD CSV files but **not in `aisc-sections.json`** (the AISC v16.0 database doesn't include these shape types at all):

| # | Shape type | CSV file | Count |
|---|---|---|---|
| 7 | S-Shape | `S Shape.csv` | 31 |
| 8 | M-Shape | `M Shape.csv` | 8 |
| 9 | HP-Shape | `HP Shape.csv` | 15 |
| 10 | MC Channel | `MC Channel.csv` | 36 |
| 11 | B-Shape | `B Shape.csv` | 81 |
| 12 | Castellated Comp Beam | `Castellated Comp Beam.csv` | 208 |
| 13 | Castellated NonComp Beam | `Castellated NonComp Beam.csv` | 71 |

**Note:** These sections now render as **orange cylinders** with a warning banner in the info panel — the user is aware they're missing from the database.

**Options:**
- A) Extend the AISC database conversion script to include these shape types
- B) Source the missing data from another reference (AISC v15? CISC?)
- C) Build default/approximate profiles as fallback

---

## ★ P4 — Parser Completeness: Non-TABLE Section Warnings

Sections that are parsed but have no full profile — they render as cylinders with an orange warning:

| # | Issue | STAAD type | Status |
|---|---|---|---|
| 14 | **PRIS missing YD** — no depth dimension, cannot determine shape | `PRIS` (no YD) | Warned ✅ |
| 15 | **TAPERED section** — profile not available | `TAPERED` | Warned ✅ |
| 16 | **USER section** — profile not available | `USER` | Warned ✅ |

**Note:** These all set `renderWarning` and show as orange cylinders with an info-panel explanation. The warning is user-facing so they know the rendering is approximate.

---

## ★ P5 — Angle Sections with Uncommon Thicknesses

Some angle sizes exist in the STAAD CSV but not in the current AISC database (certain leg×thickness combinations). These are logged during the mapping build script. Re-run `node scripts/build-staad-mapping.mjs` to see the current list.

---

## ☆ P6 — Pipe Schedule Naming

Pipe schedule mapping is simplified: `SCH40→STD`, `SCH80→XS`, `SCH60→XS`. The AISC database uses `STD`/`XS`/`XXS` naming. A future pass could expand the database to include more schedules (XXS, SCH60, SCH100, etc.).

---

## ☆ P7 — STAAD Prefix Handling for Non-Angle Types

Currently only angle prefixes are fully handled (`ST`/`LD`/`SD`/`SA`/`RA`). Other STAAD section prefixes need to be mapped for their respective shape types:

| Prefix | Meaning | Status |
|---|---|---|
| `ST` | Single section | ✅ (all types) |
| `D` | Double section (channels, etc.) | ❌ |
| `CM` | Compound? | ❌ |
| `TUB` | Legacy tube | ✅ (via mapping) |

---

## Completed ✅

- [x] STAAD→AISC mapping (1,408 entries from CSV)
- [x] Angle arrangement detection (ST/LD/SD/SA/RA → config + section type)
- [x] Render warning system (orange members + info panel banner at bottom)
- [x] Unknown section warnings (missing from DB → orange cylinder + banner)
- [x] PRIS/TAPERED/USER missing-profile warnings (orange cylinder + banner)
- [x] Removed regex-based `steel-resolver.ts` in favor of JSON mapping
- [x] `SectionConfig` type for compound/arrangement metadata (scalable beyond angles)
- [x] ARCHITECTURE.md updated with current pipeline + contracts
