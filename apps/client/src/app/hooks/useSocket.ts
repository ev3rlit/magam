import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket.service';

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        socketService.connect();

        const socket = socketService.getSocket();
        if (socket) {
            socket.on('connect', () => setIsConnected(true));
            socket.on('disconnect', () => setIsConnected(false));
        }

        return () => {
            socketService.disconnect();
        };
    }, []);

    const emit = useCallback((event: string, data: unknown) => {
        socketService.emit(event, data);
    }, []);

    const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
        socketService.on(event, callback);
        return () => socketService.off(event, callback);
    }, []);

    return { isConnected, emit, subscribe };
}
