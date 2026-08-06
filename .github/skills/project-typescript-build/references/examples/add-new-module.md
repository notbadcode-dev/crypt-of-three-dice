---
name: "add-new-module"
type: "example"
parent_skill: "project-typescript-build"
keywords: ["TypeScript", "module", "sourceFiles", "dependencies", "workflow"]
example_scenario: "Add enchantment.ts to the system"
updated: "2026-08-06"
---

# Example: Adding a New Game System

Scenario: You're adding a new `enchantment` system to the game. Here's how to structure it with the build pipeline.

## Step 1: Create the Module

```bash
# New module: scripts/core/enchantment.ts
```

```typescript
// scripts/core/enchantment.ts
import { CLASS_IDS } from "../config/types.ts";
import { PHASES } from "../config/types.ts";

export interface Enchantment {
  id: string;
  effect: (target: any) => void;
  duration: number;
}

export const ENCHANTMENTS: Record<string, Enchantment> = {
  "fire_bolt": {
    id: "fire_bolt",
    effect: (target) => { target.hp -= 5; },
    duration: 1
  }
};

export function applyEnchantment(target: any, enchantmentId: string) {
  const ench = ENCHANTMENTS[enchantmentId];
  if (ench) {
    ench.effect(target);
  }
}
```

**Dependencies**: `types.ts` (for CLASS_IDS, PHASES constants)

## Step 2: Update `build-runtime.mjs`

Find where `enchantment.ts` dependencies are located in `sourceFiles`:

```javascript
const sourceFiles = [
  "scripts/config/types.js",           // ✅ Dependency 1
  "scripts/config/app-config.js",
  "scripts/state/app-state.js",
  "scripts/core/geometry.js",
  "scripts/state/persistence.js",
  "scripts/core/audio.js",             // ✅ Dependency 2
  "scripts/core/dice.js",
  "scripts/core/combat.js",            // ✅ Dependency 3
  "scripts/core/game-flow.js",         // ← Insert NEW MODULE after LAST dependency
  // ...
];
```

If your module imports `combat.ts`, insert **after** `combat.js`:

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
  "scripts/core/enchantment.js",       // ← NEW (after combat, which it imports)
  "scripts/core/game-flow.js",
  // ...
];
```

## Step 3: Import in Dependent Modules

In `scripts/core/combat.ts`, add the enchantment system to your combat resolution:

```typescript
// scripts/core/combat.ts (updated)
import { applyEnchantment } from "./enchantment";  // ← New import

export function resolveCombat(attacker: any, defender: any) {
  // ... existing combat logic ...
  
  // Apply enchantments if hero has them
  if (attacker.enchantments?.length) {
    attacker.enchantments.forEach(id => {
      applyEnchantment(defender, id);
    });
  }
}
```

## Step 4: Rebuild & Test

```bash
# Regenerate bundle
npm run build:runtime

# Check output (should have comment marker)
grep "enchantment.js" scripts/app.js

# Run unit tests
npm run test:unit

# Run e2e tests (validates bundle order)
npm run test:chromium
```

## Step 5: Use in UI

```typescript
// scripts/ui/app-ui.ts
import { applyEnchantment, ENCHANTMENTS } from "../core/enchantment";

function renderEnchantmentPanel() {
  const panel = document.getElementById('enchantments');
  Object.values(ENCHANTMENTS).forEach(ench => {
    const btn = document.createElement('button');
    btn.textContent = ench.id;
    btn.onclick = () => applyEnchantment(hero, ench.id);
    panel.appendChild(btn);
  });
}
```

**Note**: All `import` statements in `.ts` files are valid (module syntax). They get stripped during concatenation, making globals accessible.

---

## What NOT to Do

### ❌ Creating a Barrel

Don't do this:

```typescript
// ❌ scripts/core/systems/index.ts
export * from "./enchantment";
export * from "./blessing";
```

The `export *` survives the regex, breaking the bundle. Instead:

```typescript
// ✅ scripts/core/enchantment.ts (standalone)
export interface Enchantment { ... }
export const ENCHANTMENTS = { ... };
export function applyEnchantment(...) { ... }
```

### ❌ Forgetting `sourceFiles` Update

```bash
# If you forget to add to sourceFiles:
npm run build:runtime  # Succeeds (file compiles)
npm run test:chromium  # ❌ FAILS (enchantment undefined in runtime)
```

### ❌ Wrong Insertion Order

If `enchantment.ts` imports `combat.ts` but you insert it **before** combat in `sourceFiles`, the runtime error is:

```
ReferenceError: resolveCombat is not defined
```

(Because `combat.js` hasn't concatenated yet when `enchantment.js` runs.)

---

## Verification

After build, check that the bundle is correct:

```bash
# List module boundaries
grep "^/\*.*\.js" scripts/app.js

# Should show in correct order:
# /* types.js */
# /* app-config.js */
# /* app-state.js */
# ...
# /* enchantment.js */  ← Appears after combat
# /* game-flow.js */
# ...
```

All good! Commit:

```bash
git add scripts/core/enchantment.ts scripts/build-runtime.mjs scripts/app.js
git commit -m "feat: add enchantment system

- New module: scripts/core/enchantment.ts (interface, ENCHANTMENTS map, applyEnchantment)
- Updated: scripts/core/combat.ts to apply enchantments on hit
- Updated: build-runtime.mjs sourceFiles order (enchantment after combat)
- Regenerated: scripts/app.js bundle"
```

