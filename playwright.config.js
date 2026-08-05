// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  // Los snapshots de visual-regression.spec.js se generaron en macOS (-darwin.png);
  // el runner de CI es ubuntu-latest y necesitaría baselines -linux.png, así que la
  // suite se excluye solo ahí (CI define process.env.CI automáticamente).
  testIgnore: process.env.CI ? "**/visual-regression.spec.js" : undefined,
  outputDir: "./tests/e2e/results/test-results",
  timeout: 30_000,
  expect: {
    timeout: 5_000
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
