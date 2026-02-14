import { Canvas, Shape, Edge, Text } from '@magam/core';

/**
 * Custom: Honeycomb (벌집)
 * 육각형 느낌의 패턴 — 삼각 격자 기반
 */
export default function CustomHoneycomb() {
    return (
        <Canvas background={{
            gap: 30,
            pattern: ({ size }) => {
                const h = size * Math.sqrt(3) / 2;
                return `
                    <line x1="0" y1="${h}" x2="${size / 2}" y2="0" stroke="#d1d5db" stroke-width="0.4" />
                    <line x1="${size / 2}" y1="0" x2="${size}" y2="${h}" stroke="#d1d5db" stroke-width="0.4" />
                    <line x1="0" y1="${h}" x2="${size}" y2="${h}" stroke="#d1d5db" stroke-width="0.4" />
                `;
            }
        }}>
            <Text id="title" x={250} y={30}>Custom: Honeycomb</Text>

            <Shape id="worker1" x={100} y={120} className="bg-yellow-50 border-yellow-400 text-yellow-700">
                Worker 1
            </Shape>
            <Shape id="worker2" x={350} y={120} className="bg-yellow-50 border-yellow-400 text-yellow-700">
                Worker 2
            </Shape>
            <Shape id="worker3" x={600} y={120} className="bg-yellow-50 border-yellow-400 text-yellow-700">
                Worker 3
            </Shape>

            <Edge from="worker1" to="worker2" label="sync" />
            <Edge from="worker2" to="worker3" label="sync" />
        </Canvas>
    );
}
