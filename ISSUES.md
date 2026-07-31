# TODO — Known Rendering & Data Gaps

Ranked by importance (★ = critical, ☆ = nice-to-have).

---

## ★★★ P1 — Double Angle Rendering

### Description
Double-angle sections (LD, SD, SA) are correctly parsed and classified with `SectionConfig` metadata, but the 3D renderer only draws a single L profile. The renderer needs to draw two angle shapes offset by the configured spacing and oriented per the arrangement type.

### Steps to Reproduce
1. Load a STAAD file containing `TABLE LD L20203 SP 0.005` (or SD, SA)
2. Select the member in the 3D view
3. Observe the info panel shows correct metadata (Double Angle, Style, Spacing)

### Expected Behavior
Two L profiles rendered, offset by spacing, oriented according to arrangement (long-legs-back, short-legs-back, or star).

### Actual Behavior
A single orange angle profile is rendered. The info panel shows an amber warning: "Double angle (LD) — rendering as single angle profile."

---

## ★★★ P1b — Double Channel Rendering

### Description
Double-channel sections (`D` prefix) are not yet parsed or classified. They need arrangement detection, `SectionConfig` setup, and rendering of two C profiles.

### Steps to Reproduce
1. Use a STAAD file with `TABLE D C6X8.2 SP 0.01`

### Expected Behavior
Two channel profiles rendered back-to-back with spacing.

### Actual Behavior
Prefix `D` falls through to `mapAngleArrangement` default → treated as single, or mapping miss → orange cylinder.

---

## ★★ P2 — Angle Axis Reversal (RA)

### Description
Reversed-axis single angles (`RA` prefix) store correctly (`config.arrangement = 'RA'`) but the renderer doesn't flip the profile Y-Z axes.

### Steps to Reproduce
1. Load a STAAD file containing `TABLE RA L20203`
2. Select the member and inspect the info panel

### Expected Behavior
Angle profile rendered with reversed local axes.

### Actual Behavior
Standard angle orientation is used. Info panel warning: "Reversed-axis single angle — axis orientation not applied."

---

## ★★ P3 — Missing Steel Database Shape Types

### Description
Sections present in STAAD CSV files but not in the AISC v16.0 database (`aisc-sections.json`). These render as orange cylinders with a warning banner.

### Affected Shape Types
| Shape | CSV | Count |
|---|---|---|
| S-Shape | `S Shape.csv` | 31 |
| M-Shape | `M Shape.csv` | 8 |
| HP-Shape | `HP Shape.csv` | 15 |
| MC Channel | `MC Channel.csv` | 36 |
| B-Shape | `B Shape.csv` | 81 |
| Castellated Comp Beam | `Castellated Comp Beam.csv` | 208 |
| Castellated NonComp Beam | `Castellated NonComp Beam.csv` | 71 |

### Expected Behavior
Each shape renders its correct profile polygon with proper dimensions.

### Actual Behavior
Orange cylinder with warning: "Section [name] is not in the AISC database — rendering as generic cylinder."

### Options
- A) Extend the AISC database conversion script to include these shape types
- B) Source the missing data from another reference (AISC v15? CISC?)
- C) Build default/approximate profiles as fallback

---

## ★ P4 — Non-TABLE Section Warnings

### Description
Sections parsed without a full profile (missing PRIS dimensions, TAPERED, USER types) fall back to cylinder rendering. They are correctly warned but the user should know it's approximate.

### Affected Cases
| Type | Trigger |
|---|---|
| PRIS missing YD | No depth dimension provided |
| TAPERED | Tapered sections have no built-in profile |
| USER | User-defined sections have no built-in profile |

### Actual Behavior
Orange cylinder with warning explaining the limitation.

---

## ★ P5 — Angle Sections with Uncommon Thicknesses

### Description
Some angle leg×thickness combinations exist in the STAAD CSV but not in the AISC v16.0 database. These are skipped during mapping build.

### Steps to Reproduce
Run `node scripts/build-staad-mapping.mjs` — skipped entries are listed in the summary output.

---

## ☆ P6 — Pipe Schedule Naming

### Description
Pipe schedule mapping is simplified: `SCH40→STD`, `SCH80→XS`, `SCH60→XS`. The AISC database uses `STD`/`XS`/`XXS` naming. SCH60 is approximated as XS.

### Expected Behavior
Full schedule support: XXS, SCH60, SCH100, SCH120 mapped to correct AISC entries.

---

## ☆ P7 — STAAD Prefix Handling for Non-Angle Types

### Description
Only angle prefixes are fully handled. Other section types need their own prefix → config logic.

| Prefix | Meaning | Status |
|---|---|---|
| `ST` | Single section | ✅ (all types) |
| `D` | Double section (channels, etc.) | ❌ |
| `CM` | Compound (built-up) | ❌ |
| `TUB` | Legacy tube | ✅ (via mapping) |

---

## Completed ✅

- [x] STAAD→AISC mapping (1,408 entries from CSV)
- [x] Angle arrangement detection (ST/LD/SD/SA/RA → config + section type)
- [x] `SectionConfig` type with dynamic `props[]` array (scalable beyond angles)
- [x] Render warning system (orange members + info panel banner at bottom)
- [x] Unknown/missing section fallback (orange cylinder + warning banner)
- [x] PRIS/TAPERED/USER missing-profile warnings (orange cylinder + banner)
- [x] Section label formatting: `L2-1/2X3-1/2` → `L 2-1/2 x 3-1/2`
- [x] Double-angle family display (Family: Double Angle, Style: Long Legs B2B)
- [x] Removed regex-based `steel-resolver.ts` in favor of JSON mapping
- [x] ARCHITECTURE.md kept in sync with all pipeline changes
