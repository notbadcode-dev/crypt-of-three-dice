---
name: "critical-rules"
type: "reference"
parent_skill: "project-architecture-reference"
keywords: ["gotchas", "do-don't", "rules", "mistakes"]
updated: "2026-08-06"
---

# Critical Rules & Prohibitions

Follow these rules to avoid silent failures, cascading bugs, and CI/CD breaks.

---

## Scripts / TypeScript: Build & Organization

### ✅ DO

- **Edit only these `.ts` files in `scripts/`**:
  - `scripts/config/app-config.ts` (constants, game balance)
  - `scripts/config/types.ts` (const arrays that eval at runtime)
  - `scripts/state/app-state.ts` (global state)
  - `scripts/state/persistence.ts` (save/load)
  - `scripts/core/*.ts` (dice, combat, geometry, audio, game-flow)
  - `scripts/ui/*.ts` (UI rendering + events)
  - `scripts/app-main.ts` (entry point)

- **Run `npm run build:runtime` after editing _any_ `.ts` file in `scripts/`**
  - This compiles with `tsc` and regenerates `scripts/app.js`
  - Forgetting this causes the app to load stale code in tests/browser

- **Verify with e2e tests, not just linters**
  - `npm run typecheck` and `npm run lint` run on modules with real `import`/`export`
  - They don't see the concatenated bundle (`scripts/app.js`)
  - The concatenation regex in `build-runtime.mjs` can have subtle bugs
  - Always run `npm run test:chromium` after TypeScript changes

- **Keep `scripts/config/types.ts` first in concatenation order**
  - `types.ts` defines runtime const arrays: `CLASS_IDS`, `PHASES`, `UPGRADE_TYPES`, `SLOT_KEYS`, `PRIMARY_SLOT_KEYS`
  - These are actual values (not just types), evaluated at runtime
  - If `types.js` is not first in `sourceFiles` in `build-runtime.mjs`, the app crashes with `"X is not defined"`
  - This error is **invisible to `typecheck` and `eslint`** — only Playwright catches it

- **Check file location before editing**
  - Before editing any `scripts/*.ts` that isn't `app-core.ts` or `app-main.ts`, run:
    ```bash
    ls scripts/config/ scripts/core/ scripts/state/ scripts/ui/
    ```
  - If the file isn't in the root, it's in a subcategory; edit it there

- **Update import paths if moving files**
  - If moving `scripts/ui/modal-manager.ts` to a deeper folder, update all relative imports in files that depend on it
  - Re-run `npm run build:runtime` + `npm run test:chromium` after moves

- **Never create new barrel files** (except `scripts/app-core.ts` for tests)
  - A new `export * from "..."` in the concatenated bundle may not strip correctly
  - `stripExports` in `build-runtime.mjs` only cleans `export const` / `export function`, not `export *`
  - If you need a barrel, modify `build-runtime.mjs` first (only if you understand the regex)

### ❌ DON'T

- **Never hand-edit `scripts/app.js`**
  - It's generated; your changes will be overwritten by `npm run build:runtime`
  - If you need to fix something in the bundle, edit the source `.ts` files and rebuild

- **Never forget `npm run build:runtime`**
  - Leaving `.ts` edits without rebuilding causes stale behavior (especially flaky in tests)

- **Never assume TypeScript compile succeeds means app works**
  - `tsc` runs on modules, not the concatenated bundle
  - File order, regex stripping, and missing rebuilds are invisible to `tsc`

- **Never use `import`/`export` in compiled `.js` files**
  - `build-runtime.mjs` strips them; if they survive the regex, the app breaks silently

---

## CSS: Barrels, Overrides & Theme

### ✅ DO

- **Declare all new hex/rgb colors in `styles/global/_colors.css`**
  - This is the single source of truth for the palette
  - Add to the "Primitives" section (grouped by family: backgrounds, greens, stone, gold, etc.)
  - Then reference via semantic variable in the "Theme" section
  - Example: `--bg-wood-2: rgb(var(--bg-wood-2-rgb))` in theme section

- **Use semantic color variables in component files**
  - Example in `styles/board/enemy-card.css`: `background: var(--bg-panel-surface)`
  - Never `background: #2a4447` (literal hex)

- **Use motion tokens from `styles/global/_motion.css`**
  - `--transition-fast`, `--transition-base`, `--transition-slow`
  - `--ease-out-soft`, `--ease-snap`
  - Example: `transition: opacity var(--transition-base) var(--ease-out-soft)`

- **Keep `board-overrides.css` as the last import in `styles/board/board.css`**
  - This file has intentional duplicate selectors (`.enemy-meta`, `.board-frame`, etc.)
  - They override earlier rules via cascade (same specificity, later = wins)
  - Do not merge these selectors into their base files; the override pattern is intentional

- **Update relative paths when moving CSS files between depths**
  - Moving `styles/board/card.css` → `styles/board/cards/card.css` requires:
    - Update `@import url()` in `board.css`
    - Update all `url(../assets/...)` → `url(../../assets/...)` in the moved file

