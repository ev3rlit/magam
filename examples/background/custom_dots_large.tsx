import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Custom: Large Dots
 * 함수 패턴으로 큰 점을 찍는 예제 — 기본 gap(24) 사용
 */
export default function CustomDotsLarge() {
    return (
        <Canvas background={({ size }) => `
            <circle cx="${size / 2}" cy="${size / 2}" r="2" fill="#94a3b8" />
        `}>
            <Text id="title" x={250} y={30}>Custom: Large Dots</Text>

            <Shape id="producer" x={100} y={120} className="bg-lime-50 border-lime-400 text-lime-700">
                Producer
            </Shape>
            <Shape id="queue" x={350} y={120} className="bg-yellow-50 border-yellow-400 text-yellow-700">
                Message Queue
            </Shape>
            <Shape id="consumer" x={600} y={120} className="bg-green-50 border-green-400 text-green-700">
                Consumer
            </Shape>

            <Edge from="producer" to="queue" label="publish" />
            <Edge from="queue" to="consumer" label="subscribe" />
        </Canvas>
    );
}
