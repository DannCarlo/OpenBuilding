import { useMemo } from 'react';
import { useModelStore } from '../../store/modelStore';
import { DEFAULT_MEMBER_RADIUS } from '../../lib/constants';
import { getMemberColor, getSupportColor } from '../../lib/colors';
import { useViewStore } from '../../store/viewStore';
import { useUIStore } from '../../store/uiStore';
import * as THREE from 'three';

export interface MemberGeometryData {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  radius: number;
  depthY?: number;
  depthZ?: number;
  depthYB?: number;
  depthZB?: number;
  sectionType?: string;
  beta?: number;
  color: string;
  memberId: number;
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
      const start = nodeMap.get(member.startNodeId);
      const end = nodeMap.get(member.endNodeId);
      if (!start || !end) continue;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dz = end.z - start.z;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length < 0.001) continue;

      // Midpoint position
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const midZ = (start.z + end.z) / 2;

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

      // Section size (default or from property)
      let radius = DEFAULT_MEMBER_RADIUS;
      let depthY: number | undefined;
      let depthZ: number | undefined;
      let depthYB: number | undefined;
      let depthZB: number | undefined;

      if (member.section?.depthY) {
        depthY = member.section.depthY;
        depthYB = member.section.depthYB;
        depthZB = member.section.depthZB;
        if (member.section.depthZ) {
          // Rectangular, trapezoidal, or T-shape — use outer YD×ZD for box
          depthZ = member.section.depthZ;
          radius = Math.max((depthY + depthZ) / 4, 0.02);
        } else {
          // Circular: YD only (diameter)
          radius = depthY / 2;
        }
      }

      // Color
      let color = getMemberColor(member.section?.type);
      if (member.id === selectedMemberId) {
        color = '#FFD700';
      } else if (member.id === hoveredMemberId) {
        color = '#66AAFF';
      }

      // Check if this is a column (mostly vertical) or beam (mostly horizontal)
      const absY = Math.abs(dir.y);
      if (absY > 0.8 && member.id !== selectedMemberId && member.id !== hoveredMemberId) {
        color = '#E85D47'; // coral for columns
      }

      memberData.push({
        position: [midX, midY, midZ],
        rotation: [euler.x, euler.y, euler.z],
        length,
        radius,
        depthY,
        depthZ,
        depthYB,
        depthZB,
        sectionType: member.section?.type,
        beta: member.beta,
        color,
        memberId: member.id,
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
