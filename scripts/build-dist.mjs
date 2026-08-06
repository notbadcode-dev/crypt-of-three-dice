#!/usr/bin/env node
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { bundle, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Bundle + minify styles: resuelve la cadena de @import de styles/app.css en
// un único fichero (evita el waterfall de peticiones @import en producción),
// minifica y transpila sintaxis moderna (p.ej. nesting nativo) según los
// navegadores objetivo, con fallback automático para los que no la soporten.
const stylesDir = path.join(distDir, "styles");
if (fs.existsSync(stylesDir)) {
  fs.rmSync(stylesDir, { recursive: true });
}
fs.mkdirSync(stylesDir, { recursive: true });

const appCssPath = path.join(rootDir, "styles", "app.css");
const targets = browserslistToTargets(browserslist("defaults, not IE 11"));
const { code: appCssBuffer, warnings } = bundle({
  filename: appCssPath,
  minify: true,
  sourceMap: false,
  targets
});

if (warnings.length > 0) {
  console.warn("⚠️  Avisos de lightningcss:", warnings);
}

// lightningcss `bundle()` inlina el contenido de cada @import tal cual, sin
// reescribir sus url() relativas a la nueva ubicación del fichero combinado.
// Todos los ficheros de styles/<subcarpeta>/*.css están un nivel más profundos
// que styles/app.css, así que sus url() usan "../../assets/..."; el bundle
// final vive en la misma posición relativa que app.css, por lo que la ruta
// correcta es "../assets/...". Se reescribe aquí y se valida que cada asset
// referenciado exista, para detectar cualquier cambio futuro de profundidad.
const appCssContent = appCssBuffer
  .toString("utf-8")
  .replaceAll("../../assets/", "../assets/");

const referencedAssets = [...appCssContent.matchAll(/url\((?!data:)([^)]+)\)/g)].map(
  (match) => match[1].replace(/^["']|["']$/g, "")
);
const missingAssets = referencedAssets.filter(
  (relativeUrl) => !fs.existsSync(path.resolve(rootDir, "styles", relativeUrl))
);
if (missingAssets.length > 0) {
  console.error("❌ Assets referenciados en el CSS final que no existen:", missingAssets);
  process.exit(1);
}

const cssHash = crypto.createHash("sha256").update(appCssContent).digest("hex").slice(0, 8);
const hashedAppCss = `app.${cssHash}.css`;
fs.writeFileSync(path.join(stylesDir, hashedAppCss), appCssContent);

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

// Read HTML and replace script + stylesheet src
let htmlContent = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");
htmlContent = htmlContent.replace(
  /src="scripts\/app\.js"/,
  `src="scripts/${hashedAppJs}"`
);
htmlContent = htmlContent.replace(
  /href="styles\/app\.css"/,
  `href="styles/${hashedAppCss}"`
);

// Write modified HTML to dist
fs.writeFileSync(path.join(distDir, "index.html"), htmlContent);

console.log(`✅ Built dist/ with cache-busting`);
console.log(`  App script: ${hashedAppJs} (hash: ${hash})`);
console.log(`  App styles: ${hashedAppCss} (hash: ${cssHash})`);
console.log(`  Output: dist/index.html`);
