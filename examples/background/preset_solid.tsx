import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Preset: Solid
 * 배경 패턴 없이 깨끗한 흰 바탕
 */
export default function PresetSolid() {
    return (
        <Canvas background="solid">
            <Text id="title" x={250} y={30}>Preset: Solid (No Pattern)</Text>

            <Shape id="fe" x={100} y={120} className="bg-violet-50 border-violet-300">
                Frontend
            </Shape>
            <Shape id="api" x={350} y={120} className="bg-indigo-50 border-indigo-300">
                API
            </Shape>
            <Shape id="store" x={600} y={120} className="bg-purple-50 border-purple-300">
                Store
            </Shape>

            <Edge from="fe" to="api" label="fetch" />
            <Edge from="api" to="store" label="persist" />
        </Canvas>
    );
}
