import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * TinyURL Architecture Example
 * 
 * System design diagram using anchor positioning
 */
export default function TinyURLArchitectureExample() {
    return (
        <Canvas>
            <Text id="title" x={350} y={30}>TinyURL Architecture</Text>

            {/* User */}
            <Shape id="user" x={50} y={200}>
                👤 User
                <Edge to="lb" label="Request" />
            </Shape>

            {/* Load Balancer */}
            <Shape id="lb" anchor="user" position="right" gap={100}>
                Load Balancer
                <Edge to="server" />
            </Shape>

            {/* Web Servers */}
            <Shape id="server" anchor="lb" position="right" gap={100}>
                Web Servers
                <Edge to="cache" label="Read" />
                <Edge to="db" label="Write" />
            </Shape>

            {/* Cache */}
            <Shape id="cache" anchor="server" position="bottom-left" gap={80}>
                Cache (Redis)
            </Shape>

            {/* Database */}
            <Shape id="db" anchor="server" position="bottom-right" gap={80}>
                Database
            </Shape>
        </Canvas>
    );
}
