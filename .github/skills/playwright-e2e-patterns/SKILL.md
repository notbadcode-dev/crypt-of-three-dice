---
name: "playwright-e2e-patterns"
description: "End-to-end testing with Playwright: setup, visual regression, gotchas, and test patterns"
compatibility: "Essential for UI/behavior changes; prerequisite for snapshot updates and e2e validation"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# Playwright E2E Testing Patterns

This skill covers end-to-end testing with Playwright for UI interactions, visual regression, and browser compatibility.

## Quick Reference

| Task | Command | When |
|------|---------|------|
| Run Chromium tests (fastest) | `npm run test:chromium` | Quick validation locally |
| Run all projects (Chromium, WebKit, Mobile) | `npm run test:e2e` | Before push (slow) |
| Run with browser visible | `npm run test:headed` | Debugging test failures |
| Update visual snapshots | `npm run test:chromium -- --update-snapshots` | After intentional CSS/image changes |
| UI interactive mode | `npm run test:ui` | Step through tests interactively |
| List all tests | `npx playwright test --list` | See full inventory |

---

## Setup & Configuration

### Playwright Config

`playwright.config.js` defines:

| Setting | Value | Purpose |
|---------|-------|---------|
| `testDir` | `./tests/e2e` | Where test files live |
| **3 Projects** | | |
| `chromium` | Desktop Chrome, 1440×900 | Primary desktop browser |
| `webkit` | Desktop Safari, 1280×900 | Safari compatibility |
| `mobile` | iPhone 13 (webkit motor) | Mobile responsiveness |
| `webServer` | `node tests/e2e/serve-static.mjs` (port 4173) | Local dev server |
| `testIgnore` | `**/visual-regression.spec.js` (CI only) | Snapshots are macOS-only |
| `workers` | 1 (CI) or auto (local) | Parallelism |

### Test Inventory

| File | Tests | Tags | Scope |
|------|-------|------|-------|
| `e2e.spec.js` | 34 tests | `@smoke`, `@regression`, `@integration`, `@persistence`, `@a11y` | Game flow, UI interactions, accessibility |
| `visual-regression.spec.js` | 8 tests | (visual only) | Layout snapshots (Chromium, WebKit, Mobile) |
| **Total** | **126** (34 × 3 projects + 8 visual) | | |

---

## Common Test Patterns

### Pattern 1: Basic Game Flow Test

```javascript
test('game starts with hero selection modal', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // Wait for modal to appear
  const modal = page.locator('#startModal');
  await expect(modal).toBeVisible();
  
  // Verify class buttons exist
  const classButtons = page.locator('.class-button');
  await expect(classButtons).toHaveCount(4);
});
```

### Pattern 2: User Interaction Test

```javascript
test('selecting hero class starts game', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // Click class button
  await page.click('.class-button:has-text("Warrior")');
  
  // Wait for modal to close
  await expect(page.locator('#startModal')).not.toBeVisible();
  
  // Verify game board is visible
  await expect(page.locator('.board-frame')).toBeVisible();
});
```

### Pattern 3: Visual Regression Test

```javascript
test('board layout matches snapshot', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/index.html');
  await page.click('.class-button:first-of-type');
  
  // Disable animations for consistent snapshots
  await page.addInitScript(() => {
    document.documentElement.style.setProperty('--transition-fast', '0s');
    document.documentElement.style.setProperty('--transition-base', '0s');
  });
  
  // Capture snapshot
  await expect(page).toHaveScreenshot('board-layout-at-game-start.png');
});
```

### Pattern 4: Keyboard Input Test

```javascript
test('arrow keys navigate combat menu', async ({ page }) => {
  // Setup: reach combat
  await page.goto('...'); // setup steps
  
  // Send keyboard input
  await page.press('body', 'ArrowDown');
  
  // Verify focused element changed
  const focused = await page.evaluate(() => document.activeElement.id);
  expect(focused).toBe('combat-action-2');
});
```

---

## Critical Gotchas

### Gotcha 1: CSS Breakpoint Sync with Tests

**Location**: `e2e.spec.js` test "las vistas principales no introducen scroll interno"

**Problem**: Test has hardcoded breakpoint check `viewport.width <= 1100`, matching `styles/responsive/tablet.css` breakpoint. If CSS changes this breakpoint, test fails silently.

**Solution**:
1. If you edit `styles/responsive/tablet.css` breakpoints, update test accordingly
2. Current viewports tested: 1366×768, 1180×820, 1252×1756, 1024×768
3. **Not tested**: iPad portrait (820px, 1024px), iPhone landscape (~852px)
4. After modal CSS changes, manually verify those viewports

### Gotcha 2: `transform` CSS Breaks Layout Stability Test

**Location**: `docs/arquitectura/css.md`

**Problem**: CSS `transform` property (translate, rotate, scale) affects how Playwright measures layout. Even subtle transforms can cause HUD geometry snapshots to mismatch.

