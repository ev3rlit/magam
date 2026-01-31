import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startServer, broadcast, stopServer } from './websocket';
import { WebSocketServer } from 'ws';

vi.mock('ws', () => {
  const mWebSocket = {
    send: vi.fn(),
    readyState: 1,
    on: vi.fn(),
  };

  const mWebSocketServer = {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      // Immediately trigger 'listening' event to resolve the promise
      if (event === 'listening') {
        setTimeout(() => handler(), 0);
      }
    }),
    clients: new Set([mWebSocket]),
    close: vi.fn((cb) => cb && cb()),
    address: vi.fn(() => ({ port: 3001 })),
  };

  const MockWebSocketServer = vi.fn(function (this: any) {
    return mWebSocketServer;
  });

  return {
    WebSocketServer: MockWebSocketServer,
    WebSocket: { OPEN: 1 },
    default: {
      Server: MockWebSocketServer,
      WebSocket: { OPEN: 1 },
    },
  };
});

// Mock net for port availability check
vi.mock('net', () => {
  return {
    createServer: vi.fn(() => ({
      once: vi.fn((event: string, handler: () => void) => {
        if (event === 'listening') {
          setTimeout(() => handler(), 0);
        }
      }),
      listen: vi.fn(),
      close: vi.fn(),
    })),
  };
});

describe('WebSocket Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  it('should start server on specified port', async () => {
    const port = 3001;
    const result = await startServer(port);
    expect(WebSocketServer).toHaveBeenCalledWith({ port });
    expect(result.port).toBe(port);
  });

  it('should broadcast message to connected clients', async () => {
    await startServer(3001);
    const msg = { type: 'test', payload: 'data' };

    broadcast(msg);

    const MockWSS = vi.mocked(WebSocketServer);
    const wssInstance = MockWSS.mock.results[0].value;
    const client = Array.from(wssInstance.clients)[0] as any;

    expect(client.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });

  it('should handle JSON serialization errors gracefully', async () => {
    await startServer(3001);
    const msg = { type: 'graph-update', payload: { id: 1 } };
    broadcast(msg);

    const MockWSS = vi.mocked(WebSocketServer);
    const wssInstance = MockWSS.mock.results[0].value;
    const client = Array.from(wssInstance.clients)[0] as any;

    expect(client.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });

  it('should call onMessage callback when message received', async () => {
    const onMessage = vi.fn();
    await startServer(3001, onMessage);

    const MockWSS = vi.mocked(WebSocketServer);
    const wssInstance = MockWSS.mock.results[0].value;

    // Get the connection handler passed to wss.on('connection', handler)
    const connectionHandler = wssInstance.on.mock.calls.find(
      (call: any) => call[0] === 'connection',
    )?.[1];

    expect(connectionHandler).toBeDefined();

    // Simulate connection
    const mockSocket = {
      on: vi.fn(),
      send: vi.fn(),
      readyState: 1,
    };
    connectionHandler(mockSocket);

    // Get the message handler passed to ws.on('message', handler)
    const messageHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'message',
    )?.[1];

    expect(messageHandler).toBeDefined();

    // Simulate message
    const msg = { type: 'hello' };
    messageHandler(JSON.stringify(msg));

    expect(onMessage).toHaveBeenCalledWith(msg, mockSocket);
  });
});
