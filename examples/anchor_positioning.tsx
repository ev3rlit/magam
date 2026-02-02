import { Canvas, Shape, Edge, Text } from '@graphwrite/core';

/**
 * Anchor Positioning Example
 * 
 * 좌표 없이 다른 노드를 기준으로 상대 위치 배치
 * - anchor: 기준 노드 ID
 * - position: 기준 노드 대비 위치 (top, bottom, left, right, ...)
 * - gap: 간격 (기본 40px)
 * - align: 정렬 (start, center, end)
 */
export default function AnchorPositioningExample() {
    return (
        <Canvas>
            {/* 타이틀 */}
            <Text id="title" x={400} y={30} className="text-2xl font-bold text-slate-800">
                Anchor Positioning Demo
            </Text>

            {/* 기준 노드 (중앙) - 유일하게 x, y 좌표 필요 */}
            <Shape
                id="server"
                x={400}
                y={250}
                width={140}
                height={80}
                label="API Server"
                className="bg-blue-500 text-white font-bold rounded-lg shadow-lg"
            />

            {/* ===== 상하좌우 배치 ===== */}

            {/* 왼쪽 */}
            <Shape
                id="lb"
                anchor="server"
                position="left"
                gap={80}
                label="Load Balancer"
                className="bg-emerald-400 text-white rounded-lg"
            />

            {/* 왼쪽 체인 (lb 기준) */}
            <Shape
                id="user"
                anchor="lb"
                position="left"
                gap={60}
                label="👤 User"
                className="bg-slate-100 border-2 border-slate-300 rounded-xl"
            />

            {/* 오른쪽 */}
            <Shape
                id="db"
                anchor="server"
                position="right"
                gap={80}
                label="Database"
                className="bg-orange-400 text-white rounded-lg"
            />

            {/* 오른쪽 체인 (db 기준) */}
            <Shape
                id="backup"
                anchor="db"
                position="right"
                label="Backup"
                className="bg-orange-200 border-2 border-orange-400 rounded-lg"
            />

            {/* 위쪽 */}
            <Shape
                id="cache"
                anchor="server"
                position="top"
                gap={60}
                label="Cache (Redis)"
                className="bg-red-400 text-white rounded-lg"
            />

            {/* 아래쪽 */}
            <Shape
                id="logs"
                anchor="server"
                position="bottom"
                gap={60}
                label="Logs"
                className="bg-purple-400 text-white rounded-lg"
            />

            {/* 아래쪽 체인 */}
            <Shape
                id="metrics"
                anchor="logs"
                position="bottom"
                label="Metrics"
                className="bg-purple-200 border-2 border-purple-400 rounded-lg"
            />

            {/* ===== 대각선 배치 ===== */}
            <Shape
                id="config"
                anchor="server"
                position="top-left"
                gap={50}
                label="Config"
                className="bg-yellow-200 border-2 border-yellow-500 rounded-lg text-yellow-800"
            />

            <Shape
                id="secrets"
                anchor="server"
                position="top-right"
                gap={50}
                label="Secrets"
                className="bg-pink-200 border-2 border-pink-500 rounded-lg text-pink-800"
            />

            {/* ===== Edges (선택적) ===== */}
            <Edge from="user" to="lb" label="Request" />
            <Edge from="lb" to="server" />
            <Edge from="server" to="db" label="Query" />
            <Edge from="server" to="cache" label="Read" />
            <Edge from="db" to="backup" label="Sync" className="dashed" />
            <Edge from="server" to="logs" />
            <Edge from="logs" to="metrics" />
        </Canvas>
    );
}