**Solution**:
- Avoid `transform` in component base styles
- If necessary, use `transition: transform ...` only (not on other properties)
- Update snapshots after adding transforms:
  ```bash
  npm run test:chromium -- --update-snapshots
  ```

### Gotcha 3: WebKit Console Error (Non-critical)

**Location**: `e2e.spec.js` `afterEach` hook

**Problem**: WebKit sometimes logs:
```
"Refused to apply a stylesheet because its hash, its nonce, or 
'unsafe-inline' does not appear in the style-src directive..."
```

No actual CSP violation in code; browser artifact under resource pressure.

**Solution**: It's a **false positive** on WebKit. Ignore if:
- Error doesn't appear consistently (non-deterministic)
- Same code passes on Chromium
- No `<style>` inline tags in project

Only investigate if error becomes deterministic with 1 worker.

### Gotcha 4: Flakiness from Local Parallelism

**Problem**: Running all 3 projects at once locally (`npm run test:e2e`) can produce flaky failures due to resource contention against single dev server.

**Solution**:
```bash
# Fast: single project, reproducible
npm run test:chromium

# Reproducible flakes: isolate further
npm run test:chromium -- -g "exact test name"

# CI default is already 1 worker, so no flakes there
```

Before claiming a failure is real:
1. Reproduce with `--project=chromium` alone
2. If still fails, try with `-g "test name"` (1 test)
3. If passes after isolation, it was a local resource issue

---

## Snapshot Management

### When to Update Snapshots

```bash
# After CSS color changes, layout tweaks, or image updates:
npm run test:chromium -- --update-snapshots

# For specific test:
npm run test:chromium -- -g "board layout" --update-snapshots

# For other projects (rare; only if mobile/webkit-specific changes):
npm run test:webkit -- --update-snapshots
npm run test:mobile -- --update-snapshots
```

### Important Notes on Snapshots

- **Stored in**: `tests/e2e/visual-regression.spec.js-snapshots/`
- **Format**: `<project>-<testname>-<os>.png` (e.g., `chromium-board-layout-darwin.png`)
- **OS-specific**: Generated on macOS (`-darwin.png`); CI (Ubuntu) excluded from run
- **Animations disabled**: Test automatically disables CSS animations before capture for consistency

### Snapshot Update Workflow

1. Make CSS/image changes
2. Run tests to verify functionality (`npm run test:chromium`)
3. If only visuals changed and tests still pass, update snapshots:
   ```bash
   npm run test:chromium -- --update-snapshots
   ```
4. **Visually review** the diff (compare `.png` files)
5. Commit both code changes + snapshot updates together:
   ```bash
   git add styles/board/enemy-card.css tests/e2e/visual-regression.spec.js-snapshots/
   git commit -m "style: enemy card border animation..."
   ```

---

## Running Tests Locally

### Full Validation (Before Push)

```bash
# Linting first (catches obvious errors)
npm run lint

# TypeScript compile
npm run typecheck

# Unit tests (logic isolation)
npm run test:unit

# E2E tests (browser validation, all projects, slow ~5min)
npm run test:e2e
```

### Fast Validation (During Development)

```bash
# Just Chromium, fastest iteration
npm run test:chromium

# With head visible for debugging
npm run test:headed

# Interactive UI (pause, step through)
npm run test:ui
```

### After CSS/Image Changes

```bash
# Run + update snapshots in one go
npm run test:chromium -- --update-snapshots

# Review changed files
git diff tests/e2e/visual-regression.spec.js-snapshots/

# Commit together
git add . && git commit -m "style: changes + snapshot update"
```

---

## Debugging Failed Tests

### Method 1: Headed Mode (See What's Happening)

```bash
npm run test:headed
# Playwright opens browser window; watch the test execute
```

### Method 2: Pause at Failure

```javascript
test('my test', async ({ page }) => {
  await page.goto('...');
  // ...
  await page.pause(); // Pauses execution; click Resume in UI
});
```

Then run:
```bash
npm run test:headed -- -g "my test"
```

### Method 3: Screenshot at Failure

```javascript
test('my test', async ({ page }) => {
  await page.goto('...');
  // ... test actions ...
  
  // On failure, auto-save screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

Check `debug-screenshot.png` after test failure.

---

## Server & Environment

### Dev Server Setup

Tests start `node tests/e2e/serve-static.mjs` on port 4173 automatically. To run manually:

```bash
PORT=4173 node tests/e2e/serve-static.mjs
# App accessible at http://127.0.0.1:4173/index.html
```

### CI Environment

- `process.env.CI` is set by GitHub Actions
- Visual regression snapshots are **disabled** in CI (macOS-only baselines)
- Workers auto-set to 1 (no parallelism)
- All 3 projects run in serial

---

## See Also

- [setup.md](references/setup.md) for Playwright installation + config details
- [visual-regression.md](references/visual-regression.md) for snapshot strategies
- [project-testing-strategy skill](../../project-testing-strategy/SKILL.md) for when to write e2e vs unit
- [docs/testing/e2e.md](../../../docs/testing/e2e.md) for full technical details
