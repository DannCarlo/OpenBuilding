import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { useUIStore } from '../../store/uiStore';
import { useModelStore } from '../../store/modelStore';
import type { SectionConfigProp } from '../../parser/types';

/**
 * Format a dimension for display.
 *   ≥ 1 m  → "3.50 m"
 *   < 1 m  → "50.8 mm"
 *   null   → "—"
 */
function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1) return `${v.toFixed(2)} m`;
  return `${(v * 1000).toFixed(1)} mm`;
}

/** Format a config prop using its unit hint (defaults to mm since config values are small). */
function fmtConfigProp(p: SectionConfigProp): string {
  const unit = p.unit ?? 'mm';
  if (unit === 'mm') return `${(p.value * 1000).toFixed(1)} mm`;
  if (unit === 'm') return `${p.value.toFixed(3)} m`;
  return `${p.value.toFixed(3)} ${unit}`;
}

/**
 * Format a steel section label for readability:
 *   "L2-1/2X3-1/2X3-1/8" → "L 2-1/2 x 3-1/2 x 3-1/8"
 *   "W12X26"              → "W 12 x 26"
 *   "HSS20X12X5/8"        → "HSS 20 x 12 x 5/8"
 *   "Pipe4STD"            → "Pipe 4 STD"
 */
function fmtSectionLabel(raw: string): string {
  let s = raw
    // Space after letter prefix: "W12" → "W 12", "HSS20" → "HSS 20"
    .replace(/^([A-Za-z]+)(\d)/, '$1 $2')
    // Space around X separators: "12X26" → "12 x 26"
    .replace(/(\S)([Xx×])(\S)/g, '$1 $2 $3')
    // Lowercase the x for readability
    .replace(/ [Xx] /g, ' × ')
    // Space before pipe schedule: "Pipe4STD" → "Pipe 4 STD"
    .replace(/(\d)(STD|XS|XXS)$/, '$1 $2');
  return s;
}

/**
 * Slide-out info panel showing selected member or plate details.
 * Desktop: left sidebar panel.
 * Mobile: bottom sheet.
 */
export function InfoPanel() {
  const selectedMemberId = useUIStore((s) => s.selectedMemberId);
  const selectedPlateId = useUIStore((s) => s.selectedPlateId);
  const selectMember = useUIStore((s) => s.selectMember);
  const selectPlate = useUIStore((s) => s.selectPlate);
  const model = useModelStore((s) => s.model);

  if (!model) return null;

  // Show element info if a plate is selected
  if (selectedPlateId != null) {
    const plate = model.plates.find(p => p.id === selectedPlateId);
    if (!plate) return null;
    const avgThick = plate.thicknesses.length > 0
      ? plate.thicknesses.reduce((a, b) => a + b, 0) / plate.thicknesses.length
      : null;

    const panelContent = (
      <GlassPanel className="p-5 sm:p-6 w-full sm:w-72">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Plate {plate.id}</h3>
          <button onClick={() => selectPlate(null)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-2.5 text-xs">
          <InfoRow label="Type" value={plate.nodeIds.length === 4 ? 'Quad Shell' : 'Tri Plate'} />
          <InfoRow label="Nodes" value={plate.nodeIds.join(', ')} />
          <InfoRow label="Avg Thickness" value={fmt(avgThick)} />
          {plate.thicknesses.length > 0 && (
            <InfoRow label="Node Thicknesses" value={plate.thicknesses.map(t => fmt(t)).join(', ')} />
          )}
        </div>
      </GlassPanel>
    );

    return renderPanel(panelContent);
  }

  if (!selectedMemberId) return null;

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
        <InfoRow label="Type" value={fmtSectionLabel(member.section?.description || 'Unknown')} />
        <InfoRow label="Start Node" value={String(member.startNodeId)} />
        <InfoRow label="End Node" value={String(member.endNodeId)} />
        {startNode && endNode && (
          <InfoRow
            label="Length"
            value={fmt(calculateLength(startNode, endNode))}
          />
        )}
        {member.groupNames.length > 0 && (
          <InfoRow label="Groups" value={member.groupNames.join(', ')} />
        )}
        {member.beta != null && (
          <InfoRow label="Beta Angle" value={`${member.beta}°`} />
        )}

        {member.section && (
          <>
            <div className="w-full h-px bg-border my-1" />
            {member.section.meta ? (
              <>
                <InfoRow label="Section" value={fmtSectionLabel(member.section.meta.label)} />
                <InfoRow label="Family" value={member.section.meta.family} />
                {member.section.meta.dims.map(d => (
                  <InfoRow key={d.name} label={d.name} value={fmt(d.value)} />
                ))}
                {member.section.meta.area != null && (
                  <InfoRow label="Area" value={`${(member.section.meta.area * 1e6).toFixed(1)} mm²`} />
                )}
                {/* ── SectionConfig extras (dynamic, like dims) ─── */}
                {member.section.config?.label && (
                  <InfoRow label="Style" value={member.section.config.label} />
                )}
                {member.section.config?.props.map(p => (
                  <InfoRow key={p.name} label={p.name} value={fmtConfigProp(p)} />
                ))}
              </>
            ) : (
              <InfoRow label="Type" value={member.section.description || 'Unknown'} />
            )}
          </>
        )}

        {/* ── Render warning — supplementary, shown at bottom ── */}
        {member.section?.renderWarning && (
          <div className="mt-2 rounded-md bg-amber-500/15 border border-amber-500/40 px-3 py-2">
            <p className="text-amber-700 text-xs leading-relaxed">
              ⚠ {member.section.renderWarning}
            </p>
          </div>
        )}
      </div>
    </GlassPanel>
  );

  return renderPanel(panelContent);
}

function renderPanel(content: React.ReactNode) {
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
        {content}
      </motion.div>
      <motion.div
        key="mobile"
        className="absolute bottom-20 left-2 right-2 z-50 sm:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {content}
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
