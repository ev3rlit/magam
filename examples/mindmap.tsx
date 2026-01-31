import { Canvas, Sticky, Shape, Edge } from '@graphwrite/core';

export default () => (
  <Canvas>
    <Sticky
      id="root"
      text="Central Idea"
      x={400}
      y={300}
      color="bg-blue-200"
      width={200}
      height={100}
    />
    <Shape id="child1" text="Branch 1" x={200} y={500} type="circle" />
    <Shape id="child2" text="Branch 2" x={600} y={500} type="rectangle" />
    <Edge from="root" to="child1" />
    <Edge from="root" to="child2" />
  </Canvas>
);
