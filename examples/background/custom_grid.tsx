import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Custom: Grid (격자)
 * Config 객체로 gap과 pattern을 지정하는 기본 커스텀 패턴
 */
export default function CustomGrid() {
    return (
        <Canvas background={{
            gap: 32,
            pattern: ({ size }) => `
                <line x1="0" y1="${size}" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
                <line x1="${size}" y1="0" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
            `
        }}>
            <Text id="title" x={250} y={30}>Custom: Grid (32px)</Text>

            <Shape id="ui" x={100} y={120} className="bg-sky-50 border-sky-300 text-sky-700">
                UI Component
            </Shape>
            <Shape id="hook" x={350} y={120} className="bg-cyan-50 border-cyan-300 text-cyan-700">
                Custom Hook
            </Shape>
            <Shape id="store" x={600} y={120} className="bg-teal-50 border-teal-300 text-teal-700">
                Zustand Store
            </Shape>

            <Edge from="ui" to="hook" label="calls" />
            <Edge from="hook" to="store" label="reads/writes" />
        </Canvas>
    );
}
