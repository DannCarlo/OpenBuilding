import { Nodes } from './Nodes';
import { Members } from './Members';
import { Supports } from './Supports';
import { Labels } from './Labels';
import { Grid } from './Grid';
import { CameraControls } from './CameraControls';
import { Lighting } from './Lighting';

/**
 * Root 3D scene containing all structural elements.
 */
export function Scene() {
  return (
    <>
      <Lighting />
      <Grid />
      <Nodes />
      <Members />
      <Supports />
      <Labels />
      <CameraControls />
    </>
  );
}
