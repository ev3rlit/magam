import * as path from "path";
import * as fs from "fs";
import { transpile } from "../core/transpiler";
import { execute } from "../core/executor";

export async function validateCommand(filePath: string) {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`✗ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const transpiled = await transpile(fullPath);
    const result = await execute(transpiled);

    if (result.isOk()) {
      console.log("✓ Validation passed");
    } else {
      console.error(`✗ Execution error: ${result.error.message}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`✗ Transpile error: ${error.message}`);
    process.exit(1);
  }
}
