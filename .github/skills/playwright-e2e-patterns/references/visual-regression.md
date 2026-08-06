# Visual Regression Testing Strategy

Reference for snapshot testing, when to update, and managing visual diffs.

## What is Visual Regression Testing?

Visual regression tests capture screenshots of the app at key points and compare them to baseline snapshots. If UI layout/colors change unexpectedly, tests fail.

**Examples**:
- ✅ Board layout unchanged after CSS refactor → pass
- ❌ Button moved 5px after CSS edit → FAIL (catch the change)
- ✅ Button moved intentionally + snapshot updated → pass

---

## Test File: `tests/e2e/visual-regression.spec.js`

### Current Tests (8 total)

| Test | Screenshot | Devices | Purpose |
|------|-----------|---------|---------|
| Board layout at game start | Full board after hero select | Chromium, WebKit, Mobile | Desktop/mobile baseline |
| Hero panel layout | Hero stats panel | All | Hero display stability |
| Combat layout | Combat dashboard | All | Combat UI stability |
| Enemy card | Single enemy card | All | Enemy card design |
| Modal layout | Various modals | All | Modal stability |
| HUD layout | HUD panel | All | Sidebar HUD stability |
| Turn panel | Turn indicator | All | Turn UI stability |
| Ability list | Ability grid | All | Ability display |

### Projects Tested

- **Chromium** (1440×900): Desktop Chrome
- **WebKit** (1280×900): Desktop Safari
- **Mobile** (iPhone 13): Mobile responsiveness

### Snapshots Stored

```
tests/e2e/visual-regression.spec.js-snapshots/
├── chromium-board-layout-at-game-start.png
├── chromium-board-layout-at-game-start-darwin.png  (macOS)
├── webkit-board-layout-at-game-start-darwin.png
├── mobile-board-layout-at-game-start-mobile-darwin.png
└── ...
```

**Suffix**: `-darwin` indicates macOS generation. Linux (`-linux`) not maintained (would need separate CI runner).

---

## When Snapshots Update Automatically

### ✅ Auto-Disabled Animations

Before capturing, test disables all CSS animations:

```javascript
// In visual-regression.spec.js
await page.addInitScript(() => {
  document.documentElement.style.setProperty('--transition-fast', '0s');
  document.documentElement.style.setProperty('--transition-base', '0s');
  document.documentElement.style.setProperty('--transition-slow', '0s');
});
```

**Why**: Animations shouldn't cause snapshot failures. A 0.3s transition plays differently in each test run, but final state is same.

---

## When to Update Snapshots

### Intentional Visual Changes

```bash
# Update after:
# 1. CSS color changes
# 2. Layout modifications
# 3. New responsive breakpoints
# 4. Image replacements

npm run test:chromium -- --update-snapshots
```

### Review Before Committing

```bash
# After updating, review changes
git diff tests/e2e/visual-regression.spec.js-snapshots/

# Visually inspect (open in image viewer)
# Should see your intended changes (not accidental breakage)
```

### Commit Together

```bash
# CSS changes + snapshots in same commit
git add styles/board/enemy-card.css tests/e2e/visual-regression.spec.js-snapshots/
git commit -m "style(board): enemy card shadow effect + visual regression update"
```

---

## Snapshot Update Workflow

### Full Workflow

1. **Make CSS changes**
   ```bash
   # Edit styles/board/enemy-card.css
   nano styles/board/enemy-card.css
   ```

2. **Rebuild + test**
   ```bash
   npm run build:runtime
   npm run test:chromium
   # Result: Visual regression tests FAIL (expected, snapshots outdated)
   ```

3. **Review failure**
   ```bash
   # Test output shows which snapshots differ
   # Example:
   # 1 visual comparison failed
   #   tests/e2e/visual-regression.spec.js › board-layout
   #     Expected: chromium-board-layout-chromium.png
   #     Actual: chromium-board-layout-chromium.png (different)
   ```

