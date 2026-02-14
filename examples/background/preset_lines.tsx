import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Preset: Lines
 * 수평선 패턴 배경 — 노트 라인 느낌
 */
export default function PresetLines() {
    return (
        <Canvas background="lines">
            <Text id="title" x={250} y={30}>Preset: Lines</Text>

            <Shape id="input" x={100} y={120} className="bg-amber-50 border-amber-300">
                Input Layer
            </Shape>
            <Shape id="hidden" x={350} y={120} className="bg-orange-50 border-orange-300">
                Hidden Layer
            </Shape>
            <Shape id="output" x={600} y={120} className="bg-red-50 border-red-300">
                Output Layer
            </Shape>

            <Edge from="input" to="hidden" />
            <Edge from="hidden" to="output" />
        </Canvas>
    );
}
