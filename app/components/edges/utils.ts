import { Node, Position } from 'reactflow';

// Extended node type with measured dimensions (added by React Flow after rendering)
type MeasuredNode = Node & { measured?: { width: number; height: number } };

/**
 * Get the center point of a node
 */
export function getNodeCenter(node: MeasuredNode): { x: number; y: number } {
    const width = node.width ?? node.measured?.width ?? 150;
    const height = node.height ?? node.measured?.height ?? 50;

    return {
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
    };
}

/**
 * Get intersection point between a line from center to target and a rectangle boundary
 */
export function getRectangleIntersection(
    node: MeasuredNode,
    targetPoint: { x: number; y: number }
): { x: number; y: number; position: Position } {
    const width = node.width ?? node.measured?.width ?? 150;
    const height = node.height ?? node.measured?.height ?? 50;

    const centerX = node.position.x + width / 2;
    const centerY = node.position.y + height / 2;

    const dx = targetPoint.x - centerX;
    const dy = targetPoint.y - centerY;

    // If target is at same position, return center
    if (dx === 0 && dy === 0) {
        return { x: centerX, y: centerY, position: Position.Right };
    }

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Calculate intersection with rectangle boundary
    // Check which edge the line intersects first
    let t: number;
    let position: Position;

    if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
        // Intersects left or right edge
        if (dx > 0) {
            t = halfWidth / dx;
            position = Position.Right;
        } else {
            t = -halfWidth / dx;
            position = Position.Left;
        }
    } else {
        // Intersects top or bottom edge
        if (dy > 0) {
            t = halfHeight / dy;
            position = Position.Bottom;
        } else {
            t = -halfHeight / dy;
            position = Position.Top;
        }
    }

    return {
        x: centerX + dx * t,
        y: centerY + dy * t,
        position,
    };
}

/**
 * Get intersection point between a line from center to target and a circle boundary
 */
export function getCircleIntersection(
    node: MeasuredNode,
    targetPoint: { x: number; y: number }
): { x: number; y: number; position: Position } {
    const width = node.width ?? node.measured?.width ?? 150;
    const height = node.height ?? node.measured?.height ?? 150;

    const centerX = node.position.x + width / 2;
    const centerY = node.position.y + height / 2;
    const radius = Math.min(width, height) / 2;

    const dx = targetPoint.x - centerX;
    const dy = targetPoint.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If target is at same position, return a point on the right
    if (distance === 0) {
        return { x: centerX + radius, y: centerY, position: Position.Right };
    }

    // Normalize and scale to radius
    const x = centerX + (dx / distance) * radius;
    const y = centerY + (dy / distance) * radius;

    // Determine position based on angle
    const angle = Math.atan2(dy, dx);
    let position: Position;

    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
        position = Position.Right;
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
        position = Position.Bottom;
    } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
        position = Position.Top;
    } else {
        position = Position.Left;
    }

    return { x, y, position };
}

/**
 * Get intersection based on node shape type
 */
export function getNodeIntersection(
    node: MeasuredNode,
    targetPoint: { x: number; y: number },
    shapeType?: string
): { x: number; y: number; position: Position } {
    switch (shapeType) {
        case 'circle':
            return getCircleIntersection(node, targetPoint);
        case 'triangle':
            // For now, treat triangle as rectangle (can be improved later)
            return getRectangleIntersection(node, targetPoint);
        case 'rectangle':
        default:
            return getRectangleIntersection(node, targetPoint);
    }
}

/**
 * Generate SVG path between two points
 */
export function getFloatingEdgePath(
    sourceX: number,
    sourceY: number,
    sourcePosition: Position,
    targetX: number,
    targetY: number,
    targetPosition: Position,
): string {
    // Simple straight line for now
    // Can be enhanced to use bezier curves or smoothstep
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use a simple curve based on distance
    const curvature = Math.min(distance * 0.2, 50);

    // Calculate control points for a smooth curve
    let controlX1 = sourceX;
    let controlY1 = sourceY;
    let controlX2 = targetX;
    let controlY2 = targetY;

    // Adjust control points based on exit/entry direction
    switch (sourcePosition) {
        case Position.Right:
            controlX1 = sourceX + curvature;
            break;
        case Position.Left:
            controlX1 = sourceX - curvature;
            break;
        case Position.Top:
            controlY1 = sourceY - curvature;
            break;
        case Position.Bottom:
            controlY1 = sourceY + curvature;
            break;
    }

    switch (targetPosition) {
        case Position.Right:
            controlX2 = targetX + curvature;
            break;
        case Position.Left:
            controlX2 = targetX - curvature;
            break;
        case Position.Top:
            controlY2 = targetY - curvature;
            break;
        case Position.Bottom:
            controlY2 = targetY + curvature;
            break;
    }

    return `M ${sourceX},${sourceY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${targetX},${targetY}`;
}
