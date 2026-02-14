import * as path from "path";
import * as fs from "fs";
import { transpile } from "../core/transpiler";
import { execute } from "../core/executor";

export async function renderCommand(filePath: string) {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(JSON.stringify({ error: `File not found: ${filePath}` }));
    process.exit(1);
  }

  try {
    const transpiled = await transpile(fullPath);
    const result = await execute(transpiled);

    if (result.isOk()) {
      console.log(JSON.stringify(result.value, null, 2));
    } else {
      console.error(
        JSON.stringify({
          error: result.error.message,
          type: result.error.type || "EXECUTION_ERROR",
        })
      );
      process.exit(1);
    }
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
