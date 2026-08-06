---
name: "build-runtime-mjs"
type: "reference"
parent_skill: "project-typescript-build"
keywords: ["build", "compile", "bundle", "sourceFiles", "import/export stripping"]
updated: "2026-08-06"
---

# Build Runtime Configuration

Reference for understanding and modifying `scripts/build-runtime.mjs`.

## File Location & Format

```
scripts/build-runtime.mjs
```

This is an ESM (Node ES module) script that runs via `npm run build:runtime`.

## Core Functions

### `compileTypeScript()`

```javascript
function compileTypeScript() {
  const tscPath = resolve(rootDir, "node_modules/typescript/bin/tsc");
  execFileSync(process.execPath, [tscPath, "--project", resolve(rootDir, "tsconfig.json")], {
    cwd: rootDir,
    stdio: "inherit"
  });
}
```

Runs TypeScript compiler, outputting `.js` files to `.tsbuild/` directory. Output includes full `import`/`export` syntax for the next step.

### `stripImports(source)`

```javascript
function stripImports(source) {
  return source.replace(/^import[\s\S]*?from\s*["'][^"']+["'];\n?/gm, "");
}
```

Regex removes all `import X from "Y"` lines. Uses multiline flag (`m`) and non-greedy (`*?`) to handle:
- Multiline imports: `import { a, b } from "x"`
- Trailing newlines

### `stripExports(source)`

```javascript
function stripExports(source) {
  return source.replace(/^export\s+(?=(const|function))/gm, "");
}
```

Regex removes `export` keyword prefix only from `const` and `function` declarations. Does **not** remove:
- `export *` (will remain in bundle; breaks if present)
- `export interface` or `export type` (erased by TypeScript anyway)
- `export class` (not in this project)

### `bundleSource()`

```javascript
function bundleSource() {
  return sourceFiles
    .map((relativePath) => {
      const source = readFileSync(resolve(compiledRootDir, relativePath), "utf8");
      return `/* ${basename(relativePath)} */\n${stripExports(stripImports(source)).trim()}`;
    })
    .join("\n\n");
}
```

Iterates through `sourceFiles` in order:
1. Read compiled `.js` from `.tsbuild/`
2. Strip imports + exports
3. Add comment header (`/* filename.js */`)
4. Trim whitespace
5. Join with blank lines

---

## The `sourceFiles` Array

```javascript
const sourceFiles = [
  "scripts/config/types.js",
  "scripts/config/app-config.js",
  "scripts/state/app-state.js",
  "scripts/core/geometry.js",
  "scripts/state/persistence.js",
  "scripts/core/audio.js",
  "scripts/core/dice.js",
  "scripts/core/combat.js",
  "scripts/core/game-flow.js",
  "scripts/ui/ui-feedback.js",
  "scripts/ui/modal-manager.js",
  "scripts/ui/board-ui.js",
  "scripts/ui/hud-ui.js",
  "scripts/ui/save-load-ui.js",
  "scripts/ui/app-ui.js",
  "scripts/app-main.js"
];
```

**Every module must be listed exactly once in dependency order.**

### Adding a New Module

1. Write `scripts/<subfolder>/<module>.ts`
2. Compile: `npm run typecheck` (or wait for build)
3. Identify dependencies (all `import` statements)
4. Find last dependency in `sourceFiles`
5. Insert new module **after that position**

Example: Adding `scripts/core/new-system.ts` that imports `combat.ts` and `audio.ts`:

```javascript
// Before:
"scripts/core/audio.js",
"scripts/core/dice.js",
"scripts/core/combat.js",    // Last dependency
"scripts/core/game-flow.js",

// After:
"scripts/core/audio.js",
"scripts/core/dice.js",
"scripts/core/combat.js",
"scripts/core/new-system.js",  // Added here (after combat)
"scripts/core/game-flow.js",
```

6. Run `npm run build:runtime && npm run test:chromium`

---

## Output File: `scripts/app.js`

Generated file structure (sample):

```javascript
/* types.js */
const CLASS_IDS = ['warrior', 'rogue', 'mage'];
const PHASES = ['hero_turn', 'enemy_turn'];
// ... more const arrays

/* app-config.js */
const CONFIG = {
  BOARD_WIDTH: 8,
  BOARD_HEIGHT: 8,
  // ... more config
};

/* app-state.js */
let hero = null;
let enemies = [];
// ... more state

// ... more modules ...

/* app-main.js */
function initApp() { ... }
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
```

**Never edit this file by hand.** It's overwritten on every `npm run build:runtime`.

---

## Gotchas & Troubleshooting

### Circular Dependencies

If module A imports B and B imports A:
- `tsc` accepts it (modules can have cycles)
- Concatenation order might cause A to reference B before B is defined
- Solution: Refactor to break the cycle (move common code to shared module)

### Case Sensitivity in Imports

`scripts/config/types.ts` must match exactly in `sourceFiles` array:

```javascript
// ✅ Correct
"scripts/config/types.js"

// ❌ Wrong (case mismatch)
"scripts/config/Types.js"
```

macOS is case-insensitive; CI is case-sensitive. Mismatch causes CI to fail.

### Module Side Effects

If a module has side effects (runs code on import), it will run when concatenated:

```javascript
// ❌ Bad: side effect
export const config = { ... };
console.log("Config loaded");  // Runs during concatenation

// ✅ Good: side effect in entry point
export const config = { ... };
// console.log call goes in app-main.js instead
```

Only `app-main.js` should have entry point side effects (initialization).

### Large Bundle Size

If `scripts/app.js` grows very large:
- Consider lazy loading modules (beyond this skill's scope)
- Check for duplicate code (bad imports, unintended re-exports)
- Profile with DevTools (Network tab)

---

## See Also

- [project-architecture-reference skill](../../project-architecture-reference/SKILL.md) for overview
- [docs/arquitectura/scripts.md](../../../docs/arquitectura/scripts.md) for full technical details
- `scripts/build-dist.mjs` for production bundling (separate step, uses this as input)
