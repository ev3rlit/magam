import { WebSocketServer, WebSocket } from 'ws';
import * as net from 'net';

const DEFAULT_PORT = 3001;
const ENV_VAR_NAME = 'GRAPHWRITE_WS_PORT';
const MAX_PORT_ATTEMPTS = 10;

let wss: WebSocketServer | null = null;

/**
 * Check if a port is available for use
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Find an available port starting from the preferred port
 */
async function findAvailablePort(preferredPort: number): Promise<number> {
  for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
    const port = preferredPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`Port ${port} is in use, trying ${port + 1}...`);
  }
  throw new Error(
    `Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts starting from ${preferredPort}`
  );
}

/**
 * Get the configured port from environment variable or use default
 */
function getConfiguredPort(): number {
  const envPort = process.env[ENV_VAR_NAME];
  if (envPort) {
    const parsed = parseInt(envPort, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
      return parsed;
    }
    console.warn(
      `Invalid ${ENV_VAR_NAME} value: ${envPort}. Using default port ${DEFAULT_PORT}`
    );
  }
  return DEFAULT_PORT;
}

export interface ServerResult {
  port: number;
}

/**
 * Start the WebSocket server
 * @param port - Optional port override. If not specified, uses GRAPHWRITE_WS_PORT env var or default (3001)
 * @param onMessage - Optional message handler
 * @returns The actual port the server is running on
 */
export async function startServer(
  port?: number,
  onMessage?: (message: any, ws: WebSocket) => void
): Promise<ServerResult> {
  if (wss) {
    console.warn('WebSocket server already running');
    // Return the current port if server is already running
    const address = wss.address();
    const currentPort =
      typeof address === 'object' && address ? address.port : DEFAULT_PORT;
    return { port: currentPort };
  }

  const preferredPort = port ?? getConfiguredPort();
  const actualPort = await findAvailablePort(preferredPort);

  return new Promise((resolve, reject) => {
    try {
      wss = new WebSocketServer({ port: actualPort });

      wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('error', console.error);

        if (onMessage) {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());
              onMessage(message, ws);
            } catch (error) {
              console.error('Failed to parse message:', error);
            }
          });
        }
      });

      wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
        reject(error);
      });

      wss.on('listening', () => {
        resolve({ port: actualPort });
      });
    } catch (error) {
      reject(error);
    }
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
