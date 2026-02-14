import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Custom: Diagonal Lines
 * 단방향 대각선 — 줄무늬 노트 느낌
 */
export default function CustomDiagonal() {
    return (
        <Canvas background={{
            gap: 16,
            pattern: ({ size }) => `
                <line x1="0" y1="0" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
            `
        }}>
            <Text id="title" x={250} y={30}>Custom: Diagonal Lines</Text>

            <Shape id="plan" x={100} y={120} className="bg-amber-50 border-amber-300 text-amber-700">
                Plan
            </Shape>
            <Shape id="do" x={300} y={120} className="bg-orange-50 border-orange-300 text-orange-700">
                Do
            </Shape>
            <Shape id="check" x={500} y={120} className="bg-red-50 border-red-300 text-red-700">
                Check
            </Shape>
            <Shape id="act" x={700} y={120} className="bg-rose-50 border-rose-300 text-rose-700">
                Act
            </Shape>

            <Edge from="plan" to="do" />
            <Edge from="do" to="check" />
            <Edge from="check" to="act" />
        </Canvas>
    );
}
