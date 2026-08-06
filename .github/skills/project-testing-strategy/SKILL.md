---
name: "project-testing-strategy"
description: "Testing strategy: when to write e2e vs unit tests, patterns, and coverage targets"
compatibility: "Essential for feature planning; directs test coverage expectations in tasks.md"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# Project Testing Strategy

This skill defines **when and how to test** different parts of the codebase.

## Testing Pyramid

```
        E2E (Playwright)      ← User-facing behavior, full app
       ╱          ╲
      ╱   Slow     ╲          ← 34 tests, 3 projects = 102 tests
     ╱            ╲
   ╱                ╲
   ┌─────────────────┐
   │   Unit Tests    │       ← Pure logic (fast)
   │  (Node runner)  │       ← 10+ tests over core/ + state/
   │   ~91% coverage │
   └─────────────────┘
```

---

## Rule 1: Core Logic Gets Unit Tests

**When**: Editing `scripts/core/` or `scripts/state/`

| Module | Type | Test Scope | Example |
|--------|------|-----------|---------|
| `combat.ts` | Pure logic | Combat mechanics, damage calc | `test('attack resolves damage correctly')` |
| `dice.ts` | Pure logic | Dice roll distribution | `test('d6 produces 1-6 equally')` |
| `geometry.ts` | Pure logic | Board math, positioning | `test('slot positions calculate correctly')` |
| `game-flow.ts` | State machine | Turn/phase transitions | `test('turn phase advances correctly')` |
| `app-state.ts` | State | State mutations | `test('setHeroHp updates correctly')` |

**Why**: Pure functions are fast to test (no DOM, no browser). Coverage ~91% on these modules.

---

## Rule 2: UI Interactions Get E2E Tests

**When**: Editing `scripts/ui/` or modifying `index.html`

| Scenario | Tool | Example |
|----------|------|---------|
| User clicks button → modal closes | E2E | `test('clicking class button starts game')` |
| Game state displays on UI | E2E | `test('hero HP shown in HUD')` |
| Responsive layout on mobile | E2E | `test('board layout on iPhone 13')` |
| Keyboard navigation | E2E | `test('arrow keys navigate menu')` |
| Cross-browser compatibility | E2E | `test(...).only('webkit')` for Safari-specific |

**Why**: DOM interaction requires browser. E2E catches layout bugs, async issues, user workflows.

---

## Rule 3: CSS Changes Trigger Visual Snapshots

**When**: Editing `styles/`

| Change | Action | Command |
|--------|--------|---------|
| Color/theme update | Update snapshots | `npm run test:chromium -- --update-snapshots` |
| Layout modification | Update snapshots + review | Same + visually inspect `.png` diff |
| Responsive breakpoint | Verify tests still pass | `npm run test:chromium` (may need test edit) |
| Animation/transition | No snapshot update needed | CSS animations auto-disabled in tests |
| New component | Add e2e test | Write test for new UI element |

**Why**: Visual regression tests catch subtle layout breaks, color mismatches, spacing issues.

---

## Rule 4: Integration Paths Get E2E

**When**: Flow spans multiple modules (UI + core + state)

Examples:
- Hero selection → game start → first turn
- Combat action → damage → enemy death → turn advance
- Save → close → reload → state restored

**Pattern**:
```javascript
test('full combat flow: attack -> damage -> turn advance', async ({ page }) => {
  // Setup: hero in combat
  await page.goto('...');
  await heroSelect(); // UI
  await waitForCombat(); // UI
  
  // Action: attack
  await page.click('.combat-action[data-action="attack"]');
  
  // Verify: damage applied + turn advanced
  // (tests both UI feedback + core logic flow)
  await expect(page.locator('.enemy-hp')).toContainText('5/10');
  await expect(page.locator('.turn-phase')).toContainText('Enemy Turn');
});
```

---

## Test File Organization

| File | Scope | Runner | Command |
|------|-------|--------|---------|
| `tests/unit/app-core.test.mjs` | Core logic only | Node test | `npm run test:unit` |
| `tests/e2e/e2e.spec.js` | Game flow + UI | Playwright | `npm run test:e2e` |
| `tests/e2e/visual-regression.spec.js` | Visual snapshots | Playwright | (runs as part of `test:e2e`) |

---

## Coverage Targets

| Module | Target | Current | Exceptions |
|--------|--------|---------|-----------|
| `scripts/core/` (except audio) | 95%+ | 95% | Combat, dice, geometry fully covered |
| `scripts/state/` | 90%+ | ~91% | State mutations, persistence covered |
| `scripts/ui/` | Functional coverage | N/A | Snapshot testing (visual), not line coverage |
| `scripts/config/` | N/A | N/A | Constants only; no tests |
| `audio.ts` | Functional coverage | Low | Depends on `window.AudioContext` (not mocked); covered functionally by e2e |

