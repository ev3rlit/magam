import { Canvas, Shape, Edge, Text } from '@magam/core';

/**
 * Anchor Positioning Example
 * 
 * Position nodes relative to other nodes without coordinates
 * - anchor: Reference node ID
 * - position: Position relative to anchor (top, bottom, left, right, ...)
 * - gap: Spacing (default 40px)
 * - align: Alignment (start, center, end)
 */
export default function AnchorPositioningExample() {
    return (
        <Canvas>
            <Text id="title">Anchor Positioning Demo</Text>

            {/* Center node - only one needing x, y coordinates */}
            <Shape id="server" x={400} y={250}>API Server</Shape>

            {/* ===== Cardinal directions ===== */}

            {/* Left */}
            <Shape id="lb" anchor="server" position="left" gap={80}>
                Load Balancer
                <Edge to="server" />
            </Shape>

            {/* Left chain (relative to lb) */}
            <Shape id="user" anchor="lb" position="left" gap={60}>
                👤 User
                <Edge to="lb" label="Request" />
            </Shape>

            {/* Right */}
            <Shape id="db" anchor="server" position="right" gap={80}>
                Database
                <Edge to="server" label="Query" />
            </Shape>

            {/* Right chain (relative to db) */}
            <Shape id="backup" anchor="db" position="right">
                Backup
                <Edge to="db" label="Sync" />
            </Shape>

            {/* Top */}
            <Shape id="cache" anchor="server" position="top" gap={60}>
                Cache (Redis)
                <Edge to="server" label="Read" />
            </Shape>

            {/* Bottom */}
            <Shape id="logs" anchor="server" position="bottom" gap={60}>
                Logs
                <Edge to="server" />
            </Shape>

            {/* Bottom chain */}
            <Shape id="metrics" anchor="logs" position="bottom">
                Metrics
                <Edge to="logs" />
            </Shape>

            {/* ===== Diagonal positions ===== */}
            <Shape id="config" anchor="server" position="top-left" gap={50}>Config</Shape>
            <Shape id="secrets" anchor="server" position="top-right" gap={50}>Secrets</Shape>
        </Canvas>
    );
}
