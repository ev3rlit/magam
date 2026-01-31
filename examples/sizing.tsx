import { Canvas, Shape, Sticky, Edge, Text } from '@graphwrite/core';

export default () => (
    <Canvas>
        {/* Header */}
        <Text id="header" x={50} y={50} className="text-3xl font-bold">
            Size Comparison Test
        </Text>

        {/* Row 1: Current Defaults (approx 144x144) */}
        <Text id="label-default" x={50} y={150} className="font-semibold text-gray-500">
            Current Default (w-36 h-36)
        </Text>
        <Shape id="def-1" label="System" x={300} y={130} />
        <Shape id="def-2" label="Process Data\nAnd More" x={500} y={130} type="circle" />
        <Sticky id="def-sticky" x={700} y={130}>Sticky Note</Sticky>

        {/* Row 2: Compact (Target: ~100x50) */}
        <Text id="label-compact" x={50} y={350} className="font-semibold text-gray-500">
            Compact (w-[100px] h-[50px])
        </Text>
        <Shape
            id="comp-1"
            label="Start"
            x={300}
            y={340}
            className="w-[100px] h-[50px] text-sm"
        />
        <Shape
            id="comp-2"
            label="Action"
            x={450}
            y={340}
            className="w-[100px] h-[50px] text-sm bg-blue-50 border-blue-200"
        />
        <Sticky
            id="comp-sticky"
            x={600}
            y={340}
            className="w-[120px] h-[120px] text-sm p-2"
        >
            Small Note
        </Sticky>

        {/* Row 3: Standard (Target: ~140x70) */}
        <Text id="label-standard" x={50} y={550} className="font-semibold text-gray-500">
            Standard (w-[140px] h-[70px])
        </Text>
        <Shape
            id="std-1"
            label="User Input"
            x={300}
            y={540}
            className="w-[140px] h-[70px]"
        />
        <Shape
            id="std-2"
            label="Database"
            x={500}
            y={540}
            className="w-[140px] h-[70px] bg-green-50 border-green-200"
        />
        <Sticky
            id="std-sticky"
            x={700}
            y={540}
            className="w-[160px] h-[160px] p-4"
        >
            Standard Guide
        </Sticky>

        {/* Row 4: Wide/Card (Target: ~180x80) */}
        <Text id="label-wide" x={50} y={750} className="font-semibold text-gray-500">
            Wide/Card (w-[180px] h-[80px])
        </Text>
        <Shape
            id="wide-1"
            label="Payment Processing"
            x={300}
            y={740}
            className="w-[180px] h-[80px]"
        />
    </Canvas>
);
