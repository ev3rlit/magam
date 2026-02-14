import { Canvas, Shape, Edge, Text } from '@magam/core';

/**
 * Custom: Cross-hatch (빗금)
 * 대각선 교차 패턴 — 설계도/스케치 느낌
 */
export default function CustomCrosshatch() {
    return (
        <Canvas background={{
            gap: 20,
            pattern: ({ size }) => `
                <line x1="0" y1="0" x2="${size}" y2="${size}" stroke="#cbd5e1" stroke-width="0.3" />
                <line x1="${size}" y1="0" x2="0" y2="${size}" stroke="#cbd5e1" stroke-width="0.3" />
            `
        }}>
            <Text id="title" x={250} y={30}>Custom: Cross-hatch</Text>

            <Shape id="sketch" x={100} y={120} className="bg-stone-50 border-stone-400 text-stone-700">
                Sketch
            </Shape>
            <Shape id="wireframe" x={350} y={120} className="bg-stone-50 border-stone-400 text-stone-700">
                Wireframe
            </Shape>
            <Shape id="prototype" x={600} y={120} className="bg-stone-50 border-stone-400 text-stone-700">
                Prototype
            </Shape>

            <Edge from="sketch" to="wireframe" label="refine" />
            <Edge from="wireframe" to="prototype" label="build" />
        </Canvas>
    );
}
