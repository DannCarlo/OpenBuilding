import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { useUIStore } from '../../store/uiStore';
import { useModelStore } from '../../store/modelStore';

/**
 * Slide-out info panel showing selected member details.
 * Desktop: left sidebar panel.
 * Mobile: bottom sheet.
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

  const panelContent = (
    <GlassPanel className="p-5 sm:p-6 w-full sm:w-72">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Member {member.id}
        </h3>
        <button
          onClick={() => selectMember(null)}
          className="text-text-secondary hover:text-text-primary transition-colors p-1"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2.5 text-xs">
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
            <div className="w-full h-px bg-border my-1" />
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
  );

  return (
    <AnimatePresence>
      <motion.div
        key="desktop"
        className="absolute left-4 top-24 z-50 hidden sm:block"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {panelContent}
      </motion.div>
      <motion.div
        key="mobile"
        className="absolute bottom-20 left-2 right-2 z-50 sm:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {panelContent}
      </motion.div>
    </AnimatePresence>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-secondary shrink-0">{label}</span>
      <span className="text-text-primary font-mono truncate text-right">{value}</span>
    </div>
  );
}

function calculateLength(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}
