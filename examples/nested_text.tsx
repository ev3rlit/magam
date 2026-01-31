import { Canvas, Shape, Sticky, Edge, Text } from '@graphwrite/core';

export default () => (
    <Canvas>
        <Text id="title" x={250} y={50} className="text-2xl font-bold">
            Nested Text Demo
        </Text>

        {/* Standard Label (Legacy) */}
        <Shape
            id="legacy"
            x={100}
            y={150}
            label="Single Label"
            className="bg-white"
        />

        {/* Declarative Nested Text */}
        <Shape
            id="nested-1"
            x={300}
            y={150}
            className="bg-white w-48 h-24"
        >
            <Text className="text-lg font-bold text-indigo-600">Main Title</Text>
            <Text className="text-xs text-slate-400">Subtitle description</Text>
        </Shape>

        {/* Mixed Content + Edge */}
        <Shape
            id="nested-2"
            x={500}
            y={150}
            className="bg-blue-50 border-blue-200 w-48 h-24"
        >
            <Text className="font-mono text-sm text-blue-800">Function()</Text>
            <Text className="text-[10px] text-blue-400 mt-1">Returns void</Text>
            <Edge to="legacy" />
        </Shape>

    </Canvas>
);
