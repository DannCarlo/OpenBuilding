import { useModelStore } from '../../store/modelStore';

/**
 * Small badge in the lower-left viewport showing the model's unit system.
 * Future: will become a toggleable unit selector.
 */
export function UnitsBadge() {
  const units = useModelStore((s) => s.model?.units);

  if (!units) return null;

  return (
    <div className="absolute bottom-15 xl:bottom-4 left-4 z-40 pointer-events-none">
      <span className="inline-block rounded-md bg-black/40 dark:bg-white/10 backdrop-blur-sm px-2.5 py-1 text-[11px] font-mono text-white/80 dark:text-white/70 tracking-wide">
        {units.length} | {units.force}
      </span>
    </div>
  );
}
