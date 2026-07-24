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

## 4. Suggested Actions for a 3D Viewer

Here is a toolbar layout tailored for a 3D model/scene viewer, grouped logically:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Orbit] [Pan] [Select] │ [Wireframe] [X-Ray] [Grid] [Axes] │ [Fit] [↩] [↪] │ [⌫] │  12 objects  85% │
└─────────────────────────────────────────────────────────────────────────┘
```

### Group 1 — Navigation Mode (mutually exclusive)

| Button | Icon | Purpose |
|---|---|---|
| **Orbit** | ↻ | Rotate camera around pivot (default mode) |
| **Pan** | ⇱ | Pan/translate camera in view plane |
| **Select** | ⊹ | Click to select objects in the scene |

### Group 2 — View Toggles (independently toggleable)

| Button | Icon | Purpose |
|---|---|---|
| **Wireframe** | ◫ | Toggle wireframe / solid rendering |
| **X-Ray** | ◈ | Toggle semi-transparent X-ray mode |
| **Grid** | ⊞ | Show/hide reference grid plane |
| **Axes** | ⊕ | Show/hide XYZ axes gizmo |

### Group 3 — Camera Actions

| Button | Icon | Purpose | Shortcut |
|---|---|---|---|
| **Fit View** | ⊡ | Frame all objects / selected object in viewport | `F` |
| **Reset Cam** | ↩ | Reset camera to default position | `Ctrl+0` |
| **Screenshot** | ◻ | Capture viewport as PNG | `Ctrl+S` |

### Group 4 — Object Actions

| Button | Icon | Purpose | Shortcut |
|---|---|---|---|
| **Delete** | ⌫ | Delete selected object(s) | `Del` |
| **Focus** | ◎ | Zoom to selected object | `F` (when selected) |
| **Isolate** | ◉ | Hide all except selected | `I` |

### Group 5 — Info

| Display | Example |
|---|---|
| Object count | `12 objects` |
| Triangle count | `45.2k tris` |
| Zoom level | `85%` |
| FPS | `60 fps` |

---

## 5. Suggested 3D Viewer Toolbar Component

Here is a complete React + Tailwind implementation with the actions above, adapted from the original BottomToolbar pattern:

```tsx
// ViewportToolbar.tsx

interface ViewportToolbarProps {
  onDelete: () => void;
  onFitView: () => void;
  onResetCamera: () => void;
  canDelete: boolean;
  objectCount: number;
  triCount: string;   // e.g. "45.2k"
  zoomPercent: number; // e.g. 85
}

type ViewMode = 'orbit' | 'pan' | 'select';

const viewModes: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'orbit',  label: 'Orbit',  icon: '↻' },
  { id: 'pan',    label: 'Pan',    icon: '⇱' },
  { id: 'select', label: 'Select', icon: '⊹' },
];

