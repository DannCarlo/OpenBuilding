import type { StaadParseResult } from '../parser/types';
import type { ParsedModel, ModelNode, ModelMember, MemberSection, ModelSupport } from './types';

/**
 * Convert STAAD parse result into a normalized, format-independent model.
 */
export function buildModel(parsed: StaadParseResult): ParsedModel {
  // Build node lookup
  const nodeMap = new Map<number, ModelNode>();
  for (const j of parsed.joints) {
    nodeMap.set(j.id, { id: j.id, x: j.x, y: j.y, z: j.z });
  }

  // Build member property lookup (memberId → property)
  const propMap = new Map<number, MemberSection>();
  for (const prop of parsed.memberProperties) {
    const section: MemberSection = {
      type: prop.type,
      yd: prop.yd,
      zd: prop.zd,
      tableName: prop.tableName,
      description: prop.description,
    };
    for (const mid of prop.memberIds) {
      propMap.set(mid, section);
    }
  }

  // Build group lookup (memberId → group names)
  const groupMap = new Map<number, string[]>();
  for (const group of parsed.groups) {
    for (const mid of group.memberIds) {
      const existing = groupMap.get(mid) || [];
      existing.push(group.name);
      groupMap.set(mid, existing);
    }
  }

  // Build members
  const members: ModelMember[] = [];
  const warnings: string[] = [...parsed.warnings];

  for (const m of parsed.members) {
    if (!nodeMap.has(m.jointI)) {
      warnings.push(`Member ${m.id}: start joint ${m.jointI} not found`);
      continue;
    }
    if (!nodeMap.has(m.jointJ)) {
      warnings.push(`Member ${m.id}: end joint ${m.jointJ} not found`);
      continue;
    }

    members.push({
      id: m.id,
      startNodeId: m.jointI,
      endNodeId: m.jointJ,
      section: propMap.get(m.id) || null,
      groupNames: groupMap.get(m.id) || [],
    });
  }

  // Build supports (expand joint ranges to individual node IDs)
  const supports: ModelSupport[] = [];
  for (const s of parsed.supports) {
    for (const jointId of s.jointIds) {
      if (nodeMap.has(jointId)) {
        supports.push({
          nodeId: jointId,
          type: s.type === 'FIXED_BUT' ? 'FIXED' : s.type as ModelSupport['type'],
        });
      } else {
        warnings.push(`Support at joint ${jointId}: joint not found`);
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    members,
    supports,
    warnings,
  };
}
