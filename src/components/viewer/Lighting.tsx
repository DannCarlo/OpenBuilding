import { useViewStore } from '../../store/viewStore';

/**
 * Scene lighting setup.
 */
export function Lighting() {
  const theme = useViewStore((s) => s.theme);

  const ambientIntensity = theme === 'dark' ? 0.4 : 0.6;
  const directionalIntensity = theme === 'dark' ? 0.8 : 1.0;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={directionalIntensity}
        castShadow={false}
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={directionalIntensity * 0.3}
      />
      <hemisphereLight
        args={['#ffffff', '#444444', 0.2]}
      />
    </>
  );
}
