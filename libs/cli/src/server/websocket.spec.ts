import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startServer, broadcast, stopServer } from './websocket';
import { WebSocketServer } from 'ws';

vi.mock('ws', () => {
  const mWebSocket = {
    send: vi.fn(),
    readyState: 1,
  };

  const mWebSocketServer = {
    on: vi.fn(),
    clients: new Set([mWebSocket]),
    close: vi.fn((cb) => cb && cb()),
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

describe('WebSocket Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  it('should start server on specified port', () => {
    const port = 3001;
    startServer(port);
    expect(WebSocketServer).toHaveBeenCalledWith({ port });
  });

  it('should broadcast message to connected clients', () => {
    startServer(3001);
    const msg = { type: 'test', payload: 'data' };

    broadcast(msg);

    const MockWSS = vi.mocked(WebSocketServer);
    const wssInstance = MockWSS.mock.results[0].value;
    const client = Array.from(wssInstance.clients)[0] as any;

    expect(client.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });

  it('should handle JSON serialization errors gracefully', () => {
    startServer(3001);
    const msg = { type: 'graph-update', payload: { id: 1 } };
    broadcast(msg);

    const MockWSS = vi.mocked(WebSocketServer);
    const wssInstance = MockWSS.mock.results[0].value;
    const client = Array.from(wssInstance.clients)[0] as any;

    expect(client.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });
});
