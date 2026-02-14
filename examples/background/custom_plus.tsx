import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Custom: Plus (+)
 * 작은 십자 마커가 반복되는 패턴 — 그래프 용지 느낌
 */
export default function CustomPlus() {
    return (
        <Canvas background={{
            gap: 24,
            pattern: ({ size }) => {
                const cx = size / 2;
                const cy = size / 2;
                const arm = 2;
                return `
                    <line x1="${cx - arm}" y1="${cy}" x2="${cx + arm}" y2="${cy}" stroke="#94a3b8" stroke-width="0.5" />
                    <line x1="${cx}" y1="${cy - arm}" x2="${cx}" y2="${cy + arm}" stroke="#94a3b8" stroke-width="0.5" />
                `;
            }
        }}>
            <Text id="title" x={250} y={30}>Custom: Plus Markers</Text>

            <Shape id="collect" x={100} y={120} className="bg-rose-50 border-rose-300 text-rose-700">
                Collect Data
            </Shape>
            <Shape id="process" x={350} y={120} className="bg-pink-50 border-pink-300 text-pink-700">
                Process
            </Shape>
            <Shape id="visualize" x={600} y={120} className="bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700">
                Visualize
            </Shape>

            <Edge from="collect" to="process" label="ETL" />
            <Edge from="process" to="visualize" label="render" />
        </Canvas>
    );
}
