import { Canvas, Shape, MindMap, Node, Edge, Text } from '@magam/core';

/**
 * Icons Example
 * 
 * Demonstrates using emoji icons in Shapes and MindMap nodes
 * (For rich icons, consider adding a dedicated Icon component)
 */
export default function IconsExample() {
    return (
        <Canvas>
            {/* Left side: Architecture with Shapes */}
            <Text id="canvas-title" x={100} y={30}>Architecture (Shapes)</Text>

            <Shape id="users" x={50} y={100}>
                <Text>👥 Users</Text>
            </Shape>

            <Shape id="api" anchor="users" position="right" gap={120}>
                <Text>🖥️ API Server</Text>
                <Edge to="users" />
            </Shape>

            <Shape id="db" anchor="api" position="right" gap={120}>
                <Text>🗄️ Database</Text>
                <Edge to="api" />
            </Shape>

            <Shape id="auth" anchor="api" position="bottom" gap={80}>
                <Text>🔐 Auth Service</Text>
                <Edge to="api" />
            </Shape>

            {/* Right side: Tech Stack MindMap */}
            <MindMap x={600} y={50} layout="tree">
                <Node id="stack">⚡ Tech Stack</Node>

                <Node id="cloud" from="stack">☁️ Cloud</Node>
                <Node id="backend" from="stack">💻 Backend</Node>
                <Node id="version" from="stack">🌿 Git</Node>

                <Node id="aws" from="cloud">AWS</Node>
                <Node id="gcp" from="cloud">GCP</Node>

                <Node id="node" from="backend">Node.js</Node>
                <Node id="go" from="backend">Go</Node>
            </MindMap>
        </Canvas>
    );
}
