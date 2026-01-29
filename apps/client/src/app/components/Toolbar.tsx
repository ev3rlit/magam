import { StickyNote, Square, Circle, Diamond, MousePointer2 } from 'lucide-react';
import React from 'react';

interface ToolbarProps {
    onAddNode: (type: 'sticky' | 'shape', shape?: 'rectangle' | 'circle' | 'diamond') => void;
}

export const Toolbar = ({ onAddNode }: ToolbarProps) => {
    const buttonStyle: React.CSSProperties = {
        padding: '8px',
        margin: '4px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'background-color 0.2s',
    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#f3f4f6',
                padding: '8px',
                borderRadius: '12px',
                display: 'flex',
                gap: '8px',
                zIndex: 10,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
        >
            <button style={buttonStyle} onClick={() => onAddNode('sticky')} title="Sticky Note">
                <StickyNote size={20} color="#d97706" />
            </button>
            <div style={{ width: '1px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
            <button style={buttonStyle} onClick={() => onAddNode('shape', 'rectangle')} title="Rectangle">
                <Square size={20} color="#374151" />
            </button>
            <button style={buttonStyle} onClick={() => onAddNode('shape', 'circle')} title="Circle">
                <Circle size={20} color="#374151" />
            </button>
            <button style={buttonStyle} onClick={() => onAddNode('shape', 'diamond')} title="Diamond">
                <Diamond size={20} color="#374151" />
            </button>
        </div>
    );
};
