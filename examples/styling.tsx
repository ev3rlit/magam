import { Canvas, Shape, Sticky, Edge, Text } from '@magam/core';

/**
 * Styling & Sizing Example
 * 
 * Demonstrates sizing options and styling with Tailwind CSS
 */
export default function StylingExample() {
    return (
        <Canvas>
            <Text id="title" x={300} y={30}>Styling & Sizing</Text>

            {/* ===== Section 1: Sizing ===== */}
            <Text id="sec-1" x={50} y={80}>1. Sizing Options</Text>

            <Shape id="default" x={50} y={120}>Default Size</Shape>
            <Shape id="width-height" x={250} y={120} width={180} height={80}>width/height props</Shape>
            <Shape id="className-size" x={480} y={120} className="w-[200px] h-[60px]">className size</Shape>

            {/* ===== Section 2: Colors & States ===== */}
            <Text id="sec-2" x={50} y={250}>2. Colors & States</Text>

            <Shape id="success" x={50} y={290} className="bg-green-50 border-green-300 text-green-700">
                Success
            </Shape>
            <Shape id="warning" x={250} y={290} className="bg-yellow-50 border-yellow-300 text-yellow-700">
                Warning
            </Shape>
            <Shape id="error" x={450} y={290} className="bg-red-50 border-red-300 text-red-700">
                Error
            </Shape>

            {/* ===== Section 3: Effects ===== */}
            <Text id="sec-3" x={50} y={420}>3. Effects</Text>

            <Shape id="gradient" x={50} y={460} className="bg-gradient-to-r from-blue-400 to-purple-500 text-white border-none">
                Gradient
            </Shape>
            <Sticky id="glass" x={250} y={460} className="bg-white/50 backdrop-blur-sm border-white/30">
                Glass Effect
            </Sticky>
            <Shape id="shadow" x={450} y={460} className="shadow-xl">
                Shadow
            </Shape>

            {/* ===== Section 4: Borders ===== */}
            <Text id="sec-4" x={50} y={620}>4. Borders</Text>

            <Shape id="rounded" x={50} y={660} className="rounded-2xl">Rounded</Shape>
            <Shape id="dashed" x={250} y={660} className="border-dashed border-2">Dashed</Shape>
            <Shape id="thick" x={450} y={660} className="border-4 border-indigo-500">Thick Border</Shape>

            {/* Edges */}
            <Edge from="success" to="warning" />
            <Edge from="warning" to="error" />
        </Canvas>
    );
}
