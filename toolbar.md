# Bottom Toolbar — Reusable Pattern

A floating, frosted-glass toolbar designed to sit above a canvas/viewport. Styled with **Tailwind CSS v4** (`@import "tailwindcss"`) and the **Inter** font family.

---

## 1. Prerequisites

```css
/* index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import "tailwindcss";

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

No `tailwind.config.js` is required — Tailwind v4 discovers classes from your source files automatically.

---

## 2. Anatomy of the Toolbar

### Outer Wrapper (positioning only)

```html
<div class="flex items-center justify-center pb-3 pt-1 px-4 select-none pointer-events-none">
```

- `pointer-events-none` — clicks pass through to the 3D viewport behind.
- Centers the toolbar horizontally above the viewport content.

### Inner Container (the actual bar)

```html
<div class="flex items-center gap-1
            bg-white/70 backdrop-blur-xl
            border border-slate-200/50
            rounded-2xl px-2 py-2
            shadow-lg shadow-slate-200/50
            pointer-events-auto">
```

| Utility | Effect |
|---|---|
| `bg-white/70` | 70% opaque white base |
| `backdrop-blur-xl` | Strong blur of content behind the bar (frosted glass) |
| `border border-slate-200/50` | 1px semi-transparent slate edge |
| `rounded-2xl` | 16px border radius — pill/lozenge shape |
| `shadow-lg shadow-slate-200/50` | Soft, tinted drop shadow |
| `pointer-events-auto` | Re-enables interaction on the bar itself |

### Section Dividers

Sections are separated by a thin 1px right border on each group:

```html
<div class="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
  <!-- group content -->
</div>
```

The last info section uses a **left** border and extra left padding instead:

```html
<div class="flex items-center gap-3 pl-3 ml-2 border-l border-slate-200">
  <!-- info content -->
</div>
```

---

## 3. Button Variants

### 3a. Tool/Mode Selector Button

Used for mutually exclusive mode switches (e.g. Select vs Orbit vs Pan).

```html
<button class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               bg-slate-900 text-white shadow-sm">
  <!-- ACTIVE state -->
</button>

<button class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               text-slate-500 hover:bg-slate-100 hover:text-slate-700">
  <!-- INACTIVE state -->
</button>
```

| State | Classes |
|---|---|
| **Active** | `bg-slate-900 text-white shadow-sm` |
| **Inactive** | `text-slate-500 hover:bg-slate-100 hover:text-slate-700` |

### 3b. Toggle Button

Used for on/off toggles (snap, grid, wireframe, X-ray, etc.).

```html
<button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               bg-blue-50 text-blue-600">
  <!-- ACTIVE (toggled on) -->
</button>

<button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               text-slate-400 hover:bg-slate-100 hover:text-slate-600">
  <!-- INACTIVE (toggled off) -->
</button>
```

| State | Classes |
|---|---|
| **Active** | `bg-blue-50 text-blue-600` |
| **Inactive** | `text-slate-400 hover:bg-slate-100 hover:text-slate-600` |

### 3c. Action Button (icon + optional label)

Used for discrete actions: reset camera, fit view, screenshot, etc.

```html
<button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               text-slate-500 hover:bg-slate-100 hover:text-slate-700">
  <!-- Default -->
</button>

<button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               text-red-500 hover:bg-red-50 hover:text-red-600">
  <!-- Danger (e.g. delete selected object) -->
</button>

<button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
               transition-all duration-150
               text-slate-300 cursor-default" disabled>
  <!-- Disabled -->
</button>
```

| Variant | Classes |
|---|---|
| **Default** | `text-slate-500 hover:bg-slate-100 hover:text-slate-700` |
| **Danger** | `text-red-500 hover:bg-red-50 hover:text-red-600` |
| **Disabled** | `text-slate-300 cursor-default` |

### 3d. Info / Status Text

```html
<span class="text-[11px] text-slate-400 tabular-nums">
  42 objects
</span>
<span class="text-[11px] text-slate-400 tabular-nums">
  75%
