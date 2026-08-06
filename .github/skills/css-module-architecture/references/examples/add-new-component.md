---
name: "add-new-component"
type: "example"
parent_skill: "css-module-architecture"
keywords: ["CSS component", "BEM naming", "semantic variables", "workflow"]
example_scenario: "Add enemy-status-bar component"
updated: "2026-08-06"
---

# Example: Adding a New Component with Proper Styling

Scenario: You're adding a new "enemy status bar" component that shows health, armor, and status effects.

## Step 1: Create TypeScript Component

```typescript
// scripts/ui/enemy-status-bar.ts
export function createEnemyStatusBar(enemy: any) {
  const bar = document.createElement('div');
  bar.className = 'enemy-status-bar';
  
  // Health
  const health = document.createElement('div');
  health.className = 'enemy-status-bar__health';
  health.innerHTML = `
    <div class="status-bar__label">HP</div>
    <div class="status-bar__value">${enemy.hp} / ${enemy.maxHp}</div>
  `;
  bar.appendChild(health);
  
  // Armor
  const armor = document.createElement('div');
  armor.className = 'enemy-status-bar__armor';
  armor.innerHTML = `
    <div class="status-bar__label">Armor</div>
    <div class="status-bar__value">${enemy.armor}</div>
  `;
  bar.appendChild(armor);
  
  // Status effects
  const effects = document.createElement('div');
  effects.className = 'enemy-status-bar__effects';
  enemy.effects.forEach(effect => {
    const badge = document.createElement('span');
    badge.className = `status-badge status-badge--${effect}`;
    badge.textContent = effect;
    effects.appendChild(badge);
  });
  bar.appendChild(effects);
  
  return bar;
}
```

## Step 2: Create CSS with Semantic Variables

```css
/* styles/board/enemy-status-bar.css */

.enemy-status-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-base);
  padding: var(--space-base);
  background: var(--bg-panel-surface);
  border: 1px solid var(--gold-rgb);
  border-radius: var(--radius-base);
}

.enemy-status-bar__health,
.enemy-status-bar__armor,
.enemy-status-bar__effects {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-bar__label {
  min-width: 40px;
  font-weight: bold;
  color: var(--text-mist-1);
  font-size: var(--font-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-bar__value {
  flex: 1;
  color: var(--text-mist-2);
  font-family: monospace;
  font-size: var(--font-base);
}

/* Health bar visual */
.enemy-status-bar__health::after {
  content: '';
  display: block;
  width: 100%;
  height: 4px;
  background: var(--bg-neutral);
  border-radius: 2px;
  overflow: hidden;
}

/* Status effect badges */
.status-badge {
  display: inline-block;
  padding: 2px 6px;
  background: var(--accent-gold);
  color: var(--black-rgb);
  border-radius: 2px;
  font-size: var(--font-xs);
  font-weight: bold;
  transition: transform var(--transition-fast) var(--ease-out-soft);
}

.status-badge:hover {
  transform: scale(1.1);
}

/* Variants for different status types */
.status-badge--poison {
  background: var(--ability-poison-bg, rgb(100, 200, 50)); /* Fallback if not defined */
  color: var(--black-rgb);
}

.status-badge--frozen {
  background: var(--ability-ice-bg-light);
  color: var(--black-rgb);
}

.status-badge--burning {
  background: var(--ability-fire-bg, rgb(255, 100, 0)); /* Fallback */
  color: var(--white-rgb);
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .enemy-status-bar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  
  .status-bar__label {
    min-width: auto;
  }
}
```

## Step 3: Import into Barrel

```css
/* styles/board/board.css */
@import url("./board-frame.css");
@import url("./board-slots.css");
@import url("./enemy-card.css");
@import url("./enemy-status-bar.css");   /* ← Add new component */
@import url("./hero-panel.css");
@import url("./turn-panel.css");
@import url("./action-meter.css");
@import url("./board-debug.css");
@import url("./board-overrides.css");    /* KEEP LAST */
```

## Step 4: Add Missing Color Variables (If Needed)

If you used `--ability-poison-bg` or `--ability-fire-bg` and they don't exist, add them to `styles/global/_colors.css`:

```css
/* In PRIMITIVES section */
--poison-green-rgb: 100, 200, 50;
--fire-orange-rgb: 255, 100, 0;

/* In THEME section */
--ability-poison-bg: rgb(var(--poison-green-rgb));
--ability-poison-text: rgb(var(--black-rgb), 0.9);

--ability-fire-bg: rgb(var(--fire-orange-rgb));
--ability-fire-text: rgb(var(--white-rgb), 1.0);
```

## Step 5: Test & Validate

```bash
# Type-check TypeScript
npm run typecheck

# Lint CSS (catches undefined variables, syntax errors)
npm run lint:css

# Build runtime + e2e test (validates in browser)
npm run build:runtime
npm run test:chromium

# Update snapshots if layout changed
npm run test:chromium -- --update-snapshots
```

## Key Points Demonstrated

✅ **Semantic variables only**: All colors via `var(--text-mist-1)`, `var(--bg-panel-surface)`, etc.
✅ **Motion tokens**: `var(--transition-fast)`, `var(--ease-out-soft)`
✅ **Responsive design**: Media query override for mobile layout
✅ **Fallback values**: Used in badge variants for future extensibility
✅ **BEM naming**: `.enemy-status-bar__health`, `.status-badge--poison`
✅ **No hardcoded colors**: Every color is a variable or in `_colors.css`

---

## See Also

- [barrel-pattern.md](../references/barrel-pattern.md) for import mechanics
- [color-system.md](../references/color-system.md) for adding new colors
- [SKILL.md](../SKILL.md) for quick reference
