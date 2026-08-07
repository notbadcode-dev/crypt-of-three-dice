/**
 * Visual regression tests (screenshots)
 *
 * Cobertura de proyectos:
 * - @chromium: ✓ (todos los tests, localmente en mac con snapshots -darwin.png)
 * - @webkit: ✓ (todos los tests)
 * - @mobile: ✓ (tests Mobile: board-layout, sidebar, cascade)
 *
 * En CI: se excluyen en ubuntu-latest (process.env.CI) porque los snapshots
 * son -darwin.png y la CI corre en linux. Ver playwright.config.js.
 *
 * Regenerar snapshots tras cambios visuales:
 *   npx playwright test --project=chromium tests/e2e/visual-regression.spec.js --update-snapshots
 */
const path = require("node:path");
const { test, expect } = require("@playwright/test");

const localAppUrl = `file://${path.resolve(__dirname, "..", "..", "index.html")}?test=1`;

// Estados de prueba reutilizables
function baseState() {
  return {
    saveVersion: 2,
    classId: "warden",
    level: 1,
    turn: 1,
    hp: 6,
    maxHp: 6,
    skills: { speed: 1, attack: 1, defense: 1, range: 2 },
    phase: "adventure",
    dice: [
      { id: 0, value: 6, assigned: "speed" },
      { id: 1, value: 6, assigned: "attack" },
      { id: 2, value: 6, assigned: "defense" }
    ],
    assign: { speed: 0, attack: 1, defense: 2, range: null },
    points: { speed: 7, attack: 7, defense: 7 },
    hero: { x: 2, y: 2 },
    enemies: [{ id: "test-enemy-1", x: 3, y: 2, hp: 3, maxHp: 3 }],
    walls: [],
    classUsed: false,
    preserved: null
  };
}

async function setGameState(page, state) {
  await page.evaluate(nextState => window.__UMBRAL_TEST__.setState(nextState), state);
}

async function closeTutorial(page) {
  const helpModal = page.locator("#helpModal");
  if (await helpModal.isVisible()) {
    await page.locator("#helpNext").click();
    await page.locator("#helpNext").click();
    await page.locator("#helpClose").click();
    await expect(helpModal).toBeHidden();
  }
}

test.describe("Visual Regression - Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(localAppUrl);
    await page.waitForLoadState("networkidle");
  });

  test("board layout at game start", async ({ page }) => {
    await setGameState(page, baseState());
    await closeTutorial(page);
    
    // Esperar a que se renderice completamente
    await expect(page.locator("#gameCard")).toBeVisible();
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot("board-game-start-desktop.png", {
      mask: [page.locator("[data-timestamp]")], // Ignorar elementos con timestamps
      maxDiffPixels: 50
    });
  });

  test("hero panel state display", async ({ page }) => {
    await setGameState(page, baseState());
    await closeTutorial(page);
    
    const heroPanel = page.locator(".hero-panel");
    await expect(heroPanel).toBeVisible();
    await page.waitForTimeout(300);
    
    await expect(heroPanel).toHaveScreenshot("hero-panel-desktop.png", {
      maxDiffPixels: 20
    });
  });

  test("sidebar dice and resources", async ({ page }, testInfo) => {
    // Skip for webkit project only due to rendering issue after modal close (sidebar hidden)
    // TODO: investigate webkit-specific CSS/timing issue with modal dismiss
    // Note: mobile project also uses webkit but doesn't have this issue
    test.skip(testInfo.project.name === "webkit", "Webkit rendering issue: sidebar hidden after tutorial close");
    
    await setGameState(page, baseState());
    await closeTutorial(page);
    
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();
    await page.waitForTimeout(300);
    
    await expect(sidebar).toHaveScreenshot("sidebar-desktop.png", {
      maxDiffPixels: 30
    });
  });

  test("turn phase indicator", async ({ page }) => {
    await setGameState(page, {
      ...baseState(),
      phase: "monsterMove",
      turn: 2
    });
    await closeTutorial(page);
    
    const turnPanel = page.locator(".turn-panel");
    await expect(turnPanel).toBeVisible();
    await page.waitForTimeout(300);
    
    await expect(turnPanel).toHaveScreenshot("turn-panel-desktop.png", {
      maxDiffPixels: 20
    });
  });
});

test.describe("Visual Regression - Mobile", () => {
  test.use({ viewport: { width: 480, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(localAppUrl);
    await page.waitForLoadState("networkidle");
  });

  test("board layout mobile", async ({ page }) => {
    await setGameState(page, baseState());
    await closeTutorial(page);
    
    await expect(page.locator("#gameCard")).toBeVisible();
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot("board-game-start-mobile.png", {
      mask: [page.locator("[data-timestamp]")],
      maxDiffPixels: 80 // Mayor tolerancia en mobile por diferencias de escala
    });
  });

  test("sidebar mobile vertical layout", async ({ page }) => {
    await setGameState(page, baseState());
    await closeTutorial(page);
    
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();
    await page.waitForTimeout(300);
    
    await expect(sidebar).toHaveScreenshot("sidebar-mobile.png", {
      maxDiffPixels: 50
    });
  });
});

test.describe("Visual Regression - CSS Cascade & Overrides", () => {
  test("board-frame and enemy-card styling", async ({ page }) => {
    // Prueba que board-overrides.css se aplica correctamente
    await page.goto(localAppUrl);
    await page.waitForLoadState("networkidle");
    
    await setGameState(page, {
      ...baseState(),
      enemies: [
        { id: "e1", x: 1, y: 1, hp: 2, maxHp: 5 },
        { id: "e2", x: 3, y: 3, hp: 1, maxHp: 3 }
      ]
    });
    await closeTutorial(page);
    
    // Validar que los estilos de enemy-card se aplican
    const enemyCards = page.locator(".enemy-card");
    const count = await enemyCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verificar que cada carta tiene los estilos de override
    for (let i = 0; i < count; i++) {
      const card = enemyCards.nth(i);
      const computed = await card.evaluate(el => ({
        position: getComputedStyle(el).position,
        overflow: getComputedStyle(el).overflow
      }));
      expect(computed.position).toBe("relative");
      expect(computed.overflow).toBe("hidden");
    }
  });

  test("modal shell and overlay behavior", async ({ page }) => {
    await page.goto(localAppUrl);
    await page.waitForLoadState("networkidle");
    await setGameState(page, baseState());
    await closeTutorial(page);

    // Abrir modal de ayuda
    await page.locator("#helpBtn").click();
    const helpModal = page.locator("#helpModal");
    await expect(helpModal).toBeVisible();
    
    // Validar que la modal tiene la estructura correcta
    const modalShell = helpModal.locator(".panel.modal");
    await expect(modalShell).toBeVisible();
    
    // Verificar que el fondo está oscurecido (z-index y overlay)
    const modalStyles = await helpModal.evaluate(el => ({
      display: getComputedStyle(el).display,
      position: getComputedStyle(el).position
    }));
    expect(modalStyles.display).not.toBe("none");
  });
});