4. **Update snapshots**
   ```bash
   npm run test:chromium -- --update-snapshots
   # Playwright overwrites old .png with new screenshots
   ```

5. **Verify changes visually**
   ```bash
   # Open in image viewer or VS Code
   # Compare old vs new (git shows diffs)
   code tests/e2e/visual-regression.spec.js-snapshots/
   
   # Look for:
   # ✅ Intended changes (shadow, color, spacing)
   # ❌ Accidental breakage (misaligned text, cut-off elements)
   ```

6. **Commit**
   ```bash
   git add styles/ tests/e2e/visual-regression.spec.js-snapshots/
   git commit -m "style: ..."
   git push origin feature-branch
   ```

---

## Multi-Project Updates

### Chromium Only (Most Common)

```bash
npm run test:chromium -- --update-snapshots
```

### WebKit (Safari)

```bash
npm run test:webkit -- --update-snapshots
```

### Mobile

```bash
npm run test:mobile -- --update-snapshots
```

### All Projects (Rare)

```bash
# Update all three
npm run test:e2e -- --update-snapshots
# Warning: slow (~5 minutes)
```

---

## Debugging Failed Snapshots

### See Actual vs Expected

```bash
# Test output shows file paths
npm run test:chromium

# If failed, check generated files
ls -la tests/e2e/visual-regression.spec.js-snapshots/*-actual.png
# These show what the test produced (vs expected baseline)
```

### Threshold for Diffs

Playwright allows tiny diffs (anti-aliasing, sub-pixel rendering). Default threshold is **0.2% pixel difference**.

If test fails, diff is >0.2% (more than tiny rounding errors).

### Compare Visually

```bash
# Side-by-side comparison (macOS)
open -a "Preview" tests/e2e/visual-regression.spec.js-snapshots/chromium-board-layout-chromium-expected.png
open -a "Preview" tests/e2e/visual-regression.spec.js-snapshots/chromium-board-layout-chromium-actual.png

# Or use VS Code image diff
code --diff expected.png actual.png
```

### Common False Failures

**Anti-aliasing**: Fonts render slightly differently each run (browser rounding)
- **Solution**: Expected, not a real diff. Re-run test; usually passes second time.

**Color picker inconsistency**: OS color space differences
- **Solution**: Re-run in same environment. Snapshot taken on macOS, should pass on macOS.

**Timing**: Modal animation not complete in screenshot
- **Solution**: Test waits for animations (`waitForLoadState('networkidle')`); shouldn't happen. If consistent, add explicit wait.

---

## CI Behavior: Visual Tests Skipped

In GitHub Actions (CI), visual regression tests are **excluded**:

```javascript
// playwright.config.js
testIgnore: process.env.CI ? '**/visual-regression.spec.js' : undefined
```

**Why**: Snapshots generated on macOS (`-darwin.png`), but CI runs on Ubuntu (`ubuntu-latest`). Rendering differences would cause false failures.

**Consequence**:
- **Local**: Run visual tests every iteration (`npm run test:chromium`)
- **CI**: Skip visual tests; catch visual regressions locally before push

**Note**: All other e2e tests **do** run in CI (34 functional tests).

---

## Best Practices

### ✅ DO

- **Always review snapshot diffs visually** before committing
- **Update in one feature per commit** (don't mix unrelated CSS changes)
- **Run tests locally first** (before pushing to CI)
- **Commit snapshots with CSS**: Same commit, not separate

### ❌ DON'T

- **Blindly update without reviewing** changes
- **Mix multiple CSS changes** in one snapshot update (hard to review)
- **Expect CI to validate visual changes** (it skips visual tests)
- **Commit old snapshots** (always verify they're current)

---

## See Also

- [SKILL.md](../SKILL.md) for testing patterns overview
- [setup.md](setup.md) for Playwright config details
- [Playwright visual comparison docs](https://playwright.dev/docs/test-snapshots)
