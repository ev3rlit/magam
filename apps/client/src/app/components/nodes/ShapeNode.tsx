import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export type ShapeType = 'rectangle' | 'circle' | 'diamond';

interface ShapeNodeData {
    shape?: ShapeType;
    label?: string;
    backgroundColor?: string;
    width?: number;
    height?: number;
}

export const ShapeNode = memo(({ data, selected }: NodeProps<ShapeNodeData>) => {
    const shape = data.shape || 'rectangle';
    const bgColor = data.backgroundColor || '#ffffff';
    const width = data.width || 100;
    const height = data.height || 100;
    const label = data.label || '';

    const commonStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '12px',
        position: 'relative',
    };

    const getShapeStyle = (): React.CSSProperties => {
        const base = {
            backgroundColor: bgColor,
            border: selected ? '2px solid #3b82f6' : '2px solid #374151',
            ...commonStyle,
        };

        if (shape === 'rectangle') {
            return { ...base, borderRadius: '4px' };
        } else if (shape === 'circle') {
            return { ...base, borderRadius: '50%' };
        } else if (shape === 'diamond') {
            return {
                ...base,
                transform: 'rotate(45deg)',
                backgroundColor: bgColor,
            };
        }
        return base;
    };

    return (
        <div style={{ width: `${width}px`, height: `${height}px` }}>
            <div style={getShapeStyle()}>
                <div style={shape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}}>
                    {label}
                </div>
            </div>

            {/* Handles need to be positioned appropriately based on shape, 
                but for simplicity we'll keep standard top/bottom/left/right for now. 
                Diamond might need special handling if we want strict edge connection,
                maybe standard handles are fine. */}

            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
});

ShapeNode.displayName = 'ShapeNode';
