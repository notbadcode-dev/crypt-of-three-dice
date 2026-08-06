/**
 * @name test-ui-interaction
 * @type example
 * @parent_skill playwright-e2e-patterns
 * @keywords ["E2E test", "UI interaction", "clicks", "forms", "modals"]
 * @example_scenario "User interactions: clicks, modals, forms, keyboard"
 * @updated 2026-08-06
 */

// Example: UI Interaction E2E test
// Tests: User clicks, forms submit, UI state changes

import { test, expect } from '@playwright/test';

test('hero panel displays and updates with game state', async ({ page }) => {
  // Setup: Start game
  await page.goto('http://127.0.0.1:4173/index.html');
  
  // Select hero to reach game board
  await page.click('.class-button:has-text("Warrior")');
  
  // ===============================
  // Test 1: Hero Panel Visible
  // ===============================
  
  const heroPanel = page.locator('.hero-panel');
  await expect(heroPanel).toBeVisible();
  
  // Hero name/class displayed
  await expect(heroPanel).toContainText('Warrior');
  
  // ===============================
  // Test 2: Click Ability (UI Interaction)
  // ===============================
  
  // Find first ability button
  const abilityButton = page.locator('.ability-button').first();
  await expect(abilityButton).toBeVisible();
  
  const abilityName = await abilityButton.getAttribute('data-ability');
  console.log(`Clicked ability: ${abilityName}`);
  
  // Click ability
  await abilityButton.click();
  
  // Verify ability was registered (might show animation, log entry, or state change)
  const logEntry = page.locator('.log-entry:has-text("Attack")').or(page.locator('.log-entry:has-text("used")'));
  await expect(logEntry).toBeVisible({ timeout: 2000 });
  
  // ===============================
  // Test 3: Modal Opens on Click
  // ===============================
  
  // Click status/info button to open details modal
  const infoButton = page.locator('[aria-label="Show hero info"]').or(page.locator('.info-button'));
  
  if (await infoButton.isVisible()) {
    await infoButton.click();
    
    // Modal should appear
    const modal = page.locator('.modal-shell').or(page.locator('.hero-details-modal'));
    await expect(modal).toBeVisible({ timeout: 2000 });
    
    // Can close it
    const closeButton = modal.locator('[aria-label="Close"]').or(modal.locator('.modal-close'));
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(modal).not.toBeVisible();
    }
  }
  
  // ===============================
  // Test 4: Keyboard Navigation (Optional)
  // ===============================
  
  // Arrow down to navigate between UI elements
  await page.press('body', 'ArrowDown');
  
  // Verify focus changed (check focused element)
  const focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.className || el?.id || 'unknown';
  });
  
  console.log(`Focused element: ${focusedElement}`);
  
  // ===============================
  // Test 5: Hover Effects (Optional)
  // ===============================
  
  // Hover over ability to show tooltip
  await abilityButton.hover();
  
  // Tooltip might appear
  const tooltip = page.locator('.tooltip').or(page.locator('[role="tooltip"]'));
  
  if (await tooltip.isVisible()) {
    // Verify tooltip contains info
    const tooltipText = await tooltip.textContent();
    console.log(`Tooltip: ${tooltipText}`);
    expect(tooltipText?.length).toBeGreaterThan(0);
  }
});

// ============================================================================
// Example 2: Form Submission (Save/Load)
// ============================================================================

test('save game dialog opens and closes', async ({ page }) => {
  // Setup: Start game
  await page.goto('http://127.0.0.1:4173/index.html');
  await page.click('.class-button:first-of-type');
  
  // Wait for game to load
  await expect(page.locator('.board-frame')).toBeVisible();
  
  // ===============================
  // Open Save Dialog
  // ===============================
  
  // Find save button (might be in menu or sidebar)
  const saveButton = page.locator('button:has-text("Save")').or(page.locator('[aria-label="Save Game"]'));
  
  if (await saveButton.isVisible()) {
    await saveButton.click();
    
    // Save dialog appears
    const saveModal = page.locator('.save-load-modal').or(page.locator('#saveDialog'));
    await expect(saveModal).toBeVisible({ timeout: 2000 });
    
    // Verify slot list visible
    const slots = page.locator('.save-slot');
    const slotCount = await slots.count();
    expect(slotCount).toBeGreaterThan(0);
    
    // ===============================
    // Click First Slot
    // ===============================
    
    const firstSlot = slots.first();
    await firstSlot.click();
    
    // Slot selected (highlight or state change)
    await expect(firstSlot).toHaveClass(/selected|active/);
    
    // ===============================
    // Confirm Save
    // ===============================
    
    const confirmButton = saveModal.locator('button:has-text("Save")').or(saveModal.locator('[aria-label="Confirm Save"]'));
    
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      
      // Dialog closes after save
      await expect(saveModal).not.toBeVisible({ timeout: 2000 });
      
      // Verify success message (optional)
      const successMessage = page.locator('.toast').or(page.locator('[role="alert"]'));
      if (await successMessage.isVisible()) {
        await expect(successMessage).toContainText(/saved|success/i);
      }
    }
  }
});

// ============================================================================
// Example 3: Disable/Enable States
// ============================================================================

test('ability button disables when action points depleted', async ({ page }) => {
  // Setup: Start game
  await page.goto('http://127.0.0.1:4173/index.html');
  await page.click('.class-button:first-of-type');
  
  // Wait for board
  await expect(page.locator('.board-frame')).toBeVisible();
  
  // Find ability buttons
  const abilityButtons = page.locator('.ability-button');
  const firstAbility = abilityButtons.first();
  
  // Initially enabled
  await expect(firstAbility).toBeEnabled();
  
  // Spend all action points (click multiple times)
  for (let i = 0; i < 5; i++) {
    // Check if button still enabled
    if (await firstAbility.isEnabled()) {
      await firstAbility.click();
      await page.waitForTimeout(200); // Brief pause for state update
    } else {
      break;
    }
  }
  
  // After spending points, button should be disabled
  // (Verify by checking disabled attribute or presence of disabled class)
  const isDisabled = await firstAbility.isDisabled();
  const hasDisabledClass = await firstAbility.evaluate(el => 
    el.classList.contains('disabled')
  );
  
  expect(isDisabled || hasDisabledClass).toBeTruthy();
});
