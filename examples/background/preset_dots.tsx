import { Canvas, Shape, Edge, Text } from '@magam/core';

/**
 * Preset: Dots (기본값)
 * 가장 기본적인 점 패턴 배경
 */
export default function PresetDots() {
    return (
        <Canvas background="dots">
            <Text id="title" x={250} y={30}>Preset: Dots</Text>

            <Shape id="client" x={100} y={120} className="bg-slate-50 border-slate-300">
                Client
            </Shape>
            <Shape id="server" x={350} y={120} className="bg-blue-50 border-blue-300">
                Server
            </Shape>
            <Shape id="db" x={600} y={120} className="bg-emerald-50 border-emerald-300">
                Database
            </Shape>

            <Edge from="client" to="server" label="request" />
            <Edge from="server" to="db" label="query" />
        </Canvas>
    );
}
