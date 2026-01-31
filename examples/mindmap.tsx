import { Canvas, MindMap, Shape, Edge, Text } from '@graphwrite/core';

export default function MindMapExample() {
  return (
    <Canvas>
      <MindMap id="root">
        {/* Main Concept */}
        <Shape
          id="main"
          type="rectangle"
          x={0}
          y={0}
          width={180}
          height={60}
          fill="bg-indigo-100"
          stroke="border-indigo-500"
          label="Rich Text Demo"
          labelBold={true}
          labelFontSize={18}
          labelColor="#4338ca" // indigo-700
        />

        {/* Feature 1: Colored Shape Text */}
        <Shape
          id="feat1"
          type="circle"
          x={250}
          y={-100}
          width={120}
          height={120}
          fill="bg-rose-100"
          label="Red Text"
          labelColor="#ef4444" // red-500
          labelBold={true}
        />

        {/* Feature 2: Large Font */}
        <Shape
          id="feat2"
          type="rectangle"
          x={250}
          y={0}
          width={120}
          height={80}
          fill="bg-emerald-100"
          label="Big Font"
          labelFontSize={24}
          labelColor="#047857" // emerald-700
        />

        {/* Feature 3: Edge Label */}
        <Edge
          from="main"
          to="feat2"
          label="Styled Edge"
          labelBgColor="#ffffff"
          labelTextColor="#059669" // emerald-600
          labelFontSize={12}
        />

        <Edge from="main" to="feat1" />

        {/* Feature 4: Standalone Text Node */}
        <Text
          id="text1"
          x={0}
          y={150}
          content="This is a standalone\nText Node with custom styles"
          fontSize={20}
          color="#6b7280" // gray-500
          italic={true}
        />

        <Edge from="main" to="text1" label="Connects to Text" />

      </MindMap>
    </Canvas>
  );
}
