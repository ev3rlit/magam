import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources } from "./resources";
import { registerTools } from "./tools";

export function createMcpServer(targetDir: string): McpServer {
  const server = new McpServer({
    name: "graphwrite",
    version: "0.1.0",
  });

  registerResources(server, targetDir);
  registerTools(server, targetDir);

  return server;
}
