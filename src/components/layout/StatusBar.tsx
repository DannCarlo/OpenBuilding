import { useModelStore } from '../../store/modelStore';
import { GlassPanel } from '../ui/GlassPanel';

/**
 * Bottom status bar showing model statistics.
 */
export function StatusBar() {
  const model = useModelStore((s) => s.model);

  if (!model) return null;

  const nodeCount = model.nodes.length;
  const memberCount = model.members.length;
  const supportCount = model.supports.length;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      <GlassPanel className="px-4 py-2 flex items-center gap-5 text-xs">
        <StatItem label="Nodes" value={nodeCount} color="#4A90D9" />
        <div className="w-px h-4 bg-[var(--color-border)]" />
        <StatItem label="Members" value={memberCount} color="#E85D47" />
        <div className="w-px h-4 bg-[var(--color-border)]" />
        <StatItem label="Supports" value={supportCount} color="#50C878" />
        {model.warnings.length > 0 && (
          <>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <span className="text-amber-400">⚠ {model.warnings.length} warnings</span>
          </>
        )}
      </GlassPanel>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[var(--color-text-primary)] font-mono font-medium">{value}</span>
    </div>
  );
}
