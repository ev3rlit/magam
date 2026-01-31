import { Canvas, Sticky, Shape, Edge } from '@graphwrite/core';

export default () => (
  <Canvas>
    <Sticky id="1" text="Start" x={100} y={100} color="bg-yellow-200" />
    <Shape id="2" text="Process" x={300} y={100} type="rectangle" />
    <Shape id="3" text="End" x={500} y={100} type="circle" />
    <Edge from="1" to="2" />
    <Edge from="2" to="3" />
  </Canvas>
);
