import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { useUIStore } from '../../store/uiStore';
import { useModelStore } from '../../store/modelStore';

/**
 * Slide-out info panel showing selected member details.
 */
export function InfoPanel() {
  const selectedMemberId = useUIStore((s) => s.selectedMemberId);
  const selectMember = useUIStore((s) => s.selectMember);
  const model = useModelStore((s) => s.model);

  if (!model || !selectedMemberId) return null;

  const member = model.members.find((m) => m.id === selectedMemberId);
  if (!member) return null;

  const startNode = model.nodes.find((n) => n.id === member.startNodeId);
  const endNode = model.nodes.find((n) => n.id === member.endNodeId);

  return (
    <AnimatePresence>
      <motion.div
        className="absolute left-4 top-24 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <GlassPanel className="p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Member {member.id}
            </h3>
            <button
              onClick={() => selectMember(null)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <InfoRow label="Type" value={member.section?.description || 'Unknown'} />
            <InfoRow label="Start Node" value={String(member.startNodeId)} />
            <InfoRow label="End Node" value={String(member.endNodeId)} />
            {startNode && endNode && (
              <InfoRow
                label="Length"
                value={`${calculateLength(startNode, endNode).toFixed(2)} m`}
              />
            )}
            {member.groupNames.length > 0 && (
              <InfoRow label="Groups" value={member.groupNames.join(', ')} />
            )}
            {member.section && (
              <>
                <InfoRow
                  label="Depth Y"
                  value={member.section.depthY ? `${member.section.depthY}m` : '—'}
                />
                <InfoRow
                  label="Depth Z"
                  value={member.section.depthZ ? `${member.section.depthZ}m` : '—'}
                />
              </>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[var(--color-text-primary)] font-mono">{value}</span>
    </div>
  );
}

function calculateLength(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}
