# Example: Adding a New Image Asset

Scenario: You're adding a new "ice ability" visual effect. The designers provided `ice-ability-icon.png` (256×256 px, opaque white background).

## Step 1: Prepare & Remove Background

```bash
# Source image: /tmp/ice-ability-icon.png
# Check the file
file /tmp/ice-ability-icon.png
# Output: PNG image data, 256 x 256, 8-bit/color RGBA, ...

# Remove background using rembg
rembg i /tmp/ice-ability-icon.png /tmp/ice-ability-icon-nobg.png

# Verify transparent background
file /tmp/ice-ability-icon-nobg.png
# Output: PNG image data, 256 x 256, 8-bit/color RGBA, has transparency...
```

## Step 2: Convert to WebP

```bash
# Convert with project standard settings
cwebp -q 90 -alpha_q 100 -m 6 /tmp/ice-ability-icon-nobg.png -o assets/images/ice-ability-icon.webp

# Verify output
file assets/images/ice-ability-icon.webp
# Output: WEBP image data, 256 x 256, Alpha, ...

ls -lh assets/images/ice-ability-icon.webp
# Example output:
# -rw-r--r--  1 user  staff  18K Aug  6 10:00 ice-ability-icon.webp
```

Size comparison: PNG ~85 KB → WebP ~18 KB (79% savings)

## Step 3: Optimize

```bash
# Run project's optimization script
npm run optimize:images

# Output might show:
# Analyzing assets/images/ice-ability-icon.webp...
# Current: 18 KB
# Optimal: 17 KB (can compress further with -q 85)
# Apply? (yes/no)

# If optimization available, apply it:
# npm run optimize:images
# (typically saves 1-2% more)
```

## Step 4: Add to Config

```typescript
// scripts/config/app-config.ts
export const ASSET_PATHS = {
  heroSprite: '/assets/images/hero-sprite-alpha.webp',
  enemySprite: '/assets/images/enemy_orco.webp',
  abilityIceIcon: '/assets/images/ice-ability-icon.webp',  // ← NEW
  // ... other paths
};
```

## Step 5: Use in UI

### HTML

```html
<!-- index.html -->
<div class="ability-row">
  <img src="/assets/images/ice-ability-icon.webp" alt="Ice Ability">
  <span class="ability-name">Frost Strike</span>
</div>
```

### CSS

```css
/* styles/board/ability-icons.css */
.ability-row img {
  width: 64px;
  height: 64px;
  background: var(--bg-panel-surface);
  border-radius: var(--radius-base);
  border: 1px solid var(--ability-ice-border);
}

.ability-row img[alt="Ice Ability"] {
  box-shadow: 0 0 8px var(--ability-ice-glow);
}
```

### TypeScript

```typescript
// scripts/ui/ability-display.ts
import { ASSET_PATHS } from '../config/app-config';

function createAbilityCard(ability) {
  const card = document.createElement('div');
  card.className = 'ability-card';
  
  const img = document.createElement('img');
  img.src = ASSET_PATHS.abilityIceIcon;  // Use config path
  img.alt = ability.name;
  
  card.appendChild(img);
  return card;
}
```

## Step 6: Verify in Tests

```bash
# Build + compile
npm run build:runtime

# Run e2e tests
npm run test:chromium

# If layout/visual changed, update snapshots
npm run test:chromium -- --update-snapshots
```

Verify test output:
```
✓ ability icons load correctly
✓ ice icon displays on ability card
✓ visual regression snapshots match
```

## Step 7: Commit

```bash
# Stage the asset
git add assets/images/ice-ability-icon.webp

# Verify file in git
git status
# Output:
# new file:   assets/images/ice-ability-icon.webp

# Add config + code + snapshots
git add scripts/config/app-config.ts
git add scripts/ui/ability-display.ts
git add styles/board/ability-icons.css
git add tests/e2e/visual-regression.spec.js-snapshots/  # If needed

# Commit atomically
git commit -m "feat(ui): add ice ability icon and display

- New asset: ice-ability-icon.webp (18 KB, transparent)
- Added to ASSET_PATHS config
- Display component in ability-display.ts
- Icon styling with glow effect
- E2E tests for icon rendering
- Updated visual snapshots

Related-to #47"

# Verify commit
git show --stat HEAD
# Output shows all changed files
```

## Step 8: Push & Verify in CI

```bash
git push origin feature/ice-ability
```

CI will:
1. ✅ Verify image is WebP format (not PNG)
2. ✅ Run tests (icon loads, tests pass)
3. ✅ Check no `node_modules/` or generated files in commit
4. ✅ Verify TypeScript + CSS lint

If all pass → Ready for merge!

---

## Troubleshooting This Example

### "Icon looks blurry in browser"

**Cause**: WebP quality too low for 256×256 detailed icon

**Fix**: Re-convert with higher quality
```bash
cwebp -q 95 -alpha_q 100 -m 6 /tmp/ice-ability-icon-nobg.png -o assets/images/ice-ability-icon.webp
```

### "Background not fully removed by rembg"

**Cause**: Icon has drop shadow or anti-aliasing that rembg keeps

**Fix**: Accept slight imperfection or manually clean in Photoshop

### "Icon shows as broken image in tests"

**Cause**: Path reference mismatch

**Debug**:
1. Check `ASSET_PATHS.abilityIceIcon` matches actual file path
2. Verify file exists: `ls -l assets/images/ice-ability-icon.webp`
3. Check HTML `<img src="...">` uses correct path
4. Open DevTools Network tab to see actual request

### "Git won't let me commit .webp file"

**Cause**: `.gitignore` excludes WebP

**Fix**: Verify `.gitignore` allows `assets/images/*.webp`

```bash
cat .gitignore | grep -i webp
# Should show nothing or only "# Allow WebP"

# If excluded, update .gitignore
echo "# WebP images are project assets (allowed)" >> .gitignore
git add .gitignore
```

---

## See Also

- [SKILL.md](../SKILL.md) for workflow overview
- [webp-pipeline.md](../references/webp-pipeline.md) for technical details
- [docs/assets.md](../../../docs/assets.md) for full asset architecture
