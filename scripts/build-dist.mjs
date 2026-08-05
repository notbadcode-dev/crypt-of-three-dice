#!/usr/bin/env node
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy styles
const stylesDir = path.join(distDir, "styles");
if (fs.existsSync(stylesDir)) {
  fs.rmSync(stylesDir, { recursive: true });
}
fs.cpSync(path.join(rootDir, "styles"), stylesDir, { recursive: true });

// Copy assets
const assetsDir = path.join(distDir, "assets");
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true });
}
fs.cpSync(path.join(rootDir, "assets"), assetsDir, { recursive: true });

// Read and hash app.js for cache-busting
const appJsPath = path.join(rootDir, "scripts", "app.js");
const appJsContent = fs.readFileSync(appJsPath);
const hash = crypto.createHash("sha256").update(appJsContent).digest("hex").slice(0, 8);
const hashedAppJs = `app.${hash}.js`;

// Copy app.js with hash
const scriptsDir = path.join(distDir, "scripts");
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}
fs.copyFileSync(appJsPath, path.join(scriptsDir, hashedAppJs));

// Read HTML and replace script src
let htmlContent = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");
htmlContent = htmlContent.replace(
  /src="scripts\/app\.js"/,
  `src="scripts/${hashedAppJs}"`
);

// Write modified HTML to dist
fs.writeFileSync(path.join(distDir, "index.html"), htmlContent);

console.log(`✅ Built dist/ with cache-busting`);
console.log(`  App script: ${hashedAppJs} (hash: ${hash})`);
console.log(`  Output: dist/index.html`);
