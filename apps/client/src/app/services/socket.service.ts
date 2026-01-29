import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3333';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, data: unknown) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event: string, callback: (data: unknown) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string, callback?: (data: unknown) => void) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
