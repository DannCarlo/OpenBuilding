import type { BaseParseResult } from '../parser/types';
import type { ParsedModel, ModelNode, ModelMember, ModelSupport } from './types';

/**
 * Assemble a format-agnostic ParsedModel from a BaseParseResult.
 * All format-specific translation is done by the parser —
 * this function is pure assembly with no knowledge of STAAD/ETABS/SAP2000.
 */
export function buildModel(parsed: BaseParseResult): ParsedModel {
  // Build node lookup
  const nodeMap = new Map<number, ModelNode>();
  for (const n of parsed.nodes) {
    nodeMap.set(n.id, { id: n.id, x: n.x, y: n.y, z: n.z });
  }

  // Members: already normalized by parser, just validate connectivity
  const members: ModelMember[] = [];
  const warnings = [...parsed.warnings];

  for (const m of parsed.members) {
    if (!nodeMap.has(m.startNodeId)) {
      warnings.push(`Member ${m.id}: start node ${m.startNodeId} not found`);
      continue;
    }
    if (!nodeMap.has(m.endNodeId)) {
      warnings.push(`Member ${m.id}: end node ${m.endNodeId} not found`);
      continue;
    }

    members.push({
      id: m.id,
      startNodeId: m.startNodeId,
      endNodeId: m.endNodeId,
      section: m.section ? { ...m.section } : null,
      groupNames: m.groupNames,
      beta: m.beta,
      startOffset: m.startOffset,
      endOffset: m.endOffset,
    });
  }

  // Supports: already expanded and normalized by parser
  const supports: ModelSupport[] = parsed.supports.map(s => ({
    nodeId: s.nodeId,
    type: s.type,
  }));

  return {
    nodes: Array.from(nodeMap.values()),
    members,
    plates: parsed.plates.map(p => ({ ...p })),
    supports,
    warnings,
  };
}
