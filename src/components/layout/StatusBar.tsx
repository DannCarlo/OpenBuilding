import { useModelStore } from '../../store/modelStore';
import { GlassPanel } from '../ui/GlassPanel';

/**
 * Bottom status bar showing model statistics.
 * On desktop: full labels + counts.
 * On mobile: compact dots + counts only.
 */
export function StatusBar() {
  const model = useModelStore((s) => s.model);

  if (!model) return null;

  const nodeCount = model.nodes.length;
  const memberCount = model.members.length;
  const supportCount = model.supports.length;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
      <GlassPanel className="px-5 sm:px-6 py-3 flex items-center justify-center gap-5 sm:gap-7 text-xs">
        {/* Desktop: full labels */}
        <span className="hidden sm:contents">
          <StatItem label="Nodes" value={nodeCount} color="#4A90D9" />
          <div className="w-px h-4 bg-[var(--color-border)]" />
          <StatItem label="Members" value={memberCount} color="#E85D47" />
          <div className="w-px h-4 bg-[var(--color-border)]" />
          <StatItem label="Supports" value={supportCount} color="#50C878" />
        </span>
        {/* Mobile: dots only */}
        <span className="contents sm:hidden">
          <DotStat color="#4A90D9" value={nodeCount} />
          <DotStat color="#E85D47" value={memberCount} />
          <DotStat color="#50C878" value={supportCount} />
        </span>
        {model.warnings.length > 0 && (
          <>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <span className="text-amber-500 text-xs">⚠ {model.warnings.length}</span>
          </>
        )}
      </GlassPanel>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[var(--color-text-primary)] font-mono font-semibold">{value}</span>
    </div>
  );
}

function DotStat({ color, value }: { color: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[var(--color-text-primary)] font-mono font-semibold text-sm">{value}</span>
    </div>
  );
}
