---
name: "asset-workflow-images"
description: "Image asset workflow: WebP conversion, background removal, optimization, and integration"
compatibility: "Essential when adding new images; prerequisite for visual assets in features"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# Asset Workflow: Images

This skill covers the pipeline for adding, optimizing, and integrating image assets.

## Quick Reference

| Task | Tool/Command | When |
|------|--------------|------|
| Convert PNG to WebP | `cwebp -q 90 -alpha_q 100 -m 6 in.png -o out.webp` | New image source |
| Remove background (sprite/portrait) | `rembg i input.png output.png` | Character/sprite images |
| Optimize all WebP in repo | `npm run optimize:images` | Before production build |
| Check image references | Search codebase | Verify `src=` paths updated |
| Update visual snapshots | `npm run test:chromium -- --update-snapshots` | After image changes |

---

## The WebP-Only Rule

**All images in the project must be WebP format.** No PNG, JPG, or other formats in the final bundle.

**Why WebP?**
- Smaller file size than PNG/JPG (better for game performance)
- Supports transparency (alpha channel)
- Better compression for sprites + portraits

**Conversion Quality**:
```bash
cwebp -q 90 -alpha_q 100 -m 6 source.png -o target.webp
```

- `-q 90`: 90% quality (lossy, barely visible compression loss)
- `-alpha_q 100`: Keep alpha channel at 100% quality (crisp transparency)
- `-m 6`: Maximum compression effort (slower, better ratio)

---

## Image Sources & Types

### Location: `assets/images/`

All images live here, organized by type:

| Subfolder | Contents | Examples | Format |
|-----------|----------|----------|--------|
| `assets/images/` | Game sprites, backgrounds | `hero-sprite-alpha.webp`, `enemy_orco.webp` | `.webp` |
| `assets/icons/` | UI icons | Menu icons, status symbols | `.webp` |

### Image Types in Project

| Type | Source | Process | Result | Usage |
|------|--------|---------|--------|-------|
| **Hero portrait** | PNG with opaque BG | `rembg` + `cwebp` | `hero-sprite-alpha.webp` | HUD, modals |
| **Enemy sprite** | PNG with opaque BG | `rembg` + `cwebp` | `enemy_orco.webp` | Board, combat |
| **Background** | PNG (no BG removal needed) | `cwebp` directly | `bg-board.webp` | Board overlay |
| **Icon** | SVG or PNG | `cwebp` | `.webp` | Buttons, UI |

---

## Adding a New Image: Step-by-Step

### Step 1: Prepare Source Image

- Format: PNG or JPG (temporary source, not final)
- Size: Appropriate for use (hero portraits ~200×300px, icons ~32px)
- Store in `/tmp/` or local folder (not committed)

### Step 2: Remove Background (If Needed)

**For sprites, portraits, characters** (not backgrounds):

```bash
# Install rembg (one-time)
pip install rembg

# Remove background using u2net model
rembg i /tmp/hero-portrait.png /tmp/hero-portrait-nobg.png
```

**For backgrounds or images already transparent**: Skip this step.

### Step 3: Convert to WebP

```bash
cwebp -q 90 -alpha_q 100 -m 6 /tmp/hero-portrait-nobg.png -o assets/images/hero-portrait.webp
```

Result: `assets/images/hero-portrait.webp` (transparent background preserved)

### Step 4: Update References

**HTML**:
```html
<img src="/assets/images/hero-portrait.webp" alt="Hero portrait">
```

**CSS** (background image):
```css
.hero-portrait {
  background-image: url(/assets/images/hero-portrait.webp);
}
```

**TypeScript** (config):
```typescript
// scripts/config/app-config.ts
export const ASSET_PATHS = {
  heroPortrait: '/assets/images/hero-portrait.webp',
  // ... other paths
};

// Usage in UI:
import { ASSET_PATHS } from './app-config';
const img = new Image();
img.src = ASSET_PATHS.heroPortrait;
```

**Important**: Use the **WebP path**, never PNG/JPG original.

### Step 5: Optimize

```bash
npm run optimize:images
```

This runs `scripts/optimize-images.mjs`, which:
- Analyzes all `.webp` files in `assets/images/`
- Re-compresses if better compression possible
- Reports savings

### Step 6: Update Visual Snapshots