export function ViewportToolbar({
  onDelete, onFitView, onResetCamera,
  canDelete, objectCount, triCount, zoomPercent,
}: ViewportToolbarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [wireframe, setWireframe] = useState(false);
  const [xray, setXray] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [axesVisible, setAxesVisible] = useState(true);

  return (
    <div className="flex items-center justify-center pb-3 pt-1 px-4 select-none pointer-events-none">
      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-2 py-2 shadow-lg shadow-slate-200/50 pointer-events-auto">

        {/* ── Group 1: Navigation Mode ── */}
        <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                transition-all duration-150
                ${viewMode === mode.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
              title={mode.label}
            >
              <span className="text-sm leading-none">{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* ── Group 2: View Toggles ── */}
        <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
          <Toggle icon="◫" label="Wire"   active={wireframe}   onClick={() => setWireframe(!wireframe)} />
          <Toggle icon="◈" label="X-Ray"  active={xray}        onClick={() => setXray(!xray)}         />
          <Toggle icon="⊞" label="Grid"   active={gridVisible}  onClick={() => setGridVisible(!gridVisible)} />
          <Toggle icon="⊕" label="Axes"   active={axesVisible}  onClick={() => setAxesVisible(!axesVisible)} />
        </div>

        {/* ── Group 3: Camera Actions ── */}
        <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-slate-200">
          <Action icon="⊡" label="Fit"     shortcut="F"       onClick={onFitView}      />
          <Action icon="↩" label="Reset"   shortcut="Ctrl+0"  onClick={onResetCamera}   />
          <Action icon="◻" label="Capture" shortcut="Ctrl+S"  onClick={() => {}}        />
        </div>

        {/* ── Group 4: Object Actions ── */}
        <div className="flex items-center gap-0.5">
          <Action icon="⌫" label="Delete" shortcut="Del" onClick={onDelete} disabled={!canDelete} danger />
        </div>

        {/* ── Group 5: Info ── */}
        <div className="flex items-center gap-3 pl-3 ml-2 border-l border-slate-200">
          <span className="text-[11px] text-slate-400 tabular-nums">{objectCount} objects</span>
          <span className="text-[11px] text-slate-400 tabular-nums">{triCount} tris</span>
          <span className="text-[11px] text-slate-400 tabular-nums">{zoomPercent}%</span>
        </div>

      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */

function Toggle({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
        transition-all duration-150
        ${active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Action({ icon, label, shortcut, onClick, disabled, danger }: {
  icon: string; label: string; shortcut: string;
  onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${label} (${shortcut})`}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
        transition-all duration-150
        ${danger && !disabled
          ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
          : disabled
            ? 'text-slate-300 cursor-default'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
```

---

## 6. Responsive Plan for Smaller Viewports

The toolbar is inherently **horizontal** and can overflow on narrow screens (≤ 640px). Here is a multi-tier strategy:

### Tier 1 — Label Collapse (`sm:` breakpoint, ≥ 640px)

Already built in via `hidden sm:inline` on all button labels:

| Width | Behavior |
|---|---|
| **< 640px** | Only icons are visible — buttons shrink to icon-only squares |
| **≥ 640px** | Icon + text label shown |

Result: the toolbar roughly halves in width on phones.

### Tier 2 — Info Truncation (`md:` breakpoint)

On very small screens, reduce or hide the info section:

```html
<span className="hidden md:inline text-[11px] text-slate-400 tabular-nums">
  {objectCount} objects
</span>
```

Only the most critical info (e.g. zoom %) stays visible below `md`.

### Tier 3 — Overflow Scroll (fallback for < 400px)

If the toolbar still overflows, wrap the inner container with horizontal scrolling:

```html
<div class="max-w-[100vw] overflow-x-auto">
  <div class="flex items-center gap-1 ... whitespace-nowrap">
    <!-- toolbar content -->
  </div>
</div>
```

Hide the scrollbar visually for a clean look:

```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

### Tier 4 — Collapsible Groups (extreme case, optional)

Use a "more" dropdown (⋮) to hide low-priority actions behind a menu:

```tsx
// A "More" button that reveals a small popover with hidden actions
<button className="..." onClick={() => setMenuOpen(!open)}>
  <span>⋮</span>
</button>
{open && (
  <div className="absolute bottom-full mb-2 bg-white rounded-xl shadow-lg ...">
    {/* overflow actions */}
  </div>
)}
```

### Tier 5 — Alternative: Split into Top + Bottom bars

For very feature-rich 3D viewers, consider two toolbars:

| Position | Content |
|---|---|
| **Top bar** | File operations, view modes, undo/redo |
| **Bottom bar (this pattern)** | View toggles, info, zoom controls |

This splits the button count across two rows, each remaining narrow enough for mobile.

### Responsive Priority Order

1. **Always visible** (highest priority): navigation mode buttons (orbit/pan/select), delete
2. **Collapse to icon-only** at `sm` breakpoint: all labels
3. **Hide** at `md` breakpoint: verbose info text (keep zoom % or object count only)
4. **Overflow scroll** as last resort: prevent breaking layout on tiny screens

---

## 7. Summary of Key Design Tokens

| Token | Value |
|---|---|
| Background | `bg-white/70` (70% white) |
| Blur | `backdrop-blur-xl` |
| Border | `border-slate-200/50` |
| Radius | `rounded-2xl` (16px) |
| Shadow | `shadow-lg shadow-slate-200/50` |
| Active (tool) | `bg-slate-900 text-white` |
| Active (toggle) | `bg-blue-50 text-blue-600` |
| Inactive (tool) | `text-slate-500` |
| Inactive (toggle) | `text-slate-400` |
| Hover bg | `bg-slate-100` |
| Danger | `text-red-500` |
| Disabled | `text-slate-300` |
| Font | Inter, 11px–14px, `font-medium` |
| Transition | `transition-all duration-150` |
