import * as THREE from 'three';
import type { SectionProfile } from '../parser/types';

/**
 * Build an extruded 3D mesh from a SectionProfile (outer boundary + optional holes).
 * This is the unified geometry builder — all section shapes flow through this function.
 */
export function buildExtrudedProfile(profile: SectionProfile, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(profile.outer[0][0], profile.outer[0][1]);
  for (let i = 1; i < profile.outer.length; i++) {
    shape.lineTo(profile.outer[i][0], profile.outer[i][1]);
  }
  shape.closePath();

  // Holes: pipe bore, HSS cavity, box section void, etc.
  for (const hole of profile.holes ?? []) {
    const h = new THREE.Path();
    h.moveTo(hole[0][0], hole[0][1]);
    for (let i = 1; i < hole.length; i++) {
      h.lineTo(hole[i][0], hole[i][1]);
    }
    h.closePath();
    shape.holes.push(h);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: length, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -length / 2, 0);
  return geo;
}
