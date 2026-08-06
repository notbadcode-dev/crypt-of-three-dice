---
name: "css-module-architecture"
description: "CSS barrel pattern, theme tokens, cascade rules, and module organization"
compatibility: "Essential for CSS edits; prerequisite for style changes without breaking cascade"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# CSS Module Architecture

This skill explains how CSS is organized in barrels, how the theme centralizes colors and tokens, and critical cascade rules.

## Quick Reference

| Task | Location | When |
|------|----------|------|
| Add new color | `styles/global/_colors.css` | Before using in any component |
| Add new motion token | `styles/global/_motion.css` | Before declaring custom transitions/animations |
| Add new component styles | `styles/<category>/<component>.css` + update barrel | When adding UI elements |
| Update board layout | `styles/board/board-frame.css` | For major layout changes |
| Responsive overrides | `styles/responsive/<breakpoint>.css` | For viewport-specific rules |
| Lint CSS | `npm run lint:css` | After every style change |

---

## Barrel Pattern: Single Entry, Modular Inside

### Main Entry: `styles/app.css`

All HTML links only this file:

```html
<link rel="stylesheet" href="/styles/app.css">
```

Inside, it imports barrels in strict order:

```css
/* styles/app.css */
@import url("./global/global.css");      /* Tokens first */
@import url("./base/base.css");          /* Resets */
@import url("./board/board.css");        /* Components */
@import url("./sidebar/sidebar.css");
@import url("./modals/modals.css");
@import url("./responsive/responsive.css");  /* Overrides last */
```

### Barrel Structure

Each category has a barrel file that collects its modules:

| Category | Barrel | Sub-modules | Purpose |
|----------|--------|------------|---------|
| `global/` | `global.css` | `_colors.css`, `_gradients.css`, `_typography.css`, `_motion.css`, `_shadows.css` | Design tokens, theme |
| `base/` | `base.css` | `reset.css`, `topbar.css`, `layout.css` | Global resets + page layout |
| `board/` | `board.css` | `board-frame.css`, `board-slots.css`, `enemy-card.css`, `hero-panel.css`, `turn-panel.css`, `action-meter.css`, `board-debug.css`, **`board-overrides.css`** | Game board + pieces |
| `sidebar/` | `sidebar.css` | `sidebar-panel.css`, `turn-phase.css`, `dice.css`, `skills.css`, `resources.css`, `logbar.css`, `info-legend.css` | Game sidebar UI |
| `modals/` | `modals.css` | `modal-shell.css`, `poster.css`, `choice-cards.css`, `save-load.css`, `start-modal.css`, `toast-tutorial.css` | Modals + dialogs |
| `responsive/` | `responsive.css` | `desktop.css`, `desktop-short.css`, `tablet.css`, `mobile.css`, `mobile-small.css`, `misc.css` | Media query overrides |

### Why Barrels?

- **Modularity**: Developers edit specific component files (`board-ui.ts` pairs with `styles/board/board-frame.css`)
- **Maintainability**: Don't modify core bundle; keep refactors isolated
- **Production**: CSS can be bundled + minified as single file (see `build:dist`)

---

## Design Tokens: Colors, Gradients, Motion

### Layer 1: Primitives (Never Use Directly)

`styles/global/_colors.css` has a palette:

```css
/* styles/global/_colors.css */

/* Primitives: grouped by family */
--black-rgb: 18, 32, 36;
--mist-1-rgb: 82, 102, 108;
--mist-2-rgb: 113, 139, 150;

--bg-wood-1-rgb: 54, 37, 19;
--bg-wood-2-rgb: 89, 63, 29;

--green-panel-rgb: 72, 108, 101;
--green-accent-rgb: 97, 153, 137;

--gold-rgb: 207, 163, 62;
/* ... more colors ... */
```

**Rule**: Never write `#2a2c24` or `rgb(42, 44, 36)` outside this file.

### Layer 2: Semantic Variables (What You Use)

Still in `_colors.css`, a theme section translates primitives to semantic names:

```css
/* Theme section: semantic variables */
--text-mist-1: rgb(var(--mist-1-rgb));        /* Bright text */
--text-mist-2: rgb(var(--mist-2-rgb));        /* Medium text */
--text-soft-1: rgb(var(--mist-1-rgb), 0.9);   /* Soft text (90% opacity) */
--text-soft-2: rgb(var(--mist-2-rgb), 0.8);   /* Softer (80% opacity) */

--bg-panel-surface: rgb(var(--bg-wood-1-rgb));
--bg-panel-raised: rgb(var(--bg-wood-2-rgb));
--modal-danger-text: rgb(var(--gold-rgb));

/* Aliases for compatibility */
--text-soft-5: rgb(var(--mist-2-rgb), 0.7);
```

