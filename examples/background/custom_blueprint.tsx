import { Canvas, Shape, Edge, Text } from '@magam/core';

/**
 * Custom: Blueprint
 * 청사진 스타일 — 파란 격자 + 점 조합
 */
export default function CustomBlueprint() {
    return (
        <Canvas background={{
            gap: 40,
            pattern: ({ size }) => `
                <rect width="${size}" height="${size}" fill="#1e3a5f" />
                <line x1="0" y1="${size}" x2="${size}" y2="${size}" stroke="#2d5a8e" stroke-width="0.5" />
                <line x1="${size}" y1="0" x2="${size}" y2="${size}" stroke="#2d5a8e" stroke-width="0.5" />
                <line x1="${size / 2}" y1="0" x2="${size / 2}" y2="${size}" stroke="#264a75" stroke-width="0.25" />
                <line x1="0" y1="${size / 2}" x2="${size}" y2="${size / 2}" stroke="#264a75" stroke-width="0.25" />
            `
        }}>
            <Text id="title" x={250} y={30} className="text-white">Custom: Blueprint</Text>

            <Shape id="load-balancer" x={100} y={120} className="bg-blue-900/60 border-blue-400 text-blue-100">
                Load Balancer
            </Shape>
            <Shape id="app-server" x={350} y={120} className="bg-blue-900/60 border-blue-400 text-blue-100">
                App Server
            </Shape>
            <Shape id="cache" x={600} y={120} className="bg-blue-900/60 border-blue-400 text-blue-100">
                Redis Cache
            </Shape>

            <Edge from="load-balancer" to="app-server" label="route" />
            <Edge from="app-server" to="cache" label="cache" />
        </Canvas>
    );
}
