import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

export function startServer(port: number) {
  if (wss) {
    console.warn('WebSocket server already running');
    return;
  }
  wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('error', console.error);
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
}

export function broadcast(msg: any) {
  if (!wss) {
    return;
  }

  try {
    const data = JSON.stringify(msg);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  } catch (error) {
    console.error('Failed to broadcast message:', error);
  }
}

export function stopServer() {
  if (wss) {
    wss.close();
    wss = null;
  }
}