**Rule**: Use `--text-mist-1`, `--bg-panel-surface`, etc., **never** primitives in component files.

### Gotcha: RGB with Alpha

The variables like `--mist-1-rgb` are **comma-separated triples** (`82, 102, 108`), designed for legacy `rgb()` syntax with alpha:

```css
/* ✅ Correct */
color: rgb(var(--mist-1-rgb), 0.8);  /* Uses coma + decimal alpha */

/* ❌ Wrong */
color: rgb(var(--mist-1-rgb) / 0.8); /* Syntax: rgb(82, 102, 108 / 0.8) — invalid */
```

The wrong syntax produces invalid CSS (`rgb(82, 102, 108 / 0.8)`), and browsers silently drop the entire `color` property without warning. **Always use comma**, never `/` with `-rgb` variables.

### Gradients

`styles/global/_gradients.css` centralizes reusable gradients:

```css
--gradient-die-light: linear-gradient(135deg, rgb(var(--gold-rgb)) 0%, rgb(var(--bg-wood-2-rgb)) 100%);
--gradient-panel-log: linear-gradient(180deg, rgb(var(--bg-wood-1-rgb)), rgb(var(--bg-wood-2-rgb)));
```

Use in components:

```css
/* ✅ Component file */
.die-face {
  background: var(--gradient-die-light);
}
```

### Motion Tokens

`styles/global/_motion.css` standardizes timing + easing:

```css
--transition-fast: 0.15s;
--transition-base: 0.3s;
--transition-slow: 0.6s;

--ease-out-soft: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-snap: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0.01s;
    --transition-base: 0.01s;
    --transition-slow: 0.01s;
  }
}
```

Use in components:

```css
.combat-card {
  transition: transform var(--transition-base) var(--ease-out-soft);
}
```

**Always use motion tokens**, never hardcoded durations like `0.3s` or `ease-out`.

---

## Cascade & Specificity Rules

### Import Order in `app.css`

```css
@import url("./global/global.css");      /* 1. Tokens */
@import url("./base/base.css");          /* 2. Element resets (low specificity) */
@import url("./board/board.css");        /* 3. Component layers */
@import url("./sidebar/sidebar.css");
@import url("./modals/modals.css");
@import url("./responsive/responsive.css");  /* 4. Overrides (highest specificity) */
```

This order ensures:
- **Tokens** available to all components
- **Base resets** (low spec) overridable by components
- **Component layers** have consistent baseline
- **Responsive** rules (media queries) override desktop defaults

### Specificity: Keep It Low

All CSS uses class selectors, no IDs (IDs have high specificity, hard to override):

```css
/* ✅ Good: single class */
.enemy-card { ... }
.enemy-card--selected { ... }  /* BEM modifier */

/* ✅ Good: descendant combinator */
.combat-dashboard .action-button { ... }

/* ❌ Avoid: unnecessary nesting */
.board-frame .board-slots .slot .piece { ... }

/* ❌ Never: ID selector */
#enemy-card-1 { ... }
```

### Order-Based Cascading: `board-overrides.css`

**Special case**: `styles/board/board-overrides.css` contains **intentional duplicate selectors** that override earlier rules:

```css
/* board-frame.css */
.enemy-meta { background: var(--bg-wood-1-rgb); }

/* board-overrides.css */
.enemy-meta { background: var(--bg-panel-raised); }  /* Later = overrides */
```

Same specificity (single class), later import wins. This pattern is used for cascading tweaks without reordering the entire cascade.

**Don't merge duplicates into base files** — the override pattern is intentional for maintainability.

---

## Adding New Styles

### Workflow: New Component

Scenario: Adding a new "powerup card" UI component.

1. **Create the component file**:
   ```css
   /* styles/board/powerup-card.css */
   .powerup-card {
     display: flex;
     background: var(--bg-panel-raised);
     border: 2px solid var(--gold-rgb);
     padding: var(--space-base);
     border-radius: var(--radius-base);
     transition: transform var(--transition-fast) var(--ease-out-soft);
   }

   .powerup-card:hover {
     transform: scale(1.05);
   }

   .powerup-card__name {
     color: var(--text-mist-1);
     font-size: var(--font-lg);
     font-weight: bold;
   }
   ```

