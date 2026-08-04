import { useEffect, useRef } from 'react';
import { axisGuideHandles } from './axisGuideBridge';

/**
 * Gray 3D axis indicator shown in the lower-left viewport, beside the units
 * badge. Renders as an SVG tripod; the R3F `AxisGuideSync` component projects
 * the world axes into screen space and writes the transforms each frame.
 *
 * Convention (Z-up): X and Y are the planar/horizontal axes, Z is vertical.
 *   guide X = model X
 *   guide Y = model Z   (horizontal)
 *   guide Z = model Y   (vertical / up)
 */
export function AxisGuide() {
  const containerRef = useRef<HTMLDivElement>(null);

  const lineX = useRef<SVGLineElement>(null);
  const lineY = useRef<SVGLineElement>(null);
  const lineZ = useRef<SVGLineElement>(null);
  const tipX = useRef<SVGCircleElement>(null);
  const tipY = useRef<SVGCircleElement>(null);
  const tipZ = useRef<SVGCircleElement>(null);
  const labelX = useRef<HTMLDivElement>(null);
  const labelY = useRef<HTMLDivElement>(null);
  const labelZ = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !lineX.current || !lineY.current || !lineZ.current) return;
    if (!tipX.current || !tipY.current || !tipZ.current) return;
    if (!labelX.current || !labelY.current || !labelZ.current) return;

    axisGuideHandles.current = {
      container: containerRef.current,
      lines: [lineX.current, lineY.current, lineZ.current],
      tips: [tipX.current, tipY.current, tipZ.current],
      labels: [labelX.current, labelY.current, labelZ.current],
    };
    return () => {
      axisGuideHandles.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-15 xl:bottom-4 left-4 z-40 w-16 h-16 xl:w-20 xl:h-20 pointer-events-none select-none"
    >
      {/* Tripod lines + tips (gray) */}
      <svg viewBox="-50 -50 100 100" className="w-full h-full overflow-visible">
        <line ref={lineX} x1={0} y1={0} x2={0} y2={0} stroke="#a2a2aa" strokeWidth={2.5} strokeLinecap="round" />
        <line ref={lineY} x1={0} y1={0} x2={0} y2={0} stroke="#b6b6be" strokeWidth={2.5} strokeLinecap="round" />
        <line ref={lineZ} x1={0} y1={0} x2={0} y2={0} stroke="#8d8d95" strokeWidth={2.5} strokeLinecap="round" />
        <circle ref={tipX} cx={0} cy={0} r={3} fill="#a2a2aa" />
        <circle ref={tipY} cx={0} cy={0} r={3} fill="#b6b6be" />
        <circle ref={tipZ} cx={0} cy={0} r={3} fill="#8d8d95" />
      </svg>

      {/* Axis labels (anchored at center, positioned per-frame) */}
      <div ref={labelX} className="absolute left-1/2 top-1/2 text-[10px] font-semibold text-text-secondary">X</div>
      <div ref={labelY} className="absolute left-1/2 top-1/2 text-[10px] font-semibold text-text-secondary">Y</div>
      <div ref={labelZ} className="absolute left-1/2 top-1/2 text-[10px] font-semibold text-text-secondary">Z</div>
    </div>
  );
}
