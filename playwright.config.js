// @ts-check
/**
 * Playwright E2E Configuration
 *
 * Proyectos y ejecución:
 * - chromium: Desktop Chrome, 1440×900 (CI: e2e-chromium job)
 * - webkit: Desktop Safari, 1280×900 (CI: e2e-webkit job)
 * - mobile: iPhone 13 (CI: e2e-mobile job)
 *
 * CI paralleliza los 3 proyectos en jobs independientes (GitHub Actions).
 * Local: npm run test:e2e -- --project=<chromium|webkit|mobile>
 *
 * Test suites:
 * - e2e.spec.js: 34 tests funcionales (@smoke, @regression, @a11y, @persistence, @integration)
 *   → Corre en todos los proyectos
 * - visual-regression.spec.js: 8 tests visuales
 *   → Corre en todos (local); excluído en CI por baseline (-darwin.png vs -linux.png)
 */
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  // Los snapshots de visual-regression.spec.js se generaron en macOS (-darwin.png);
  // el runner de CI es ubuntu-latest y necesitaría baselines -linux.png, así que la
  // suite se excluye solo ahí (CI define process.env.CI automáticamente).
  testIgnore: process.env.CI ? "**/visual-regression.spec.js" : undefined,
  outputDir: "./tests/e2e/results/test-results",
  timeout: 60_000,  // Increased from 30s for CI (webkit/mobile need more time)
  expect: {
    timeout: 10_000  // Increased from 5s for clicks/waits in CI
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