2. **Import in the barrel**:
   ```css
   /* styles/board/board.css */
   @import url("./board-frame.css");
   @import url("./powerup-card.css");  /* ← Add here */
   @import url("./board-overrides.css");  /* Keep last */
   ```

3. **Use semantic tokens only**:
   - Colors: `var(--text-mist-1)`, `var(--bg-panel-raised)`, `var(--gold-rgb)`
   - Motion: `var(--transition-fast)`, `var(--ease-out-soft)`
   - Typography: `var(--font-lg)`, `var(--font-family-base)`
   - No hardcoded `#fff`, `0.3s`, or `ease-out`

4. **Lint & test**:
   ```bash
   npm run lint:css
   npm run test:chromium -- --update-snapshots  # If layout changed
   ```

### Workflow: New Motion Token

Scenario: Adding a custom animation curve for a new effect.

```css
/* styles/global/_motion.css */

/* Add to motion tokens */
--ease-bounce-in: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

Then use:

```css
/* Any component file */
.explosion-effect {
  animation: scale-burst 0.5s var(--ease-bounce-in);
}

@keyframes scale-burst {
  from { transform: scale(0); opacity: 1; }
  to { transform: scale(1); opacity: 0; }
}
```

**Important**: Put keyframes (animation definitions) in the component file, not `_motion.css`. `_motion.css` holds reusable tokens only.

### Workflow: New Color

Scenario: Adding a new "ice" theme color for a new ability.

1. **Add to primitives** in `styles/global/_colors.css`:
   ```css
   /* Primitives */
   --ice-light-rgb: 173, 216, 230;
   --ice-dark-rgb: 70, 150, 200;
   ```

2. **Add to theme** in same file:
   ```css
   /* Theme */
   --ability-ice-light: rgb(var(--ice-light-rgb));
   --ability-ice-dark: rgb(var(--ice-dark-rgb));
   --ability-ice-text: rgb(var(--black-rgb), 0.9);
   ```

3. **Use in component**:
   ```css
   .ice-effect {
     background: var(--ability-ice-light);
     color: var(--ability-ice-text);
     border: 2px solid var(--ability-ice-dark);
   }
   ```

---

## Responsive Design

Media query overrides live in `styles/responsive/`:

| File | Breakpoint | Use For |
|------|-----------|---------|
| `desktop.css` | `min-width: 1100px` | 4K, 1440p, large laptops |
| `desktop-short.css` | `max-height: 800px` | Tall aspect ratio (wide, short) |
| `tablet.css` | `600px ≤ width < 1100px` | iPad, large phones |
| `mobile.css` | `max-width: 599px` | iPhone, Android phone |
| `mobile-small.css` | `max-width: 400px` | Older small phones |
| `misc.css` | (no media query) | Print, orientation, etc. |

Example:

```css
/* styles/responsive/mobile.css */
@media (max-width: 599px) {
  .board-frame {
    width: 95vw;
    max-height: 85vh;
  }

  .sidebar {
    order: -1;  /* Sidebar above board on mobile */
  }

  .modal-shell {
    width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
  }
}
```

**Gotcha**: If you change a responsive breakpoint (e.g., `1100px` → `1200px`), check that tests still pass. Playwright tests validate layout at specific viewports; mismatches cause false failures.

---

## Linting & Validation

### Run Stylelint

```bash
npm run lint:css          # Check only
npm run lint:css:fix      # Auto-fix (removes trailing spaces, etc.)
```

Stylelint checks:
- Variable usage (undefined variables)
- Duplicate selectors **within same file** (doesn't catch intentional cross-file duplicates)
- Invalid syntax

### Manual Spot Check

```bash
# Search for literals outside _colors.css
grep -r "rgb\|#[0-9a-f]\|linear-gradient" styles/ --exclude-dir=global

# Should find nothing (except expected in _colors.css, _gradients.css)
```

---

## See Also

- [project-architecture-reference skill](../../project-architecture-reference/SKILL.md) for file structure
- [critical-rules.md](../../project-architecture-reference/references/critical-rules.md) for dos/don'ts
- [docs/arquitectura/css.md](../../../docs/arquitectura/css.md) for full technical details
- [`playwright-e2e-patterns` skill](../../playwright-e2e-patterns/SKILL.md) for testing CSS changes