- **Run `npm run lint:css` after CSS changes**
  - Catches misspelled vars, missing `;`, malformed rules
  - Note: `stylelint` has `no-duplicate-selectors` rule, but it doesn't detect intentional duplicates across files (only within one file)

### ❌ DON'T

- **Never declare a literal `#fff`, `rgb(...)`, or `linear-gradient(...)`** outside `_colors.css` / `_gradients.css`
  - Future theme alternates must only override the semantic layer, not color primitives
  - Search codebase for stray hex values during code review

- **Never reorder `@import` statements in `styles/app.css` or barrel files**
  - Cascade order matters: tokens → base → components → responsive
  - Reordering breaks specificity expectations throughout the app

- **Never remove `board-overrides.css` from the end of `styles/board/board.css`**
  - If you "clean up" those duplicate selectors into their base files, the cascade breaks
  - Leave the overrides pattern in place (even if it looks redundant)

- **Never use `rgb(var(--x-rgb) / alpha)` with `-rgb` variables**
  - CSS syntax `rgb(18, 32, 36 / 96%)` is invalid (comma + `/` mixed)
  - Use `rgb(var(--x-rgb), 0.96)` (coma + decimal alpha), never `/`
  - Example: ✅ `color: rgb(var(--text-rgb), 0.8)` / ❌ `color: rgb(var(--text-rgb) / 0.8)`
  - The invalid version silently drops the entire declaration (browser doesn't error, just ignores it)

- **Never add `transform` properties without checking tests**
  - `transform` affects layout stability (can cause HUD geometry report mismatches)
  - See [docs/testing/e2e.md](../../../docs/testing/e2e.md) for details

---

## File Organization: What Not to Do

### ❌ DON'T

- **Never edit `node_modules/`**
  - Any manual changes are lost on `npm install`
  - If a dependency needs a fix, patch it via `package.json` pinning or post-install scripts

- **Never commit `.tsbuild/` or `dist/` folders**
  - These are generated; add to `.gitignore` if not already

- **Never create random `.js` or `.ts` files in `scripts/` root**
  - All code belongs in a subcategory (`config/`, `state/`, `core/`, `ui/`)
  - Only `app-core.ts` and `app-main.ts` are exceptions

- **Never move files between folders without updating `build-runtime.mjs`**
  - The `sourceFiles` array has hardcoded paths
  - If you move `scripts/core/audio.ts` to `scripts/audio.ts`, update `sourceFiles` and rebuild

- **Never assume `git status` is a substitute for test results**
  - A file can look unchanged but the bundle can be stale
  - Always run relevant tests after edits

---

## Testing: When & What to Run

### ✅ DO

- **Run `npm run test:chromium` after TypeScript or CSS changes**
  - This is the source of truth (catches bundle/cascade bugs invisible to linters)

- **Run `npm run test:unit` after `scripts/core/` or `scripts/state/` changes**
  - Validates logic in isolation before the e2e layer

- **Update visual snapshots with `npm run test:chromium -- --update-snapshots`**
  - Only after intentional CSS/image changes (design iterations, bug fixes)
  - Commit snapshot updates with the CSS changes in same commit

- **Run full suite `npm run lint && npm run test:unit && npm run test:e2e` before pushing**
  - CI runs this; catching failures locally saves CI time

### ❌ DON'T

- **Never rely on `npm run typecheck` alone to validate app correctness**
  - It runs on modules with full `import`/`export`, not the concatenated bundle
  - Bundle order, regex stripping, and stale builds are invisible to `tsc`

- **Never update snapshots without understanding the change**
  - Always visually inspect the screenshot diff
  - If you don't understand why a snapshot changed, don't auto-update

---

## Git & Commits

### ✅ DO

- **Commit TypeScript + bundle regeneration together**
  - Don't separate `scripts/core/combat.ts` edits from `npm run build:runtime` output
  - One commit: edit .ts files + regenerate `scripts/app.js`

- **Commit CSS + snapshot updates together**
  - `styles/board/enemy-card.css` changes + updated `.png` snapshots in same commit

### ❌ DON'T

- **Never push TypeScript changes without `scripts/app.js` updates**
  - CI will catch it, but tests will fail mysteriously
  - Always `npm run build:runtime` before `git add`

---

## Summary Checklist

Before pushing any commit:

- [ ] No stray `#fff` or `rgb()` outside `styles/global/`
- [ ] TypeScript edited? → `npm run build:runtime` run?
- [ ] CSS edited? → `npm run lint:css` passed?
- [ ] Behavior changed? → `npm run test:chromium` passed?
- [ ] Logic changed? → `npm run test:unit` passed?
- [ ] Snapshots updated? → Visually reviewed + committed with CSS?
- [ ] No hand-edits to `scripts/app.js`, `.tsbuild/`, `dist/`?
- [ ] All imports/exports cleaned by build process (no orphaned `export *`)?

