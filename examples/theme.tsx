import { Canvas, Shape, Sticky, Edge, Text } from '@graphwrite/core';

export default () => (
    <Canvas>
        <Text id="title" x={250} y={50} className="text-3xl font-extrabold text-brand-600">
            GraphWrite Design System
        </Text>

        <Text id="subtitle" x={250} y={90} className="text-sm text-slate-400">
            Default Theme Components
        </Text>

        {/* Section 1: Stickies */}
        <Text id="l-sticky" x={50} y={150} className="font-bold text-gray-500">
            Brand Sticky Notes
        </Text>
        <Sticky id="s1" x={50} y={180}>
            Standard Note
        </Sticky>
        <Sticky id="s2" x={250} y={180} className="scale-105 shadow-node-selected">
            Selected State
        </Sticky>

        {/* Section 2: Shapes */}
        <Text id="l-shape" x={50} y={400} className="font-bold text-gray-500">
            Brand Shapes
        </Text>
        <Shape id="sh1" x={50} y={430} label="Process Step" />
        <Shape id="sh2" x={250} y={430} label="Active System" className="shadow-node-selected border-brand-500" />
        <Shape id="sh3" x={450} y={430} label="Circular" type="circle" />

        {/* Section 3: Custom Overrides */}
        <Text id="l-custom" x={50} y={600} className="font-bold text-gray-500">
            Themed Overrides
        </Text>
        <Shape
            id="custom-1"
            x={50}
            y={630}
            label="Error State"
            className="bg-red-50 border-red-200 text-red-700 hover:shadow-node-hover"
        />
        <Shape
            id="custom-2"
            x={250}
            y={630}
            label="Success State"
            className="bg-green-50 border-green-200 text-green-700 hover:shadow-node-hover"
        />

        {/* Edges */}
        <Edge from="s1" to="s2" />
        <Edge from="sh1" to="sh2" label="Next Step" />
        <Edge from="sh2" to="sh3" />
    </Canvas>
);
