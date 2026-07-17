import { Text } from '@react-three/drei';
import { useSceneGeometry } from './useSceneGeometry';

/**
 * Renders node ID labels in 3D space.
 */
export function Labels() {
  const geo = useSceneGeometry();

  if (!geo || geo.labelData.length === 0) return null;

  return (
    <group>
      {geo.labelData.map((l, i) => (
        <Text
          key={i}
          position={l.position}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {l.text}
        </Text>
      ))}
    </group>
  );
}
