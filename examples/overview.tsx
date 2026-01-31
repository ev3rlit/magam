import { Canvas, Sticky, Shape, Edge, Text } from '@graphwrite/core';

export default () => (
  <Canvas>
    <Text id="title" x={200} y={30} className="text-2xl font-bold">
      프로젝트 개요
    </Text>

    <Sticky id="idea-1" x={100} y={100}>
      핵심 아이디어
      <Edge to="system" />
    </Sticky>

    <Sticky id="idea-2" x={100} y={200} className="bg-pink-200">
      보조 아이디어
      <Edge to="system" />
    </Sticky>

    <Shape id="system" x={300} y={150} shape="rectangle" className="bg-blue-100">
      시스템
    </Shape>
  </Canvas>
);
