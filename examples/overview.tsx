import { Canvas, Sticky, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Overview Example
 * 
 * Basic demonstration of Sticky notes and Shapes
 */
export default function OverviewExample() {
  return (
    <Canvas>
      <Text id="title" x={200} y={30}>Project Overview</Text>

      <Sticky id="idea-1" x={100} y={100}>
        Core Idea
        <Edge to="system" />
      </Sticky>

      <Sticky id="idea-2" x={100} y={200}>
        Supporting Idea
        <Edge to="system" />
      </Sticky>

      <Shape id="system" x={300} y={150}>System</Shape>
    </Canvas>
  );
}
