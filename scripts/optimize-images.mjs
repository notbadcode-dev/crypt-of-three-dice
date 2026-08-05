#!/usr/bin/env node
import fg from "fast-glob";
import fs from "fs";
import { createHash } from "crypto";

const pngFiles = await fg("assets/images/**/*.png");

if (pngFiles.length === 0) {
  console.log("No PNG files found to optimize.");
  process.exit(0);
}

console.log(`🖼️  Analyzing ${pngFiles.length} PNG file(s) for optimization...`);
let totalSize = 0;

for (const file of pngFiles) {
  const stats = fs.statSync(file);
  const size = stats.size;
  totalSize += size;
  const sizeKb = (size / 1024).toFixed(1);
  const hash = createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
  console.log(`  ✓ ${file}: ${sizeKb} KB (hash: ${hash})`);
}

const totalSizeKb = (totalSize / 1024).toFixed(2);
console.log(`\n✅ Total PNG assets: ${totalSizeKb} KB across ${pngFiles.length} files`);
console.log("💡 Tip: Use imagemin, oxipng, or sharp CLI for production PNG optimization.");


