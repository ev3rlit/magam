import { Delaunay } from 'd3-delaunay';
import { findRootNode, collectDescendants, getNodeDimensions } from '../layoutUtils';
import type { LayoutStrategy, LayoutContext } from './types';
import type { Node, Edge } from 'reactflow';

// ── Helpers ──────────────────────────────────────────────────────────

function polygonCentroid(polygon: number[][]): [number, number] {
    let cx = 0, cy = 0, area = 0;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const cross = xi * yj - xj * yi;
        area += cross;
        cx += (xi + xj) * cross;
        cy += (yi + yj) * cross;
    }
    area /= 2;
    if (Math.abs(area) < 1e-10) {
        cx = polygon.reduce((s, p) => s + p[0], 0) / n;
        cy = polygon.reduce((s, p) => s + p[1], 0) / n;
        return [cx, cy];
    }
    const f = 1 / (6 * area);
    return [cx * f, cy * f];
}

function polygonArea(polygon: number[][]): number {
    let area = 0;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        area += polygon[i][0] * polygon[j][1];
        area -= polygon[j][0] * polygon[i][1];
    }
    return Math.abs(area / 2);
}

function polygonBBox(polygon: number[][]): [number, number, number, number] {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of polygon) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
}

function pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/** Clamp point to polygon interior. If outside, project to nearest edge + pull 2px inward. */
function clampToPolygon(x: number, y: number, polygon: number[][]): [number, number] {
    if (pointInPolygon(x, y, polygon)) return [x, y];
    let bestDist = Infinity;
    let bestX = x, bestY = y;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[j];
        const dx = x2 - x1, dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-10) continue;
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
        const px = x1 + t * dx, py = y1 + t * dy;
        const dist = (x - px) * (x - px) + (y - py) * (y - py);
        if (dist < bestDist) {
            bestDist = dist;
            bestX = px;
            bestY = py;
        }
    }
    const [cx, cy] = polygonCentroid(polygon);
    const toDx = cx - bestX, toDy = cy - bestY;
    const toDist = Math.sqrt(toDx * toDx + toDy * toDy);
    if (toDist > 2) {
        bestX += (toDx / toDist) * 2;
        bestY += (toDy / toDist) * 2;
    }
    return [bestX, bestY];
}

/** Shrink polygon toward centroid by `amount` px. */
function shrinkPolygon(polygon: number[][], amount: number): number[][] {
    const [cx, cy] = polygonCentroid(polygon);
    return polygon.map(([x, y]) => {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < amount) return [cx, cy];
        const scale = (dist - amount) / dist;
        return [cx + dx * scale, cy + dy * scale];
    });
}

function computeSubtreeAreas(
    nodeMap: Map<string, Node>,
    childrenMap: Map<string, string[]>,
): Map<string, number> {
    const cache = new Map<string, number>();
    function getArea(nodeId: string): number {
        if (cache.has(nodeId)) return cache.get(nodeId)!;
        const node = nodeMap.get(nodeId);
        if (!node) { cache.set(nodeId, 0); return 0; }
        const { width, height } = getNodeDimensions(node);
        let area = width * height;
        for (const childId of (childrenMap.get(nodeId) || [])) {
            area += getArea(childId);
        }
        cache.set(nodeId, area);
        return area;
    }
    for (const id of nodeMap.keys()) getArea(id);
    return cache;
}

/**
 * Weighted voronoi with improved convergence.
 * Alpha uses sqrt(1/ratio) for more aggressive area equalization.
 */