</span>
```

- `tabular-nums` — digits are fixed-width so numbers don't "wiggle" as they change.
- `text-[11px]` — arbitrary small size, slightly smaller than `text-xs` (12px).

---

## 4. Structure Viewer — Bottom Toolbar Plan

### 4a. What This Replaces

| Remove | Replaced By |
|---|---|
| `src/components/toolbar/ViewToolbar.tsx` | New `BottomToolbar.tsx` |
| `src/components/layout/StatusBar.tsx` | Stats section inside `BottomToolbar` |

**Kept as-is:** `TopBar` (logo + filename + open-file + theme toggle), `InfoPanel` (slide-out detail card), `UploadOverlay`.

---

### 4b. Desktop Layout (≥ 640px)

Full spread with all buttons + stats visible by default:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [↻ Orbit] [⇱ Pan] │ [◼ Solid] [◫ Wire] [◈ Semi] │ [⊞ Grid] [👁 Labels] [⚓ Support] │ [⊡ Fit] │ [📊] ●12 ●8 ●3 │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  Group 1: Nav Mode     Group 2: Display Mode          Group 3: View Toggles              Action    Stats
  (mutually exclusive,  (mutually exclusive,           (independent on/off,               (Fit      (expanded
   dark-pill active)     dark-pill active)              blue-tint active)                  View)     by default)
```

| Group | Buttons | Type | Behavior |
|---|---|---|---|
| **1 — Nav Mode** | Orbit, Pan | Mode selector | Mutually exclusive. Swaps OrbitControls mouse mapping so users without right-click can pan. Drives `viewStore.navMode`. |
| **2 — Display Mode** | Solid, Wireframe, Semi | Mode selector | Mutually exclusive. Active = `bg-slate-900 text-white`. Drives `viewStore.displayMode`. |
| **3 — View Toggles** | Grid, Labels, Supports | Toggle | Independent on/off. Active = `bg-blue-50 text-blue-600`. Drives `viewStore.showGrid / showLabels / showSupports`. |
| **4 — Action** | Fit View | Action button | Re-frames camera to enclose all geometry. Increments `viewStore.fitViewTrigger`. |
| **5 — Stats** | 📊 toggle + colored dots | Info + toggle | Expanded by default on desktop. Shows `● N ● M ● S` with colored dots + counts. Tapping 📊 collapses/expands with `AnimatePresence`. Drives `viewStore.showStats`. |

**Why Nav Mode on desktop?** Mac trackpads and some mice lack a right mouse button. OrbitControls defaults to right-click-drag for pan. Switching to Pan mode remaps left-click-drag to pan instead of orbit, making the viewer usable for everyone.

---

### 4c. Mobile Layout (< 640px)

Each action group collapses into a **labeled dropdown button**. Tapping opens a popover above the toolbar with the group's options:

```
          ┌──────────────────┐
          │ ◼ Solid          │
          │ ◫ Wireframe      │  ← popover (appears above the triggering dropdown button)
          │ ◈ Semi           │
          └──────────────────┘
               ▲
┌──────────────────────────────────────────────────────────┐
│ [🎯 3D ▾] │ [👁 View ▾] │ [🔧 Util ▾] │ [⊡ Fit] │ [📊] │
└──────────────────────────────────────────────────────────┘
```

| Dropdown | Opens | Today | Future |
|---|---|---|---|
| **🎯 3D** | Orbit, Pan, ~~Select~~, ~~Snap~~ | Orbit + Pan active. Select/Snap disabled placeholder. | Selection mode, snap-to-grid |
| **👁 View** | Solid, Wireframe, Semi | All three active — same as desktop group 1 | — |
| **🔧 Util** | Grid on/off, Labels on/off, Supports on/off | All three active — same as desktop group 2 | Axes toggle, measurement toggle |
| **⊡ Fit** | *(direct action, no dropdown)* | Re-frames camera immediately | — |
| **📊** | *(toggles stats inline)* | Collapsed by default on mobile; tap to reveal counts | — |

**Dropdown behavior:**
- Only one dropdown open at a time (tapping another closes the current one).
- Tapping the same dropdown again, or tapping outside, closes it.
- Tapping an option inside the popover applies the action AND closes the popover.
- Uses `framer-motion` `AnimatePresence` for enter/exit animation (fade + slide up, 150ms).

