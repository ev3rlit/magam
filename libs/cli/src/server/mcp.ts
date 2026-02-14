import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "../mcp/index";

export async function startMcpServer(targetDir: string): Promise<void> {
  const server = createMcpServer(targetDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}
