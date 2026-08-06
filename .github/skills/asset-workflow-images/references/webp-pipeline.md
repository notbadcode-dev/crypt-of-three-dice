# WebP Pipeline & Image Optimization

Reference for WebP compression details, optimization scripts, and quality/size tradeoffs.

## Conversion Command Deep Dive

```bash
cwebp -q 90 -alpha_q 100 -m 6 source.png -o target.webp
```

### Flags Explained

| Flag | Value | Purpose |
|------|-------|---------|
| `-q` | 90 | Quality (0-100). 90 = near-lossless, minimal visible loss |
| `-alpha_q` | 100 | Alpha channel quality (0-100). 100 = preserve transparency perfectly |
| `-m` | 6 | Compression method (0-6). 6 = maximum compression (slowest) |

### Quality vs Size Tradeoff

| Quality | Size (typical) | Visible Loss | Use Case |
|---------|---|---|---|
| `-q 75` | 50-60% of PNG | Noticeable | Very large backgrounds |
| `-q 85` | 60-70% of PNG | Slight (edges) | General assets |
| `-q 90` | 70-80% of PNG | **Minimal** | **Default for project** |
| `-q 95` | 80-90% of PNG | Imperceptible | High-detail sprites |

**Project standard**: `-q 90 -alpha_q 100` balances quality with size reduction.

### Alpha Channel

Images with transparency (game sprites) must preserve alpha:

```bash
# ✅ Correct: preserve alpha
cwebp -q 90 -alpha_q 100 -m 6 sprite.png -o sprite.webp

# ❌ Wrong: loses transparency
cwebp -q 90 sprite.png -o sprite.webp  # alpha_q defaults to 100, but verify
```

**Verify transparency preserved**:
```bash
# Check if .webp has alpha channel
file sprite.webp
# Output should mention "Alpha" or similar

# Visual check: overlay on dark background
# Should show transparent areas, not solid color
```

---

## Background Removal: `rembg`

### Installation

```bash
# One-time installation
pip install rembg

# Uses u2net model (deep learning, ~400MB download on first run)
```

### Usage

```bash
rembg i input.png output.png
```

- Input: PNG/JPG with opaque background
- Output: PNG with transparent background (alpha channel)
- Time: ~5-10 seconds per image (CPU-dependent)

### Model Details

Project uses `rembg`'s default model (`u2net`), which:
- Segments foreground (object/person) from background
- Outputs PNG with alpha channel
- Works well for game sprites, character portraits
- May fail on complex composites or text-heavy images

### Quality Issues

**Problem**: `rembg` removes too much (hair, cloth, shadow)

**Solutions**:
1. Pre-crop image to focus on subject
2. Use Photoshop/GIMP to manually adjust alpha mask
3. Accept slight over-removal (small sprites are forgiving)

**Example**: If hero portrait has frizzy hair and `rembg` removes it, you can:
- Accept result + proceed to `cwebp`
- Re-run with manually cropped version
- Manually restore alpha in image editor

---

## Optimization Script: `scripts/optimize-images.mjs`

### What It Does

```bash
npm run optimize:images
```

Scans all `.webp` files in `assets/images/` and:

1. **Re-analyzes compression**: Tests different cwebp settings
2. **Identifies savings**: If better compression possible, reports it
3. **Applies optimizations**: Re-compresses if improvement > threshold
4. **Logs results**: Shows file-by-file savings

### Output Example

```
Optimizing assets/images/hero-sprite-alpha.webp...
Before: 45 KB
After:  38 KB (15% smaller)
Savings: 7 KB

assets/images/enemy_orco.webp already optimal
```

### When to Run

- **Before production build**: `npm run build:dist` (recommended before)
- **After adding new images**: Manual quality check
- **Before committing large images**: Ensure efficient storage

### Threshold

Only re-compresses if savings > 1% of file size.

---

## Production Build: `build:dist` Hashing

### How Hashing Works

During `npm run build:dist`:

1. **Original file**: `assets/images/hero-sprite-alpha.webp`
2. **Content hash calculated**: SHA256 of file content
3. **Hashed filename**: `hero-sprite-alpha-abc123.webp` (first 8 chars of hash)
4. **References updated**:
   - HTML `<img src="/assets/images/hero-sprite-alpha.webp">` → `<img src="/assets/images/hero-sprite-alpha-abc123.webp">`
   - CSS `url(/assets/images/hero-sprite-alpha.webp)` → `url(/assets/images/hero-sprite-alpha-abc123.webp)`
   - TypeScript config paths auto-updated

### Browser Caching

- **Browser default**: Cache images with long expiry (1 year)
- **Hash changes only when file changes**: Different content = different hash
- **Old hashes never requested**: Old version not in dist/ anymore
- **Cache always valid**: New hash = new version = always fetch

**Result**: Optimal cache busting with zero stale-file issues.

### In `dist/` Structure

```
dist/
├── index.html           (updated refs)
├── styles/app-abc123.css  (hashed)
├── scripts/app-xyz789.js  (hashed)
└── assets/
    └── images/
        ├── hero-sprite-alpha-abc123.webp  (hashed)
        ├── enemy_orco-def456.webp         (hashed)
        └── old-image-xyz789.webp          (deleted if not referenced)
```

---

## File Size Estimates

Typical sprite sizes after WebP conversion:

| Image Type | Source PNG | WebP (-q90) | Savings |
|---|---|---|---|
| Hero portrait (200×300) | 150 KB | 35 KB | 77% |
| Enemy sprite (128×128) | 60 KB | 12 KB | 80% |
| Background (1440×900) | 500 KB | 90 KB | 82% |
| Icon (32×32) | 5 KB | 1 KB | 80% |

**Total savings**: Project images typically 80% smaller as WebP vs PNG.

---

## Tools & Troubleshooting

### Verify WebP Quality

```bash
# Side-by-side comparison
# 1. Open original PNG
# 2. Open converted .webp in browser
# 3. Compare visually (should look identical)

# Check file info
file hero-sprite-alpha.webp
# Output: "WEBP image data, 200 x 300, Lossless/Lossy, ..."
```

### Re-optimize if Needed

```bash
# Re-run conversion with higher quality
cwebp -q 95 -alpha_q 100 -m 6 source.png -o target.webp

# Or lower quality if size is critical
cwebp -q 85 -alpha_q 100 -m 6 source.png -o target.webp
```

### Batch Convert Multiple Images

```bash
# Convert all PNG files in a folder
for f in *.png; do
  cwebp -q 90 -alpha_q 100 -m 6 "$f" -o "${f%.png}.webp"
done
```

---

## See Also

- [SKILL.md](../SKILL.md) for workflow overview
- [add-new-image.md](examples/add-new-image.md) for step-by-step example
- [docs/assets.md](../../../docs/assets.md) for full asset architecture
