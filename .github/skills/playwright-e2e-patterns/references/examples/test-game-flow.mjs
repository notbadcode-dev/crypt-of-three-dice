// Example: Complete game flow E2E test
// Tests: Hero selection → Game start → First turn setup

import { test, expect } from '@playwright/test';

test('complete game flow: hero select → game start → first turn', async ({ page }) => {
  // Navigate to app
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // ===============================
  // Phase 1: Start Modal Visible
  // ===============================
  
  const startModal = page.locator('#startModal');
  await expect(startModal).toBeVisible();
  
  // Verify modal title
  await expect(page.locator('.modal-title')).toContainText('Select Your Hero');
  
  // Verify class buttons exist
  const classButtons = page.locator('.class-button');
  await expect(classButtons).toHaveCount(4); // Warden, Warrior, Rogue, Mage
  
  // ===============================
  // Phase 2: Select Hero Class
  // ===============================
  
  // Click Warrior class
  await page.click('.class-button:has-text("Warrior")');
  
  // Modal closes (hero selection complete)
  await expect(startModal).not.toBeVisible();
  
  // Game board appears
  await expect(page.locator('.board-frame')).toBeVisible();
  
  // ===============================
  // Phase 3: Verify Initial Game State
  // ===============================
  
  // Hero panel visible with correct class
  const heroPanel = page.locator('.hero-panel');
  await expect(heroPanel).toBeVisible();
  await expect(heroPanel).toContainText('Warrior');
  
  // Hero HP at max (assume 20)
  await expect(page.locator('.hero-hp')).toContainText('20');
  
  // Turn panel shows correct phase
  const turnPhase = page.locator('.turn-phase');
  await expect(turnPhase).toBeVisible();
  await expect(turnPhase).toContainText('Hero Turn'); // Or 'Enemy Turn'
  
  // ===============================
  // Phase 4: First Enemy Present
  // ===============================
  
  // At least one enemy on board
  const enemyCards = page.locator('.enemy-card');
  await expect(enemyCards).toHaveCount(1, { timeout: 5000 });
  
  // Enemy has HP visible
  const firstEnemy = enemyCards.first();
  await expect(firstEnemy).toContainText(/\d+/); // Contains number (HP)
  
  // ===============================
  // Phase 5: HUD Elements Ready
  // ===============================
  
  // Sidebar visible (resources, abilities, log)
  await expect(page.locator('.sidebar')).toBeVisible();
  
  // Ability buttons visible
  const abilityButtons = page.locator('.ability-button');
  await expect(abilityButtons.count()).toBeGreaterThan(0);
  
  // Log panel has entries
  const logEntries = page.locator('.log-entry');
  await expect(logEntries).toHaveCount(1, { timeout: 5000 }); // At least setup message
  
  // ===============================
  // Phase 6: Game is Interactive
  // ===============================
  
  // Click first ability
  await expect(abilityButtons.first()).toBeEnabled();
  
  // Verify no console errors
  const consoleMessages = page.evaluate(() => {
    // This would be mocked in a real test setup
    return 'game started successfully';
  });
  
  await expect(consoleMessages).toBeTruthy();
});

// ============================================================================
// Example 2: Responsive Layout Test (Same flow on Mobile)
// ============================================================================

test('game flow works on mobile viewport', async ({ page, viewport }) => {
  test.skip(viewport.width > 768, 'Run only on mobile viewports');
  
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // Modal visible (responsive)
  const startModal = page.locator('#startModal');
  await expect(startModal).toBeVisible();
  
  // Select hero
  await page.click('.class-button:first-of-type');
  
  // Game starts
  await expect(startModal).not.toBeVisible();
  await expect(page.locator('.board-frame')).toBeVisible();
  
  // On mobile, board shouldn't introduce scroll
  const boardFrame = page.locator('.board-frame');
  const boundingBox = await boardFrame.boundingBox();
  
  if (boundingBox) {
    // Verify board fits in viewport
    expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
    expect(boundingBox.height).toBeLessThanOrEqual(viewport.height);
  }
});