function weightedVoronoi(
    items: { id: string; weight: number }[],
    bounds: [number, number, number, number],
    iterations: number,
    initialSeeds?: Float64Array,
    pinnedIndices?: Set<number>,
): Map<string, { cx: number; cy: number; polygon: number[][] }> {
    const n = items.length;
    const results = new Map<string, { cx: number; cy: number; polygon: number[][] }>();
    if (n === 0) return results;

    const [bx0, by0, bx1, by1] = bounds;
    const bw = bx1 - bx0, bh = by1 - by0;

    if (n === 1) {
        const poly = [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]];
        results.set(items[0].id, { cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2, polygon: poly });
        return results;
    }

    const boundsArea = bw * bh;
    const totalWeight = items.reduce((s, it) => s + it.weight, 0);
    const targetAreas = items.map(it => (it.weight / totalWeight) * boundsArea);

    const points = new Float64Array(n * 2);
    if (initialSeeds && initialSeeds.length >= n * 2) {
        for (let i = 0; i < n * 2; i++) points[i] = initialSeeds[i];
    } else {
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        for (let i = 0; i < n; i++) {
            points[i * 2] = bx0 + ((i % cols) + 0.5) * bw / cols;
            points[i * 2 + 1] = by0 + (Math.floor(i / cols) + 0.5) * bh / rows;
        }
    }

    for (let iter = 0; iter < iterations; iter++) {
        const del = new Delaunay(points);
        const vor = del.voronoi(bounds);
        for (let i = 0; i < n; i++) {
            if (pinnedIndices?.has(i)) continue;
            const cell = vor.cellPolygon(i);
            if (!cell) continue;
            const [cx, cy] = polygonCentroid(cell);
            const cA = polygonArea(cell);
            const ratio = cA / targetAreas[i];
            // Improved alpha: sqrt(1/ratio) converges faster for skewed weights
            const alpha = Math.min(0.9, Math.pow(1 / Math.max(ratio, 0.1), 0.5));
            points[i * 2] += alpha * (cx - points[i * 2]);
            points[i * 2 + 1] += alpha * (cy - points[i * 2 + 1]);
            points[i * 2] = Math.max(bx0 + 1, Math.min(bx1 - 1, points[i * 2]));
            points[i * 2 + 1] = Math.max(by0 + 1, Math.min(by1 - 1, points[i * 2 + 1]));
        }
    }

    const del = new Delaunay(points);
    const vor = del.voronoi(bounds);
    for (let i = 0; i < n; i++) {
        const cell = vor.cellPolygon(i);
        if (!cell) continue;
        const [cx, cy] = polygonCentroid(cell);
        results.set(items[i].id, { cx, cy, polygon: cell });
    }
    return results;
}

/**
 * Flat per-node voronoi within a polygon region.
 * Region root pinned near inner edge; radial outward push during Lloyd's.
 */