**Why dropdowns instead of icon-only buttons?**
- On mobile (~375px wide), even icon-only buttons get cramped past 5-6 items.
- Named dropdowns tell the user WHAT each group does ("View" is clearer than three mystery icons).
- Scales well: adding a new toggle just adds a row in the relevant dropdown.

---

### 4d. Stats Section (both desktop & mobile)

Compact inline stats displayed as colored dots + counts:

```
● 12 Nodes  ● 8 Members  ● 3 Supports
```

- Each dot is a 2.5×2.5 rounded-full `<div>` with the stat's theme color.
- Numbers use `font-mono tabular-nums` so digits don't wiggle.
- Desktop: visible by default, collapsed via 📊 toggle.
- Mobile: collapsed by default, expanded via 📊 toggle.
- Toggle state persisted in `viewStore.showStats`.
- Animation: `AnimatePresence` with `layout` prop for smooth width transition.

**Color mapping:**

| Stat | Color |
|---|---|
| Nodes | `#4A90D9` (blue) |
| Members | `#E85D47` (coral) |
| Supports | `#50C878` (green) |
| Plates (if > 0) | `#9B59B6` (purple) |

---

### 4e. New Store State

Additions to `src/store/viewStore.ts`:

```ts
export type NavMode = 'orbit' | 'pan';

interface ViewState {
  // … existing state …

  /** Which mouse action is mapped to left-click-drag */
  navMode: NavMode;

  /** Whether the stats section is expanded in the toolbar */
  showStats: boolean;

  /** Incremented to trigger a camera re-fit in CameraControls */
  fitViewTrigger: number;

  // … existing actions …

  setNavMode: (mode: NavMode) => void;
  toggleStats: () => void;
  triggerFitView: () => void;
}
```

**`navMode` behavior in `CameraControls.tsx`:**
- `'orbit'` → `OrbitControls.mouseButtons = { LEFT: ROTATE, MIDDLE: DOLLY, RIGHT: PAN }` (default)
- `'pan'` → `OrbitControls.mouseButtons = { LEFT: PAN, MIDDLE: DOLLY, RIGHT: ROTATE }` (left-drag pans)

---

### 4f. Component Tree (Simplified)

Only **2 new files**. Groups are rendered inline — no unnecessary abstractions.

```
src/components/toolbar/BottomToolbar.tsx   ← NEW (~180 lines, all groups inline)
├── Inline JSX: Nav Mode group             ← .map() over [Orbit, Pan], 6 lines
├── Inline JSX: Display Mode group         ← .map() over [Solid, Wire, Semi], 6 lines
├── Inline JSX: View Toggles group         ← .map() over [Grid, Labels, Supports], 6 lines
├── Inline JSX: Fit View button            ← single <button>, 4 lines
├── Inline JSX: Stats section              ← colored dots + counts, 12 lines
└── <Popover> (mobile only)                ← wraps each dropdown group

src/components/ui/Popover.tsx              ← NEW (~40 lines, reusable popover utility)
src/store/viewStore.ts                     ← MODIFIED: +navMode, +showStats, +fitViewTrigger
src/components/viewer/CameraControls.tsx   ← MODIFIED: subscribe to navMode + fitViewTrigger
src/App.tsx                                ← MODIFIED: swap imports
src/components/toolbar/ViewToolbar.tsx     ← DELETED
src/components/layout/StatusBar.tsx        ← DELETED
```

**Why no `ToolbarButton` / `ModeSelectorGroup` / `ToggleGroup` / `StatsInline`?**
- Each "group" is just `.map()` over an array of 2–3 items → 6 lines of JSX. Extracting to a component adds more boilerplate (interface, exports, imports) than it saves.
- Button styling comes directly from the design tokens in section 6 — a short `className` string. No component needed.
- The only genuinely reusable piece is the mobile `<Popover>`, which wraps any dropdown group in a button + animated popover.

---

### 4g. The One Reusable Piece: `Popover`

The only sub-component worth extracting. Used by every mobile dropdown group.

