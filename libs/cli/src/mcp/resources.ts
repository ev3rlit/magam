import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import * as path from "path";

export function registerResources(server: McpServer, targetDir: string) {
  server.registerResource(
    "skill",
    "graphwrite://skill",
    {
      mimeType: "text/markdown",
      description: "GraphWrite 컴포넌트 문서 (SKILL.md)",
    },
    async () => {
      // Try multiple locations for SKILL.md
      const candidates = [
        path.resolve(targetDir, ".agent/skills/graphwrite/SKILL.md"),
        path.resolve(process.cwd(), ".agent/skills/graphwrite/SKILL.md"),
        path.resolve(__dirname, "../../../../.agent/skills/graphwrite/SKILL.md"),
      ];

      for (const skillPath of candidates) {
        try {
          const text = fs.readFileSync(skillPath, "utf-8");
          return {
            contents: [
              { uri: "graphwrite://skill", mimeType: "text/markdown", text },
            ],
          };
        } catch {
          // Try next candidate
        }
      }

      return {
        contents: [
          {
            uri: "graphwrite://skill",
            mimeType: "text/plain",
            text: "SKILL.md를 찾을 수 없습니다.",
          },
        ],
      };
    }
  );
}
