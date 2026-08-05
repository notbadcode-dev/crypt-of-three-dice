import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(rootDir, "scripts/app.js");
const compiledRootDir = resolve(rootDir, ".tsbuild");
const sourceFiles = [
  "scripts/config/types.js",
  "scripts/config/app-config.js",
  "scripts/state/app-state.js",
  "scripts/core/geometry.js",
  "scripts/state/persistence.js",
  "scripts/core/audio.js",
  "scripts/core/dice.js",
  "scripts/core/combat.js",
  "scripts/core/game-flow.js",
  "scripts/ui/ui-feedback.js",
  "scripts/ui/modal-manager.js",
  "scripts/ui/board-ui.js",
  "scripts/ui/hud-ui.js",
  "scripts/ui/save-load-ui.js",
  "scripts/ui/app-ui.js",
  "scripts/app-main.js"
];

function compileTypeScript() {
  const tscPath = resolve(rootDir, "node_modules/typescript/bin/tsc");
  execFileSync(process.execPath, [tscPath, "--project", resolve(rootDir, "tsconfig.json")], {
    cwd: rootDir,
    stdio: "inherit"
  });
}

function stripImports(source) {
  return source.replace(/^import[\s\S]*?from\s*["'][^"']+["'];\n?/gm, "");
}

function stripExports(source) {
  return source.replace(/^export\s+(?=(const|function))/gm, "");
}

function bundleSource() {
  return sourceFiles
    .map((relativePath) => {
      const source = readFileSync(resolve(compiledRootDir, relativePath), "utf8");
      return `/* ${basename(relativePath)} */\n${stripExports(stripImports(source)).trim()}`;
    })
    .join("\n\n");
}

compileTypeScript();
const bundled = `(() => {\n${bundleSource()}\n})();\n`;
writeFileSync(outputPath, bundled);
console.log(`✓ Built app.js from ${sourceFiles.length} modules`);
