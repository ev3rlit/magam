import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Canvas Background Example
 *
 * Demonstrates the `background` prop on Canvas.
 * - Preset strings: 'dots' (default), 'lines', 'solid'
 * - Function pattern: custom SVG tile rendered via ({ size }) => string
 * - Config object: { gap, pattern } for custom gap + SVG
 */
export default function CanvasBackgroundExample() {
    return (
        <Canvas background={{
            gap: 32,
            pattern: ({ size }) => `
                <line x1="0" y1="${size}" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
                <line x1="${size}" y1="0" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
            `
        }}>
            <Text id="title" x={300} y={30}>Canvas Background: Custom Grid</Text>

            <Shape id="api" x={100} y={120} className="bg-blue-50 border-blue-300 text-blue-700">
                API Gateway
            </Shape>
            <Shape id="auth" x={350} y={120} className="bg-green-50 border-green-300 text-green-700">
                Auth Service
            </Shape>
            <Shape id="db" x={600} y={120} className="bg-amber-50 border-amber-300 text-amber-700">
                Database
            </Shape>

            <Edge from="api" to="auth" label="verify" />
            <Edge from="auth" to="db" label="query" />
        </Canvas>
    );
}