```ts
// src/components/ui/Popover.tsx

interface PopoverProps {
  label: string;             // e.g. "View", "3D"
  icon: React.ReactNode;     // icon for the trigger button
  children: React.ReactNode; // popover content
}

export function Popover({ label, icon, children }: PopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
                   text-slate-500 hover:bg-slate-100 hover:text-slate-700
                   transition-all duration-150"
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={10} className={open ? 'rotate-180' : ''} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            {/* Click-outside backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50
                         bg-white/90 backdrop-blur-xl border border-slate-200/50
                         rounded-2xl shadow-lg shadow-slate-200/50 p-1.5 min-w-[140px]"
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Usage in `BottomToolbar` (mobile):**
```tsx
<Popover label="View" icon={<Eye size={14} />}>
  <button onClick={...} className={...}>◼ Solid</button>
  <button onClick={...} className={...}>◫ Wireframe</button>
  <button onClick={...} className={...}>◈ Semi</button>
</Popover>
```

Everything else — mode selectors, toggles, stats — is rendered directly as `<button>` and `<span>` elements in `BottomToolbar.tsx` using the Tailwind classes from the design tokens (section 6). No intermediate abstractions.

---

## 5. Implementation Order

| Step | File(s) | Description |
|---|---|---|
| **1** | `viewStore.ts` | Add `navMode` (default `'orbit'`), `showStats` (default `true`), `fitViewTrigger` (default `0`), `setNavMode()`, `toggleStats()`, `triggerFitView()` |
| **2** | `CameraControls.tsx` | Subscribe to `navMode` (swap OrbitControls mouseButtons) and `fitViewTrigger` (re-run `fitCameraToScene()`) |
| **3** | `BottomToolbar.tsx` | Build the full component with desktop + mobile layouts |
| **4** | `App.tsx` | Replace `ViewToolbar` + `StatusBar` imports with `BottomToolbar` |
| **5** | *(cleanup)* | Delete `ViewToolbar.tsx`, `StatusBar.tsx` |
| **6** | *(verify)* | Test on desktop + mobile viewports, light + dark themes |

---

## 6. Summary of Key Design Tokens

*(Same tokens as the original toolbar.md pattern — applied everywhere)*

| Token | Value |
|---|---|
| Background | `bg-white/70` (70% white) |
| Blur | `backdrop-blur-xl` |
| Border | `border-slate-200/50` |
| Radius | `rounded-2xl` (16px) |
| Shadow | `shadow-lg shadow-slate-200/50` |
| Active (mode selector) | `bg-slate-900 text-white shadow-sm` |
| Inactive (mode selector) | `text-slate-500 hover:bg-slate-100 hover:text-slate-700` |
| Active (toggle) | `bg-blue-50 text-blue-600` |
| Inactive (toggle) | `text-slate-400 hover:bg-slate-100 hover:text-slate-600` |
| Default (action) | `text-slate-500 hover:bg-slate-100 hover:text-slate-700` |
| Danger (action) | `text-red-500 hover:bg-red-50 hover:text-red-600` |
| Disabled | `text-slate-300 cursor-default` |
| Font | Inter, 12px (`text-xs`), `font-medium` |
| Stats font | 11px (`text-[11px]`), `font-mono tabular-nums` |
| Transition | `transition-all duration-150` |
| Popover animation | `framer-motion` fade + slide-up, 150ms |

---

## 7. Future Additions (not in scope now)

When these features are built, add them to the toolbar:

| Feature | Where it goes | Button style |
|---|---|---|
| **Select mode** (disable orbit on click, cursor → crosshair, click-to-select only) | Desktop: Group 1 (new mode button). Mobile: 🎯 3D dropdown. | Mode selector |
| **Axes gizmo** toggle | Desktop: Group 3. Mobile: 🔧 Util dropdown. | Toggle |
| **Screenshot / Export PNG** | Desktop: Group 4. Mobile: new action button. | Action |
| **Delete selected** | Desktop: Group 4. Mobile: new action button. | Action (danger) |
| **Undo / Redo** | Desktop: Group 4. Mobile: 🎯 3D dropdown. | Action |
| **Measurement tool** | Desktop: Group 4. Mobile: 🎯 3D dropdown. | Toggle |
| **FPS counter** | Stats section | Info text |
