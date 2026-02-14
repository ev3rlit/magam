import * as path from "path";
import * as fs from "fs/promises";

/** targetDir 외부 경로 접근 차단 */
export function resolvePath(targetDir: string, filePath: string): string {
  const fullPath = path.resolve(targetDir, filePath);
  if (!fullPath.startsWith(path.resolve(targetDir))) {
    throw new Error("targetDir 외부 접근 불가");
  }
  return fullPath;
}

/** 파일 크기 제한 (1MB) */
const MAX_FILE_SIZE = 1024 * 1024;

export async function validateFileSize(filePath: string): Promise<void> {
  const stat = await fs.stat(filePath);
  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(
      `파일 크기 초과: ${stat.size} bytes (최대 ${MAX_FILE_SIZE})`
    );
  }
}

/** neverthrow Result → MCP 에러 응답 변환 */
export function toMcpError(error: any): {
  content: { type: "text"; text: string }[];
  isError: true;
} {
  return {
    content: [
      { type: "text" as const, text: error.message || String(error) },
    ],
    isError: true,
  };
}

/** 성공 데이터 → MCP 응답 변환 */
export function toMcpSuccess(data: any): {
  content: { type: "text"; text: string }[];
} {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data),
      },
    ],
  };
}
