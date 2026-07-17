import { useViewStore } from '../../store/viewStore';

/**
 * Theme-aware scene lighting.
 * Light mode: bright, airy, with warm sky tint.
 * Dark mode: moody, contrasty, with cool ambient.
 */
export function Lighting() {
  const theme = useViewStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <>
      <ambientLight intensity={isDark ? 0.35 : 0.55} />
      <directionalLight position={[10, 20, 10]} intensity={isDark ? 0.7 : 0.9} />
      <directionalLight position={[-5, 5, -5]} intensity={isDark ? 0.2 : 0.25} />
      <hemisphereLight
        args={[isDark ? '#8899bb' : '#b1d0ff', isDark ? '#334455' : '#e0e0e0', isDark ? 0.15 : 0.25]}
      />
    </>
  );
}