If image appears in Playwright visual regression tests:

```bash
npm run test:chromium -- --update-snapshots
```

Update snapshots for other projects if needed:
```bash
npm run test:webkit -- --update-snapshots
npm run test:mobile -- --update-snapshots
```

### Step 7: Verify & Commit

```bash
# Check image file exists
ls -lh assets/images/hero-portrait.webp

# Verify references work (open in browser)
# Verify in tests
npm run test:chromium

# Commit
git add assets/images/hero-portrait.webp
git commit -m "assets: add hero portrait sprite (WebP)"
```

---

## Production Build: Hashing & Bundling

When running `npm run build:dist`:

1. All images in `assets/images/` are **hash-busted**
   - `hero-portrait.webp` → `hero-portrait-abc123def.webp`
   - Hash changes only when file content changes

2. References in HTML/CSS are **auto-updated**
   - `<img src="/assets/images/hero-portrait.webp">` → `<img src="/assets/images/hero-portrait-abc123def.webp">`
   - CSS `url()` paths also updated

3. Old hashed versions are **cleaned up**
   - Only latest version kept in `dist/`

**Result**: Browsers cache images aggressively (hash = version ID); old hashes never used after deploy.

---

## Current Assets Inventory

### Hero Assets

- `hero-sprite-alpha.webp`: Hero sprite for board + HUD (background removed)
- Used by: HUD portrait, hero portrait frame

### Enemy Assets

- `enemy_orco.webp`: Orc enemy sprite (background removed)
- Used by: Enemy card portrait, enemy sprite on board

### Backgrounds / UI

- Various WebP backgrounds (if any)

### Configuration

`scripts/config/app-config.ts` contains all asset paths:

```typescript
export const ASSET_PATHS = {
  heroSprite: '/assets/images/hero-sprite-alpha.webp',
  heroHudPortrait: '/assets/images/hero-sprite-alpha.webp',
  enemySprite: '/assets/images/enemy_orco.webp',
  // ... add new images here
};
```

---

## Common Mistakes (Avoid These)

### ❌ Commit PNG / JPG to Repo

```bash
git add assets/images/hero.png
```

**Wrong!** Only WebP allowed. Convert first:
```bash
cwebp -q 90 -alpha_q 100 -m 6 hero.png -o hero.webp
git add assets/images/hero.webp  # Correct
```

### ❌ Use PNG Path in HTML/CSS

```html
<img src="/assets/images/hero.png">  <!-- ❌ Wrong -->
<img src="/assets/images/hero.webp">  <!-- ✅ Correct -->
```

### ❌ Forget to Update References

```typescript
// Old code
const img = new Image();
img.src = '/assets/images/old-sprite.webp';

// New code
const img = new Image();
img.src = ASSET_PATHS.heroSprite;  // Use config path
```

### ❌ Don't Optimize Before Commit

```bash
git add assets/images/hero-sprite.webp
git commit ...
# Forgot npm run optimize:images
```

Should always optimize first:
```bash
npm run optimize:images
npm run test:chromium -- --update-snapshots
git add assets/images/
git commit ...
```

---

## Troubleshooting

### Image Not Showing in Browser

1. **Check path in DevTools**: Open Network tab, search for image URL
2. **Verify WebP support**: Chrome/Firefox/Safari all support WebP
3. **Verify reference updated**: Search codebase for old PNG path
4. **Check alt attribute**: If using `<img>`, verify `alt="..."` is present

### Image Quality Loss After Conversion

1. Increase quality flag: `-q 95` instead of `-q 90`
2. Re-convert with: `cwebp -q 95 -alpha_q 100 -m 6 source.png -o target.webp`
3. Visual comparison: `cmp -l old.webp new.webp` (if different)

### Background Removal Failed

If `rembg` removes wrong area (e.g., sprite hair/cloth), try:

1. Pre-crop image to focus on subject
2. Use alternative background removal tool (manual in Photoshop)
3. Skip `rembg` and use PNG transparency as-is (if already transparent)

---

## See Also

- [webp-pipeline.md](references/webp-pipeline.md) for technical details on compression
- [add-new-image.md](references/examples/add-new-image.md) for full worked example
- [docs/assets.md](../../../docs/assets.md) for detailed asset architecture
