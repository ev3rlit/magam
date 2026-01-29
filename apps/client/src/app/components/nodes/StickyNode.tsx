import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useSocket } from '../../hooks/useSocket';

interface StickyNodeData {
    content: string;
    backgroundColor?: string;
}

export const StickyNode = memo(({ id, data, selected }: NodeProps<StickyNodeData>) => {
    const bgColor = data.backgroundColor || '#fef3c7';
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(data.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { setNodes } = useReactFlow();
    const { emit } = useSocket();

    useEffect(() => {
        setContent(data.content);
    }, [data.content]);

    const handleDoubleClick = () => {
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        // Update global state via setNodes
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    node.data = { ...node.data, content };
                }
                return node;
            })
        );
        emit('canvas:updateNodeData', { nodeId: id, data: { content } });
    };

    const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(evt.target.value);
    };

    return (
        <div
            onDoubleClick={handleDoubleClick}
            style={{
                padding: '16px',
                borderRadius: '4px',
                backgroundColor: bgColor,
                border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
                width: '200px',
                height: '200px',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    style={{
                        width: '100%',
                        height: '100%',
                        resize: 'none',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                    }}
                />
            ) : (
                <div style={{ whiteSpace: 'pre-wrap', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                    {content || 'Double click to edit'}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
});

StickyNode.displayName = 'StickyNode';
