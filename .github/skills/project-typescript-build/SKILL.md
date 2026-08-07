---
name: "project-typescript-build"
description: "TypeScript compilation and runtime bundle generation for modular scripts"
compatibility: "Essential for any scripts/ edits; prerequisite for build:runtime execution"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# TypeScript Build & Runtime Bundle

This skill explains how TypeScript in `scripts/` compiles and concatenates into `scripts/app.js`.

## Quick Reference

| Task | Command | When |
|------|---------|------|
| Rebuild bundle after `.ts` edits | `npm run build:runtime` | After editing any `scripts/**/*.ts` |
| Check types only (no build) | `npm run typecheck` | Before rebuild; doesn't generate `app.js` |
| Validate bundle in browser | `npm run test:chromium` | After rebuild; catches cascade/order bugs |
| Production build (minified, hashed) | `npm run build:dist` | For deployment |

---

## The Build Pipeline: `build-runtime.mjs`

`scripts/build-runtime.mjs` is **not a real bundler** (no tree-shaking, no minification). It:

1. **Compiles** with `tsc` (TypeScript compiler) → `.tsbuild/*.js`
2. **Strips** `import`/`export` statements via regex
3. **Concatenates** in strict order → `scripts/app.js`

### Step 1: TypeScript Compilation

```bash
tsc --project tsconfig.json
```

Compiles all `scripts/**/*.ts` to `.tsbuild/**/*.js` with ES2024 target (not minified, imports/exports preserved).

**Important**: `tsc` runs on modules with real imports/exports, so linters and type checkers see correct code. The concatenation step (Step 3) may hide bugs.

### Step 2: Regex Stripping

After compilation, `build-runtime.mjs` removes:

| Pattern | Removed | Why |
|---------|---------|-----|
| `import ... from "...";` | ✅ Yes | No modules in bundle; plain script context |
| `export const` | ✅ Yes | Made global (no module wrapper) |
| `export function` | ✅ Yes | Made global |
| `export *` from "..." | ❌ **Not removed** | Regex doesn't catch this; bundle breaks if present |

**Gotcha**: If your code has `export * from "module"`, it survives the regex and corrupts the bundle. Avoid new barrels.

### Step 3: Concatenation in Order

Modules are concatenated in this exact order (from `sourceFiles` in `build-runtime.mjs`):

```javascript
const sourceFiles = [
  "scripts/config/types.js",           // ⚠️ MUST be first
  "scripts/config/app-config.js",
  "scripts/state/app-state.js",
  "scripts/core/geometry.js",
  "scripts/state/persistence.js",      // ⚠️ After geometry (uses it)
  "scripts/core/audio.js",
  "scripts/core/dice.js",
  "scripts/core/combat.js",
  "scripts/core/game-flow.js",
  "scripts/ui/ui-feedback.js",         // ⚠️ UI first
  "scripts/ui/modal-manager.js",       // ⚠️ Manager before consumers
  "scripts/ui/board-ui.js",
  "scripts/ui/hud-ui.js",
  "scripts/ui/save-load-ui.js",
  "scripts/ui/app-ui.js",              // ⚠️ Main UI last
  "scripts/app-main.js"                // ⚠️ Entry point LAST
];
```

**Order matters**: A module must appear **after** all its dependencies.

### Output: `scripts/app.js`

Result is a single plain JavaScript file (no `import`, no `export`), with all functions/classes in the global scope:

```javascript
/* types.js */
const CLASS_IDS = [...];  // Now global
const PHASES = [...];     // Now global

/* app-config.js */
const CONFIG = {...};     // Now global

/* app-state.js */
let hero = {...};         // Now global

/* app-main.js */
initApp();  // Entry point runs when script loads
```

---

## Key Rules: `types.ts` & Dependency Order

### Why `types.js` Must Be First

`scripts/config/types.ts` defines runtime const arrays that **are not types** (not erased by compilation):

```typescript
// scripts/config/types.ts
export const CLASS_IDS = ['warrior', 'rogue', 'mage'];  // Real value
export const PHASES = ['hero_turn', 'enemy_turn'];      // Real value
export const UPGRADE_TYPES = [...];                     // Real value
```

These become globals in the bundle. If another module runs before `types.js` has concatenated, you get:

```javascript
// ❌ If combat.js concatenates before types.js:
if (CLASS_IDS.includes(hero.class)) { ... }  // ReferenceError: CLASS_IDS is not defined
```