function flatVoronoiInRegion(
    nodeIds: string[],
    nodeMap: Map<string, Node>,
    childrenMap: Map<string, string[]>,
    subtreeAreas: Map<string, number>,
    regionRoot: string,
    regionPolygon: number[][],
    rootCx: number, rootCy: number,
    iterations: number,
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const n = nodeIds.length;
    if (n === 0) return positions;

    const [bx0, by0, bx1, by1] = polygonBBox(regionPolygon);
    const rw = bx1 - bx0;
    const rh = by1 - by0;
    const regionArea = polygonArea(regionPolygon);
    const [pCx, pCy] = polygonCentroid(regionPolygon);

    if (n === 1) {
        const node = nodeMap.get(nodeIds[0]);
        if (!node) return positions;
        const { width: nw, height: nh } = getNodeDimensions(node);
        positions.set(nodeIds[0], { x: pCx - nw / 2, y: pCy - nh / 2 });
        return positions;
    }

    // BFS ordering from regionRoot
    const ordered: string[] = [];
    const idSet = new Set(nodeIds);
    const bfsQ = [regionRoot];
    const vis = new Set<string>();
    while (bfsQ.length > 0) {
        const id = bfsQ.shift()!;
        if (!idSet.has(id) || vis.has(id)) continue;
        vis.add(id);
        ordered.push(id);
        for (const cid of (childrenMap.get(id) || [])) {
            if (idSet.has(cid)) bfsQ.push(cid);
        }
    }
    for (const id of nodeIds) {
        if (!vis.has(id)) ordered.push(id);
    }

    const idToIdx = new Map<string, number>();
    ordered.forEach((id, i) => idToIdx.set(id, i));

    // Weights: ensure cell > node size
    const NODE_AREA_MULTIPLIER = 4;
    const weights = ordered.map(id => {
        const node = nodeMap.get(id);
        const { width: nw, height: nh } = node ? getNodeDimensions(node) : { width: 160, height: 40 };
        const nodeOwnArea = nw * nh;
        const subArea = subtreeAreas.get(id) || nodeOwnArea;
        return Math.max(subArea, nodeOwnArea * NODE_AREA_MULTIPLIER);
    });
    const totalW = weights.reduce((s, w) => s + w, 0);
    const targets = weights.map(w => (w / totalW) * regionArea);

    // ── Radial seeding ──
    const points = new Float64Array(n * 2);
    const rootIdx = idToIdx.get(regionRoot) ?? 0;

    const angleFromRoot = Math.atan2(pCy - rootCy, pCx - rootCx);

    // Region root: inner edge (25% toward global root from polygon centroid)
    let rx = pCx - Math.cos(angleFromRoot) * rw * 0.25;
    let ry = pCy - Math.sin(angleFromRoot) * rh * 0.25;
    [rx, ry] = clampToPolygon(rx, ry, regionPolygon);
    points[rootIdx * 2] = rx;
    points[rootIdx * 2 + 1] = ry;

    const seeded = new Set<string>([regionRoot]);
    const seedQ = [regionRoot];
    while (seedQ.length > 0) {
        const pid = seedQ.shift()!;
        const children = (childrenMap.get(pid) || []).filter(c => idSet.has(c));
        if (children.length === 0) continue;
        const pi = idToIdx.get(pid)!;
        const px = points[pi * 2], py = points[pi * 2 + 1];
        const parentAngle = Math.atan2(py - rootCy, px - rootCx);
        const pArea = subtreeAreas.get(pid) || 1;
        const radius = Math.sqrt(pArea / Math.PI) * 0.5;
        const spread = children.length <= 2 ? Math.PI * 0.5 : Math.PI * 0.7;
        const startAngle = parentAngle - spread / 2;
        children.forEach((cid, ci) => {
            const idx = idToIdx.get(cid);
            if (idx === undefined) return;
            const angle = children.length === 1 ? parentAngle
                : startAngle + (spread * ci) / (children.length - 1);
            let cx = px + radius * Math.cos(angle);
            let cy = py + radius * Math.sin(angle);
            [cx, cy] = clampToPolygon(cx, cy, regionPolygon);
            points[idx * 2] = cx;
            points[idx * 2 + 1] = cy;
            seeded.add(cid);
            seedQ.push(cid);
        });
    }

    let oi = 0;
    for (const id of ordered) {
        if (seeded.has(id)) continue;
        const idx = idToIdx.get(id)!;
        const angle = angleFromRoot + Math.PI + (oi - 1) * 0.3;
        let ox = pCx + Math.cos(angle) * rw * 0.35;
        let oy = pCy + Math.sin(angle) * rh * 0.35;
        [ox, oy] = clampToPolygon(ox, oy, regionPolygon);
        points[idx * 2] = ox;
        points[idx * 2 + 1] = oy;
        oi++;
    }

    // ── Lloyd's with polygon clamping + radial outward push ──
    const bounds: [number, number, number, number] = [bx0, by0, bx1, by1];
    const pushScale = Math.min(rw, rh) * 0.02;
    for (let iter = 0; iter < iterations; iter++) {
        const del = new Delaunay(points);
        const vor = del.voronoi(bounds);
        for (let i = 0; i < n; i++) {
            if (i === rootIdx) continue;

            const cell = vor.cellPolygon(i);
            if (!cell) continue;
            const [cx, cy] = polygonCentroid(cell);
            const cArea = polygonArea(cell);
            const ratio = cArea / targets[i];
            const alpha = Math.min(0.9, Math.pow(1 / Math.max(ratio, 0.1), 0.5));
            let nx = points[i * 2] + alpha * (cx - points[i * 2]);
            let ny = points[i * 2 + 1] + alpha * (cy - points[i * 2 + 1]);

            const dx = nx - rootCx;
            const dy = ny - rootCy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                nx += 0.1 * (dx / dist) * pushScale;
                ny += 0.1 * (dy / dist) * pushScale;
            }

            [nx, ny] = clampToPolygon(nx, ny, regionPolygon);
            points[i * 2] = nx;
            points[i * 2 + 1] = ny;
        }
    }

    const del = new Delaunay(points);
    const vor = del.voronoi(bounds);
    for (let i = 0; i < n; i++) {
        const id = ordered[i];
        const node = nodeMap.get(id);
        if (!node) continue;
        const { width: nw, height: nh } = getNodeDimensions(node);
        const cell = vor.cellPolygon(i);
        let px: number, py: number;
        if (cell) { [px, py] = polygonCentroid(cell); }
        else { px = points[i * 2]; py = points[i * 2 + 1]; }
        positions.set(id, { x: px - nw / 2, y: py - nh / 2 });
    }

    return positions;
}

