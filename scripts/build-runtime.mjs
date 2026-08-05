import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(rootDir, "scripts/app.js");
const sourceFiles = [
  "scripts/app-config.js",
  "scripts/app-core.js",
  "scripts/app-ui.js",
  "scripts/app-main.js"
];

function stripImports(source) {
  return source.replace(/^import[\s\S]*?from\s*["'][^"']+["'];\n?/gm, "");
}

function stripExports(source) {
  return source.replace(/^export\s+(?=(const|function))/gm, "");
}

function bundleSource() {
  return sourceFiles
    .map((relativePath) => {
      const source = readFileSync(resolve(rootDir, relativePath), "utf8");
      return `/* ${basename(relativePath)} */\n${stripExports(stripImports(source)).trim()}`;
    })
    .join("\n\n");
}

const bundled = `(() => {\n${bundleSource()}\n})();\n`;
writeFileSync(outputPath, bundled);
