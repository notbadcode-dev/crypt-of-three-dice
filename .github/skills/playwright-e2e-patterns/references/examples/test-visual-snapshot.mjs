// Example: Visual Regression Snapshot Test
// Tests: Layout, colors, spacing, responsive design

import { test, expect, devices } from '@playwright/test';

test('board layout matches snapshot at game start', async ({ page }) => {
  // Navigate to app
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // Select hero to show board
  await page.click('.class-button:first-of-type');
  
  // Wait for board to fully load
  await expect(page.locator('.board-frame')).toBeVisible();
  await page.waitForLoadState('networkidle');
  
  // ===============================
  // Disable Animations
  // ===============================
  
  // Prevent animation/transition flakiness
  await page.addInitScript(() => {
    document.documentElement.style.setProperty('--transition-fast', '0s');
    document.documentElement.style.setProperty('--transition-base', '0s');
    document.documentElement.style.setProperty('--transition-slow', '0s');
  });
  
  // ===============================
  // Capture Snapshot
  // ===============================
  
  // Screenshot full page
  await expect(page).toHaveScreenshot('board-layout-at-game-start.png', {
    maxDiffPixels: 100, // Allow tiny rendering differences
  });
});

// ============================================================================
// Example 2: Responsive Layout Snapshots
// ============================================================================

test('board layout on tablet (iPad)', async ({ page }) => {
  // Playwright uses iPad Pro dimensions (1024×1366)
  await page.goto('http://127.0.0.1:4173/index.html');
  
  await page.click('.class-button:first-of-type');
  await expect(page.locator('.board-frame')).toBeVisible();
  
  // Disable animations
  await page.addInitScript(() => {
    document.documentElement.style.setProperty('--transition-fast', '0s');
    document.documentElement.style.setProperty('--transition-base', '0s');
  });
  
  // Snapshot iPad layout
  await expect(page).toHaveScreenshot('board-layout-tablet.png');
});

// ============================================================================
// Example 3: Component Snapshot (Single Element)
// ============================================================================

test('enemy card visual matches snapshot', async ({ page }) => {
  // Setup game
  await page.goto('http://127.0.0.1:4173/index.html');
  await page.click('.class-button:first-of-type');
  
  await expect(page.locator('.board-frame')).toBeVisible();
  
  // Disable animations
  await page.addInitScript(() => {
    document.documentElement.style.setProperty('--transition-fast', '0s');
    document.documentElement.style.setProperty('--transition-base', '0s');
  });
  
  // Find enemy card
  const enemyCard = page.locator('.enemy-card').first();
  await expect(enemyCard).toBeVisible();
  
  // Snapshot just the card (not whole page)
  await expect(enemyCard).toHaveScreenshot('enemy-card-default-state.png', {
    maxDiffPixels: 50,
  });
});

// ============================================================================
// Example 4: HUD Snapshot
// ============================================================================

test('HUD layout and styling matches snapshot', async ({ page }) => {
  // Setup game
  await page.goto('http://127.0.0.1:4173/index.html');
  await page.click('.class-button:first-of-type');
  
  // Wait for sidebar/HUD
  await expect(page.locator('.sidebar')).toBeVisible();
  
  // Disable animations
  await page.addInitScript(() => {
    document.documentElement.style.setProperty('--transition-fast', '0s');
  });
  
  // Snapshot sidebar/HUD area
  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toHaveScreenshot('hud-sidebar-layout.png', {
    maxDiffPixels: 100,
  });
});

// ============================================================================
// Example 5: Modal Snapshot
// ============================================================================

test('modal shell styling matches snapshot', async ({ page }) => {
  // Modal visible at start
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // Start modal visible
  const startModal = page.locator('#startModal');
  await expect(startModal).toBeVisible();
  
  // Disable animations
  await page.addInitScript(() => {
    document.documentElement.style.setProperty('--transition-fast', '0s');
  });
  
  // Snapshot modal
  await expect(startModal).toHaveScreenshot('start-modal-hero-selection.png', {
    maxDiffPixels: 100,
  });
});

// ============================================================================
// Example 6: Full Page Snapshot (Multiple Viewports)
// ============================================================================

test.describe('visual regression - multiple viewports', () => {
  
  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Tablet', width: 1024, height: 768 },
    { name: 'Mobile', width: 375, height: 667 },
  ];
  
  for (const viewport of viewports) {
    test(`board layout on ${viewport.name}`, async ({ page }) => {
      // Set viewport size (if not using device profile)
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      
      // Navigate and setup
      await page.goto('http://127.0.0.1:4173/index.html');
      await page.click('.class-button:first-of-type');
      
      await expect(page.locator('.board-frame')).toBeVisible();
      
      // Disable animations
      await page.addInitScript(() => {
        document.documentElement.style.setProperty('--transition-fast', '0s');
        document.documentElement.style.setProperty('--transition-base', '0s');
      });
      
      // Snapshot
      await expect(page).toHaveScreenshot(`board-${viewport.name.toLowerCase()}.png`);
    });
  }
});

// ============================================================================
// Updating Snapshots (Usage)
// ============================================================================

/*
After making CSS changes and tests fail:

  1. Review visual differences:
     npm run test:chromium
     // Tests fail with visual diffs

  2. Verify changes visually:
     git diff tests/e2e/visual-regression.spec.js-snapshots/
     // Compare old vs new .png files in image viewer

  3. Update snapshots:
     npm run test:chromium -- --update-snapshots

  4. Verify updated snapshots:
     git diff tests/e2e/visual-regression.spec.js-snapshots/
     // Confirm changes are intentional

  5. Commit together:
     git add styles/board/enemy-card.css tests/e2e/visual-regression.spec.js-snapshots/
     git commit -m "style: enemy card shadow effect + snapshot update"

  6. Push:
     git push origin feature-branch
*/
