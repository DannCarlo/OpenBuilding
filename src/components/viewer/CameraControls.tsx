import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSceneGeometry } from './useSceneGeometry';
import { useViewStore } from '../../store/viewStore';

/**
 * Camera controls that auto-fit the model on load.
 * Respects navMode (orbit vs pan) for left-click-drag behavior.
 * Re-fits camera when fitViewTrigger increments.
 */
export function CameraControls() {
  const controlsRef = useRef<any>(null);
  const geo = useSceneGeometry();
  const camera = useThree((s) => s.camera);
  const navMode = useViewStore((s) => s.navMode);
  const fitViewTrigger = useViewStore((s) => s.fitViewTrigger);
  const lastFitRef = useRef(-1);

  // Swap mouse buttons based on navMode
  useEffect(() => {
    if (!controlsRef.current) return;
    if (navMode === 'pan') {
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
    } else {
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
    }
  }, [navMode]);

  // Auto-fit camera when geometry changes
  useFrame(() => {
    if (!controlsRef.current || !geo) return;
    // Only fit once
    if ((controlsRef.current as any)._fitted) return;
    (controlsRef.current as any)._fitted = true;
    fitCamera();
  });

  // Re-fit when fitViewTrigger changes
  useEffect(() => {
    if (fitViewTrigger <= lastFitRef.current) return;
    lastFitRef.current = fitViewTrigger;
    if (!controlsRef.current || !geo) return;
    fitCamera();
  }, [fitViewTrigger, geo]);

  function fitCamera() {
    if (!geo) return;
    const { center, size } = geo.bounds;
    const target = new THREE.Vector3(center[0], center[1], center[2]);
    controlsRef.current.target.copy(target);
    const distance = size * 1.5;
    (camera as THREE.PerspectiveCamera).position.set(
      target.x + distance * 0.8,
      target.y + distance * 0.6,
      target.z + distance
    );
    controlsRef.current.update();
  }

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={100}
      maxPolarAngle={Math.PI * 0.85}
    />
  );
}
