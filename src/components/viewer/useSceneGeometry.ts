import { useMemo } from 'react';
import { useModelStore } from '../../store/modelStore';
import { DEFAULT_MEMBER_RADIUS } from '../../lib/constants';
import { getMemberColor, getSupportColor, RENDER_WARNING_COLOR } from '../../lib/colors';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';
import * as THREE from 'three';
import type { SectionProfile, SectionMeta } from '../../parser/types';

export interface MemberGeometryData {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  radius: number;
  /** Cross-section polygon */
  profile?: SectionProfile;
  /** Metadata for InfoPanel display */
  meta?: SectionMeta;
  beta?: number;
  color: string;
  memberId: number;
  sectionType?: string;
  /** Warning messages when the section cannot be rendered accurately. */
  renderWarnings?: string[];
}

/**
 * Generate geometries for nodes, members, and supports from the model.
 */
export function useSceneGeometry() {
  const model = useModelStore((s) => s.model);
  const displayMode = useViewStore((s) => s.displayMode);
  const showLabels = useViewStore((s) => s.showLabels);
  const showSupports = useViewStore((s) => s.showSupports);
  const hoveredMemberId = useUIStore((s) => s.hoveredMemberId);
  const selectedMemberId = useUIStore((s) => s.selectedMemberId);

  return useMemo(() => {
    if (!model) return null;

    // Build node map for lookup
    const nodeMap = new Map(model.nodes.map((n) => [n.id, n]));

    // -- Nodes as sphere instances --
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const nodeColor = new THREE.Color('#888888');

    for (const node of model.nodes) {
      nodePositions.push(node.x, node.y, node.z);
      nodeColors.push(nodeColor.r, nodeColor.g, nodeColor.b);
    }

    // -- Members as cylinder instances --
    // For each member, compute a transformation from start→end
    const memberData: MemberGeometryData[] = [];

    for (const member of model.members) {
      const startNode = nodeMap.get(member.startNodeId);
      const endNode = nodeMap.get(member.endNodeId);
      if (!startNode || !endNode) continue;

      // Apply global offsets: member endpoint = node + offset (gap from node sphere)
      let sx = startNode.x;
      let sy = startNode.y;
      let sz = startNode.z;
      let ex = endNode.x;
      let ey = endNode.y;
      let ez = endNode.z;

      if (member.startOffset) {
        sx += member.startOffset.dx;
        sy += member.startOffset.dy;
        sz += member.startOffset.dz;
      }
      if (member.endOffset) {
        ex += member.endOffset.dx;
        ey += member.endOffset.dy;
        ez += member.endOffset.dz;
      }

      const dx = ex - sx;
      const dy = ey - sy;
      const dz = ez - sz;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length < 0.001) continue;

      // Midpoint position (using offset-adjusted coordinates)
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;
      const midZ = (sz + ez) / 2;

      // Direction vector
      const dir = new THREE.Vector3(dx, dy, dz).normalize();

      // Build rotation matrix that aligns:
      //   local Y → member direction
      //   local Z → world up (for beams) or world X (for columns)
      // This ensures depthY (local Z) is the vertical dimension for beams.
      const yAxis = dir.clone();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const zAxis = new THREE.Vector3();
      // If member is nearly vertical (column), use world X as local Z
      if (Math.abs(yAxis.dot(worldUp)) > 0.99) {
        zAxis.set(1, 0, 0);
      } else {
        zAxis.copy(worldUp);
      }
      const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
      zAxis.crossVectors(xAxis, yAxis).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      const radius = DEFAULT_MEMBER_RADIUS;

      // Color — use warning color for members with rendering limitations
      let color = getMemberColor(member.section?.type);
      const hasWarning = !!(member.section?.renderWarnings && member.section.renderWarnings.length > 0);
      if (member.id === selectedMemberId) {
        color = '#FFD700';
      } else if (member.id === hoveredMemberId) {
        color = '#66AAFF';
      } else if (hasWarning) {
        color = RENDER_WARNING_COLOR;
      }

      // Check if this is a column (mostly vertical) or beam (mostly horizontal)
      const absY = Math.abs(dir.y);
      if (absY > 0.8 && member.id !== selectedMemberId && member.id !== hoveredMemberId && !hasWarning) {
        color = '#E85D47'; // coral for columns
      }

      memberData.push({
        position: [midX, midY, midZ],
        rotation: [euler.x, euler.y, euler.z],
        length,
        radius,
        profile: member.section?.profile,
        meta: member.section?.meta,
        beta: member.beta,
        color,
        memberId: member.id,
        sectionType: member.section?.type,
        renderWarnings: member.section?.renderWarnings,
      });
    }

    // -- Supports --
    const supportData: Array<{
      position: [number, number, number];
      color: string;
      type: string;
    }> = [];

    for (const support of model.supports) {
      const node = nodeMap.get(support.nodeId);
      if (!node) continue;
      supportData.push({
        position: [node.x, node.y, node.z],
        color: getSupportColor(support.type),
        type: support.type,
      });
    }

    // -- Labels --
    const labelData: Array<{
      position: [number, number, number];
      text: string;
    }> = [];

    if (showLabels) {
      for (const node of model.nodes) {
        labelData.push({
          position: [node.x, node.y + 0.15, node.z],
          text: String(node.id),
        });
      }
    }

    return {
      nodePositions,
      nodeColors,
      memberData,
      supportData,
      labelData,
      bounds: computeBounds(model.nodes),
    };
  }, [model, displayMode, showLabels, showSupports, hoveredMemberId, selectedMemberId]);
}

function computeBounds(nodes: { x: number; y: number; z: number }[]) {
  if (nodes.length === 0) return { center: [0, 0, 0] as const, size: 1 };
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.z < minZ) minZ = n.z;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
    if (n.z > maxZ) maxZ = n.z;
  }
  const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1);
  return {
    center: [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2,
    ] as const,
    size,
  };
}
