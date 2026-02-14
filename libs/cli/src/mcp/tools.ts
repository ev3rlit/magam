import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs/promises";
import { transpile } from "../core/transpiler";
import { execute } from "../core/executor";
import { resolvePath, validateFileSize, toMcpError, toMcpSuccess } from "./utils";

export function registerTools(server: McpServer, targetDir: string) {
  // --- render ---
  server.registerTool("render", {
    description:
      "다이어그램 TSX 파일을 렌더링하여 Graph AST(노드, 엣지, 레이아웃 그룹)를 반환합니다.",
    inputSchema: { filePath: z.string().describe("렌더링할 파일 경로") },
  }, async ({ filePath }) => {
    try {
      const fullPath = resolvePath(targetDir, filePath);
      await validateFileSize(fullPath);

      const transpiled = await transpile(fullPath);
      const result = await execute(transpiled);

      if (result.isOk()) return toMcpSuccess(result.value);
      return toMcpError(result.error);
    } catch (error: any) {
      return toMcpError(error);
    }
  });

  // --- validate ---
  server.registerTool("validate", {
    description: "TSX 코드의 문법과 실행 가능성을 검증합니다.",
    inputSchema: {
      filePath: z
        .string()
        .optional()
        .describe("검증할 파일 경로 (code와 택1)"),
      code: z
        .string()
        .optional()
        .describe("검증할 TSX 코드 문자열 (filePath와 택1)"),
    },
  }, async ({ filePath, code }) => {
    if (!filePath && !code) {
      return toMcpError(new Error("filePath 또는 code 중 하나는 필수입니다."));
    }

    let targetPath: string;
    const isTempFile = !filePath && !!code;

    try {
      if (filePath) {
        targetPath = resolvePath(targetDir, filePath);
      } else {
        targetPath = resolvePath(
          targetDir,
          `.tmp_validate_${Date.now()}.tsx`
        );
        await fs.writeFile(targetPath, code!, "utf-8");
      }

      await validateFileSize(targetPath);
      const transpiled = await transpile(targetPath);
      const result = await execute(transpiled);

      if (result.isOk()) return toMcpSuccess("검증 성공");
      return toMcpError(result.error);
    } catch (error: any) {
      return toMcpError(error);
    } finally {
      if (isTempFile) await fs.unlink(targetPath!).catch(() => {});
    }
  });

  // --- write_and_render ---
  server.registerTool("write_and_render", {
    description:
      "TSX 코드를 파일로 저장하고 렌더링 결과를 반환합니다. 파일 시스템 접근이 없는 환경용.",
    inputSchema: {
      filePath: z.string().describe("저장할 파일 경로"),
      code: z.string().describe("Magam TSX 코드"),
    },
  }, async ({ filePath, code }) => {
    try {
      const fullPath = resolvePath(targetDir, filePath);
      await fs.writeFile(fullPath, code, "utf-8");

      const transpiled = await transpile(fullPath);
      const result = await execute(transpiled);

      if (result.isOk()) return toMcpSuccess(result.value);
      return {
        content: [
          {
            type: "text" as const,
            text: `저장됨. 렌더링 에러: ${result.error.message}`,
          },
        ],
        isError: true as const,
      };
    } catch (error: any) {
      return toMcpError(error);
    }
  });
}