// ── Strategy ─────────────────────────────────────────────────────────

/**
 * VoronoiPackStrategy — 2-phase radial voronoi:
 *   Phase 1: L1 subtrees only → weighted voronoi (no center reservation).
 *            All container area goes to L1 proportional to subtree size.
 *   Phase 2: Within each region, flat voronoi with polygon clipping.
 *   Root placed at center separately.
 */
export class VoronoiPackStrategy implements LayoutStrategy {
    async layoutGroup(context: LayoutContext): Promise<Map<string, { x: number; y: number }>> {
        const { nodes, edges, spacing, density: rawDensity } = context;
        const density = rawDensity ?? 0.5;
        const rootNode = findRootNode(nodes, edges);
        if (!rootNode) return this.fallbackPack(nodes, edges, spacing);

        const l1ChildIds = edges
            .filter(e => e.source === rootNode.id)
            .map(e => e.target);

        if (l1ChildIds.length === 0) {
            return new Map([[rootNode.id, { x: 0, y: 0 }]]);
        }

        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const childrenMap = new Map<string, string[]>();
        edges.forEach(e => {
            if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
            childrenMap.get(e.source)!.push(e.target);
        });

        const subtreeAreas = computeSubtreeAreas(nodeMap, childrenMap);

        const areaMultiplier = 3.5 - density * 1.7;
        const iterBonus = Math.round(density * 30);
        const baseIter = 60 + iterBonus;

        let sumNodeArea = 0;
        for (const n of nodes) {
            const { width, height } = getNodeDimensions(n);
            sumNodeArea += width * height;
        }
        // Min multiplier scales with density: 0→5, 0.5→3.5, 1.0→2
        const minMultiplier = 2 + (1 - density) * 3;
        const minContainerArea = sumNodeArea * minMultiplier;
        const subtreeBasedArea = (subtreeAreas.get(rootNode.id) || 1) * areaMultiplier;
        const containerArea = Math.max(subtreeBasedArea, minContainerArea);
        const containerSide = Math.sqrt(containerArea);
        const containerCx = containerSide / 2;
        const containerCy = containerSide / 2;

        // ── Phase 1: Weighted voronoi with root (small weight) + L1 subtrees ──
        const rootDims = getNodeDimensions(rootNode);
        const rootNodeArea = rootDims.width * rootDims.height;
        // Root gets just half its own area → small cell for breathing room
        const rootItem = { id: rootNode.id, weight: rootNodeArea * 0.5 };

        const l1Items = l1ChildIds.map(id => ({
            id,
            weight: subtreeAreas.get(id) || 1,
        }));

        // Interleave by weight: heaviest subtrees placed on opposite sides
        const sorted = [...l1Items].sort((a, b) => b.weight - a.weight);
        const circleOrder: typeof l1Items = new Array(sorted.length);
        let slotL = 0, slotR = Math.ceil(sorted.length / 2);
        for (let i = 0; i < sorted.length; i++) {
            const slot = i % 2 === 0 ? slotL++ : slotR++;
            circleOrder[slot] = sorted[i];
        }

        // Root at index 0 (pinned at center), L1 items after
        const allItems = [rootItem, ...circleOrder];

        // Circular seeding: root at center, L1 around a circle
        const seeds = new Float64Array(allItems.length * 2);
        seeds[0] = containerCx;
        seeds[1] = containerCy;
        for (let i = 0; i < circleOrder.length; i++) {
            const angle = (i / circleOrder.length) * Math.PI * 2 - Math.PI / 2;
            const radius = containerSide * 0.3;
            seeds[(i + 1) * 2] = containerCx + Math.cos(angle) * radius;
            seeds[(i + 1) * 2 + 1] = containerCy + Math.sin(angle) * radius;
        }

        // 120 iterations, root pinned at center (index 0)
        const l1Cells = weightedVoronoi(
            allItems,
            [0, 0, containerSide, containerSide],
            120,
            seeds,
            new Set([0]),
        );
        // Remove root cell — root positioned separately
        l1Cells.delete(rootNode.id);

        // ── Phase 2: Per-region flat voronoi with polygon clipping ──
        const positions = new Map<string, { x: number; y: number }>();

        // Root at center
        positions.set(rootNode.id, {
            x: containerCx - rootDims.width / 2,
            y: containerCy - rootDims.height / 2,
        });

        for (const l1Id of l1ChildIds) {
            const cellInfo = l1Cells.get(l1Id);
            if (!cellInfo) continue;

            // Shrink polygon for breathing room (between regions + root)
            const regionPoly = shrinkPolygon(cellInfo.polygon, spacing * 0.4);
            if (polygonArea(regionPoly) < spacing * spacing) continue;

            const descIds = collectDescendants([l1Id], edges);
            const regionNodeIds = [...descIds];

            const regionPositions = flatVoronoiInRegion(
                regionNodeIds, nodeMap, childrenMap, subtreeAreas,
                l1Id, regionPoly,
                containerCx, containerCy,
                Math.max(baseIter - 10, 30),
            );

            regionPositions.forEach((pos, id) => positions.set(id, pos));
        }

        // Offset so root = (0, 0)
        const rootPos = positions.get(rootNode.id)!;
        const ox = -rootPos.x;
        const oy = -rootPos.y;

        const result = new Map<string, { x: number; y: number }>();
        positions.forEach((pos, id) => {
            result.set(id, { x: pos.x + ox, y: pos.y + oy });
        });

        return result;
    }

    private fallbackPack(
        nodes: Node[], edges: Edge[], spacing: number,
    ): Map<string, { x: number; y: number }> {
        const rootNode = findRootNode(nodes, edges);
        const positions = new Map<string, { x: number; y: number }>();
        if (!rootNode) {
            let curY = 0;
            for (const n of nodes) {
                const { height } = getNodeDimensions(n);
                positions.set(n.id, { x: 0, y: curY });
                curY += height + spacing;
            }
            return positions;
        }
        const { width: rw } = getNodeDimensions(rootNode);
        positions.set(rootNode.id, { x: 0, y: 0 });
        let curY = 0;
        for (const n of nodes) {
            if (n.id === rootNode.id) continue;
            const { height } = getNodeDimensions(n);
            positions.set(n.id, { x: rw + spacing * 2, y: curY });
            curY += height + spacing;
        }
        return positions;
    }
}