**This error is invisible to `npm run typecheck`** because `tsc` sees the correct imports. Only **Playwright e2e tests** catch it.

### Dependency Rules

When adding a new module, insert it after all its dependencies:

| Module | Depends on | Must follow |
|--------|-----------|-------------|
| `app-state.ts` | `types.ts` | After `types.js` |
| `game-flow.ts` | `combat.ts`, `audio.ts`, `dice.ts` | After all three |
| `board-ui.ts` | `geometry.ts`, `modal-manager.ts` | After both |
| `app-main.ts` | Everything | **MUST be last** |

Before adding a new module:
1. Identify all imports in the new `.ts` file
2. Find where those dependencies appear in `sourceFiles`
3. Insert the new module **after the last dependency**
4. Update `sourceFiles` in `build-runtime.mjs`
5. Run `npm run build:runtime && npm run test:chromium`

---

## TypeScript Configuration

### `tsconfig.json` Settings

| Setting | Value | Reason |
|---------|-------|--------|
| `target` | `ES2024` | Browser baseline |
| `module` | `ES2022` | Preserves `import`/`export` for regex stripping |
| `moduleResolution` | `bundler` | No node_modules path resolution (flat bundle) |
| `isolatedModules` | `true` | Modules can be transpiled independently |
| `forceConsistentCasingInFileNames` | `true` | macOS case-insensitive, CI case-sensitive |
| `noUncheckedSideEffectImports` | `true` | Explicit side effects |
| `erasableSyntaxOnly` | `true` | Types fully erasable (no enums!) |
| `exactOptionalPropertyTypes` | `true` | Strict optional handling |

### Why Not ESNext / Preserve?

TypeScript has `module: "ESNext"` and `module: "Preserve"` modes that don't transform imports/exports. Avoided here because `build-runtime.mjs` regex depends on ES2022-style `import`/`export` statements.

---

## Common Pitfalls & Fixes

### Symptom: App crashes with `"X is not defined"`

**Cause**: `X` (const/function) is used before its module concatenates.

**Fix**:
1. Run `npm run build:runtime`
2. Inspect `scripts/app.js` search for the identifier
3. Check `sourceFiles` order in `build-runtime.mjs`
4. Move the module earlier or move the consumer later
5. Re-run build + test

### Symptom: TypeScript compiles, but app breaks at runtime

**Cause**: Module order bug; invisible to `tsc`.

**Fix**: Always run `npm run test:chromium` after `npm run build:runtime`, not just `tsc`.

### Symptom: Added new file but app doesn't load it

**Cause**: File not in `sourceFiles` array.

**Fix**:
1. Check file lives in a valid subfolder: `config/`, `state/`, `core/`, `ui/`
2. Add to `sourceFiles` array after dependencies
3. Run `npm run build:runtime`

### Symptom: Regex stripping broke my code (weird global namespace pollution)

**Cause**: A new `export * from "..."` barrel didn't get stripped.

**Fix**:
1. Rewrite as explicit `export const` / `export function`
2. Or remove the barrel and import individually in dependent files
3. Update `build-runtime.mjs` regex if needed (risky; avoid)

---

## Debugging the Bundle

### Inspect Generated Output

```bash
npm run build:runtime
open scripts/app.js
```

Search for comment markers: `/* types.js */`, `/* app-config.js */`, etc. Each marks a module boundary.

### Check for Orphaned Imports

If you see `import` or `export` in the output, the regex failed:

```bash
grep -E "(import|export)" scripts/app.js
# If any results: regex stripping failed; don't ship
```

### Verify Module Order

```bash
grep "^/\*" scripts/app.js | head -20
# Should match sourceFiles order exactly
```

### Test Locally Before Pushing

```bash
npm run build:runtime
npm run test:unit      # Unit tests (logic isolation)
npm run test:chromium  # E2E tests (bundle + browser)
```

---

## See Also

- [file-structure.md](../../project-architecture-reference/references/file-structure.md) for folder organization
- [critical-rules.md](../../project-architecture-reference/references/critical-rules.md) for do/don't summary
- [docs/architecture/scripts.md](../../../docs/architecture/scripts.md) for full details
- [`css-module-architecture` skill](../../css-module-architecture/SKILL.md) for CSS barrel pattern
