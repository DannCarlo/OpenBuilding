/**
 * Shared bridge between the DOM axis guide (outside the Canvas) and the
 * R3F camera-sync component (inside the Canvas).
 *
 * The sync component writes transforms/attributes directly into these DOM
 * handles each frame — no React re-renders, so it stays at 60fps.
 */
export interface AxisGuideHandles {
  container: HTMLDivElement;
  lines: [SVGLineElement, SVGLineElement, SVGLineElement];
  tips: [SVGCircleElement, SVGCircleElement, SVGCircleElement];
  labels: [HTMLDivElement, HTMLDivElement, HTMLDivElement];
}

/** Module-level handle holder; the DOM component registers on mount. */
export const axisGuideHandles: { current: AxisGuideHandles | null } = { current: null };