### Exception: Why `audio.ts` Has Low Coverage

- Pure JavaScript mock: `core.app.sound = false` makes `beep()` no-op
- Full coverage would require mocking Web Audio API (high cost, low value)
- Instead: functional coverage via e2e (test plays sound, game works)

---

## Before Writing a Test: Decision Tree

```
┌─ What are you testing?
│
├─ Pure function (dice roll, combat calc, board math)
│  └─ Write UNIT test (tests/unit/)
│
├─ Component state mutation (hero HP, enemy list)
│  └─ Write UNIT test (tests/unit/)
│
├─ UI element interaction (click button, see modal)
│  └─ Write E2E test (tests/e2e/e2e.spec.js)
│
├─ Multi-step game flow (hero select → combat → win)
│  └─ Write E2E test (tests/e2e/e2e.spec.js) [integration]
│
├─ Visual layout (colors, spacing, responsive)
│  └─ Use VISUAL SNAPSHOT (tests/e2e/visual-regression.spec.js)
│
└─ Browser-specific (Safari menu bug, mobile layout)
   └─ Write E2E test with .only('webkit') or .only('mobile')
```

---

## Writing Unit Tests: Patterns

### Pattern 1: Pure Function

```javascript
import { test, assert } from 'node:test';
import * as core from '../../../.tsbuild/scripts/app-core.js';

test('dice roll produces 1-6', () => {
  for (let i = 0; i < 100; i++) {
    const roll = core.rollD6();
    assert(roll >= 1 && roll <= 6, `Roll out of range: ${roll}`);
  }
});
```

### Pattern 2: State Mutation

```javascript
test('setHeroHp updates state', () => {
  const state = core.makeState({ hero: { hp: 10, maxHp: 20 } });
  core.setTestState(state);
  
  core.setHeroHp(5);
  const updated = core.getTestState().hero.hp;
  
  assert.equal(updated, 5, 'HP should be 5 after setHeroHp(5)');
});
```

### Pattern 3: UI Registration + Event

```javascript
test('modal closes when hero class selected', () => {
  const state = core.makeState({ ... });
  core.setTestState(state);
  
  let startModalHidden = false;
  core.registerUi('setStartModalHidden', (value) => {
    startModalHidden = value;
  });
  
  core.selectHeroClass('warrior');
  
  assert.equal(startModalHidden, true, 'Modal should hide after class selection');
});
```

---

## Writing E2E Tests: Patterns

See [playwright-e2e-patterns skill](../../playwright-e2e-patterns/SKILL.md) for detailed examples.

Quick checklist:
- [ ] Use descriptive test name
- [ ] Navigate to app first: `await page.goto('http://127.0.0.1:4173/index.html')`
- [ ] Wait for elements: `await expect(locator).toBeVisible()`
- [ ] Perform action: `await page.click()`, `await page.press()`
- [ ] Assert result: `await expect(locator).toContainText('...')`

---

## No Tests for Accessibility (Yet)

- `@a11y` tag exists in test suite but coverage incomplete
- Future work: add ARIA label verification, keyboard navigation tests
- For now: manual QA for a11y (screen reader testing, keyboard-only nav)

---

## Gotcha: Test State Leakage

**Problem**: Unit tests share global state; a test mutation can affect later tests.

**Solution**: Always reset state in `beforeEach`:

```javascript
beforeEach(() => {
  core.setTestState(core.makeState({}));      // Fresh state
  core.app.sound = false;                      // Disable audio
  core.app.currentSaveSlot = null;            // Clear saved slot
  core.app.selectedClass = 'warden';          // Reset class
});
```

---

## Pre-Push Checklist

- [ ] All unit tests pass: `npm run test:unit`
- [ ] All e2e tests pass: `npm run test:e2e`
- [ ] Coverage on core/state >= 90%: check `tests/unit/results/results.tap`
- [ ] Visual snapshots reviewed (if CSS changed): `git diff tests/e2e/visual-regression.spec.js-snapshots/`
- [ ] No new console errors: check test output
- [ ] TypeScript compile: `npm run typecheck`

---

## See Also

- [playwright-e2e-patterns skill](../../playwright-e2e-patterns/SKILL.md) for e2e examples
- [docs/testing/unit.md](../../../docs/testing/unit.md) for unit test details
- [docs/testing/e2e.md](../../../docs/testing/e2e.md) for e2e details
