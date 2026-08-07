// @ts-check
/**
 * Playwright E2E Configuration
 *
 * Proyectos y ejecución:
 * - chromium: Desktop Chrome, 1440×900 (CI: e2e-chromium job)
 * - webkit: Desktop Safari, 1280×900 (CI: e2e-webkit job)
 * - mobile: iPhone 13 (CI: e2e-mobile job)
 *
 * Scripts:
 * - npm run test:e2e              → chromium only (fast, ~2 min)
 * - npm run test:e2e:all          → chromium + webkit + mobile (full validation, ~7-8 min)
 * - npm run test:e2e -- --headed  → chromium with UI
 * - npm run test:e2e:all -- --headed → all projects with UI
 *
 * CI paralleliza los 3 proyectos en jobs independientes (GitHub Actions).
 * Cada job especifica su proyecto: --project=chromium|webkit|mobile
 *
 * Test suites:
 * - e2e.spec.js: 34 tests funcionales (@smoke, @regression, @a11y, @persistence, @integration)
 * - visual-regression.spec.js: 8 tests visuales (excluidos en CI por baseline -linux.png vs -darwin.png)
 */
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  // Los snapshots de visual-regression.spec.js se generaron en macOS (-darwin.png);
  // el runner de CI es ubuntu-latest y necesitaría baselines -linux.png, así que la
  // suite se excluye solo ahí (CI define process.env.CI automáticamente).
  testIgnore: process.env.CI ? "**/visual-regression.spec.js" : undefined,
  outputDir: "./tests/e2e/results/test-results",
  timeout: process.env.CI ? 120_000 : 30_000,  // 120s in CI (webkit/mobile heavy tests), 30s local
  expect: {
    timeout: process.env.CI ? 15_000 : 5_000   // 15s in CI for clicks/waits, 5s local
  },
  fullyParallel: true,
  reporter: [
    ["list"],
    ["html", { outputFolder: "tests/e2e/results/html-report", open: "never" }]
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "node tests/e2e/serve-static.mjs",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 900 } }
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] }
    }
  ]
});
