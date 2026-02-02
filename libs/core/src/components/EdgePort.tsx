import * as React from 'react';
import { GraphwriteError } from '../errors';

export type EdgePortPosition = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | string;

export interface EdgePortProps {
    id: string;
    position?: EdgePortPosition;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
}

export const EdgePort: React.FC<EdgePortProps> = (props) => {
    if (!props.id) {
        throw new GraphwriteError("Missing required prop 'id'", 'props');
    }

    return React.createElement('graph-port', props);
};
