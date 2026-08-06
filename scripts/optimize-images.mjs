#!/usr/bin/env node
import fg from "fast-glob";
import fs from "fs";
import { createHash } from "crypto";

const webpFiles = await fg("assets/images/**/*.webp");

if (webpFiles.length === 0) {
  console.log("No WebP files found to optimize.");
  process.exit(0);
}

console.log(`🖼️  Analyzing ${webpFiles.length} WebP file(s) for optimization...`);
let totalSize = 0;

for (const file of webpFiles) {
  const stats = fs.statSync(file);
  const size = stats.size;
  totalSize += size;
  const sizeKb = (size / 1024).toFixed(1);
  const hash = createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
  console.log(`  ✓ ${file}: ${sizeKb} KB (hash: ${hash})`);
}

const totalSizeKb = (totalSize / 1024).toFixed(2);
console.log(`\n✅ Total WebP assets: ${totalSizeKb} KB across ${webpFiles.length} files`);
console.log("💡 Tip: Use cwebp -q 90 -alpha_q 100 -m 6 for production WebP optimization.");


