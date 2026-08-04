import { Nodes } from './Nodes';
import { Members } from './Members';
import { Plates } from './Plates';
import { Supports } from './Supports';
import { Labels } from './Labels';
import { Grid } from './Grid';
import { CameraControls } from './CameraControls';
import { Lighting } from './Lighting';
import { AxisGuideSync } from './AxisGuideSync';

interface SceneProps {
  bgColor?: string;
}

/**
 * Root 3D scene containing all structural elements.
 */
export function Scene({ bgColor = '#ffffff' }: SceneProps) {
  return (
    <>
      <color attach="background" args={[bgColor]} />
      <Lighting />
      <Grid />
      <Nodes />
      <Members />
      <Plates />
      <Supports />
      <Labels />
      <CameraControls />
      <AxisGuideSync />
    </>
  );
}
