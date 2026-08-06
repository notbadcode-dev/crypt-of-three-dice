# Playwright Setup & Configuration

Reference for Playwright installation, configuration details, and project setup.

## Installation

The project has Playwright pre-configured in `package.json`:

```bash
# Install dependencies (includes Playwright)
npm install

# Install browser binaries (one-time)
npm run test:install  # or: npx playwright install chromium webkit
```

## Config File: `playwright.config.js`

### Projects (3 browsers × device profiles)

```javascript
{
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        // Inherits iPhone viewport
      },
    },
  ],
}
```

- **Chromium**: Primary desktop browser (Chrome, Edge, Opera)
- **WebKit**: Safari compatibility (also runs on mobile)
- **Mobile**: iPhone 13 emulation (actual device profile)

### Web Server (Auto-start)

```javascript
webServer: {
  command: 'node tests/e2e/serve-static.mjs',
  port: 4173,
  reuseExistingServer: !process.env.CI,
}
```

- **Auto-starts** before first test
- **Port 4173**: Dev server
- **CI mode**: Fresh server per run (deterministic)
- **Local mode**: Reuse running server (faster iteration)

### Test Directory & Ignore

```javascript
testDir: './tests/e2e',
testIgnore: process.env.CI ? '**/visual-regression.spec.js' : undefined,
```

- Tests live in `tests/e2e/`
- Visual regression **excluded in CI** (macOS snapshots only)
- Local runs include visual tests

### Workers & Timeout

```javascript
workers: process.env.CI ? 1 : undefined,  // Serial in CI, parallel locally
timeout: 30_000,  // 30 second timeout per test
```

- **CI**: 1 worker (serial, deterministic)
- **Local**: Auto (typically half CPU count, can be parallelized)
- **Timeout**: If test takes >30s, fail

---

## Running Tests

### Commands

| Command | What | Browsers |
|---------|------|----------|
| `npm run test` | Full suite | All 3 projects |
| `npm run test:e2e` | Alias for full suite | All 3 projects |
| `npm run test:chromium` | Fastest | Chromium only |
| `npm run test:webkit` | Safari compat | WebKit only |
| `npm run test:headed` | Watch execution | All 3 projects (visible) |
| `npm run test:ui` | Interactive UI | All 3 projects (interactive) |

### Quick Validation

```bash
# During development (fast, single project)
npm run test:chromium

# Before push (full validation)
npm run test:e2e

# With browser window visible (debugging)
npm run test:headed
```

---

## Debugging Failed Tests

### Using `test:headed`

```bash
npm run test:headed -- -g "exact test name"
```

Playwright opens browser window showing:
- Page under test
- Test progress + failures
- Console messages + network activity

Step through manually to understand failure.

### Using `page.pause()`

```javascript
test('my test', async ({ page }) => {
  await page.goto('...');
  await page.click('...');
  
  await page.pause();  // Pauses here; browser stays open
  // Manual testing in browser
  // Resume in Playwright Inspector
});
```

### Screenshots on Failure

Tests auto-capture screenshot on failure (in test output).

Manual screenshot:

```javascript
await page.screenshot({ path: 'debug.png' });
```

---

## CI Integration

### GitHub Actions

`.github/workflows/ci.yml` runs Playwright on every push:

```yaml
- name: E2E Tests
  run: npm run test:chromium
  env:
    CI: true
```

- Environment variable `CI=true` triggers 1 worker mode
- Visual regression tests **skipped** (CI has no macOS baselines)
- All other tests run

### Detecting CI

```javascript
if (process.env.CI) {
  // In CI: run differently
} else {
  // Local: standard behavior
}
```

---

## Troubleshooting

### "Browser not found"

```
Error: Chromium is not installed
```

**Fix**:
```bash
npm run test:install
# or
npx playwright install chromium webkit
```

### "Port 4173 already in use"

The dev server is already running from a previous test.

**Fix**:
```bash
# Kill existing process
lsof -ti:4173 | xargs kill -9

# Then retry tests
npm run test:chromium
```

### Tests timeout (>30s)

**Likely causes**: 
- Network slowness
- Computationally heavy page
- Infinite loop in test code

**Solutions**:
```bash
# Increase timeout for specific test
test('slow test', async ({ page }) => { ... }, { timeout: 60_000 });

# Or increase globally in config
timeout: 60_000,
```

### Flaky tests on local

Resource contention when running all 3 projects.

**Fix**: Test in isolation
```bash
npm run test:chromium -- -g "exact test name"
```

If passes isolated but fails in full suite, it's local resource contention (not a real bug).

---

## See Also

- [SKILL.md](../SKILL.md) for testing patterns
- `playwright.config.js` (actual file)
- [Playwright official docs](https://playwright.dev)
