---
name: "barrel-pattern"
type: "reference"
parent_skill: "css-module-architecture"
keywords: ["CSS organization", "barrels", "import order", "maintenance"]
updated: "2026-08-06"
---

# CSS Barrel Pattern Details

Reference for understanding and maintaining the CSS module organization.

## The Barrel Concept

A **barrel** is a central `.css` file that imports a category's sub-files:

```
styles/board/
├── board.css              ← Barrel (imports all below)
├── board-frame.css        ← Sub-module
├── board-slots.css        ← Sub-module
├── enemy-card.css         ← Sub-module
├── hero-panel.css         ← Sub-module
├── turn-panel.css         ← Sub-module
├── action-meter.css       ← Sub-module
├── board-debug.css        ← Sub-module
└── board-overrides.css    ← Special: cascade overrides (import last)
```

The barrel file (`board.css`) imports all sub-modules in order:

```css
/* styles/board/board.css */
@import url("./board-frame.css");
@import url("./board-slots.css");
@import url("./enemy-card.css");
@import url("./hero-panel.css");
@import url("./turn-panel.css");
@import url("./action-meter.css");
@import url("./board-debug.css");
@import url("./board-overrides.css");  /* MUST BE LAST */
```

Then, the main `styles/app.css` imports only the barrels:

```css
/* styles/app.css */
@import url("./global/global.css");
@import url("./base/base.css");
@import url("./board/board.css");     /* Barrel, not individual files */
@import url("./sidebar/sidebar.css");
@import url("./modals/modals.css");
@import url("./responsive/responsive.css");
```

**Benefit**: Developers edit component files (`board-frame.css`), not the main `app.css`. Renaming or reordering components is isolated.

---

## Typical Barrel Structure

### `global/global.css` (Tokens)

```css
/* styles/global/global.css */
@import url("./_colors.css");
@import url("./_gradients.css");
@import url("./_typography.css");
@import url("./_motion.css");
@import url("./_shadows.css");
```

**Purpose**: Define all reusable tokens. No component-specific rules.

### `base/base.css` (Resets)

```css
/* styles/base/base.css */
@import url("./reset.css");    /* Element resets (*, body, h1-h6, etc.) */
@import url("./layout.css");   /* Page-level layout (#root, .container) */
@import url("./topbar.css");   /* Header/topbar component */
```

**Purpose**: Global resets + page-level structure.

### `board/board.css` (Components)

```css
/* styles/board/board.css */
@import url("./board-frame.css");     /* .board-frame container */
@import url("./board-slots.css");     /* .slot elements */
@import url("./enemy-card.css");      /* .enemy-card component */
@import url("./hero-panel.css");      /* .hero-panel component */
@import url("./turn-panel.css");      /* .turn-panel component */
@import url("./action-meter.css");    /* .action-meter component */
@import url("./board-debug.css");     /* Debug overlays (optional) */
@import url("./board-overrides.css"); /* Cascade fixes (LAST) */
```

### Other Barrels: `sidebar/`, `modals/`

Same pattern: one barrel file imports all sub-components.

### `responsive/responsive.css` (Overrides)

```css
/* styles/responsive/responsive.css */
@import url("./desktop.css");
@import url("./desktop-short.css");
@import url("./tablet.css");
@import url("./mobile.css");
@import url("./mobile-small.css");
@import url("./misc.css");
```

**Purpose**: Media query overrides. Imported last in `app.css` so they cascade over base rules.

---

## Adding a New Component File to a Barrel

### Scenario: Add `styles/board/status-bar.css`

1. **Create the file**:
   ```css
   /* styles/board/status-bar.css */
   .status-bar {
     display: flex;
     gap: var(--space-base);
     padding: var(--space-sm);
     background: var(--bg-panel-surface);
     border-bottom: 1px solid var(--mist-2-rgb);
   }

   .status-bar__item {
     flex: 1;
     font-size: var(--font-sm);
     color: var(--text-mist-2);
   }
   ```

2. **Add to barrel** (`styles/board/board.css`):
   ```css
   @import url("./board-frame.css");
   @import url("./board-slots.css");
   @import url("./enemy-card.css");
   @import url("./hero-panel.css");
   @import url("./status-bar.css");      /* ← Add here (logical order) */
   @import url("./turn-panel.css");
   @import url("./action-meter.css");
   @import url("./board-debug.css");
   @import url("./board-overrides.css"); /* MUST STAY LAST */
   ```

3. **Lint**:
   ```bash
   npm run lint:css
   ```

---

## Moving a Component Between Barrels

### Scenario: Move `styles/modals/choice-cards.css` → `styles/board/`

1. **Move the file**:
   ```bash
   git mv styles/modals/choice-cards.css styles/board/choice-cards.css
   ```

2. **Update relative URLs in the file** (if any):
   - `url(../assets/...)` → `url(../../assets/...)` (went one level deeper)

3. **Remove from old barrel** (`styles/modals/modals.css`):
   ```css
   @import url("./modal-shell.css");
   /* REMOVE: @import url("./choice-cards.css"); */
   @import url("./poster.css");
   ```

4. **Add to new barrel** (`styles/board/board.css`):
   ```css
   @import url("./board-frame.css");
   @import url("./choice-cards.css");  /* ← Add (logical location) */
   @import url("./board-overrides.css");  /* MUST STAY LAST */
   ```

5. **Test**:
   ```bash
   npm run lint:css
   npm run test:chromium
   ```

---

## The Special Case: `board-overrides.css`

### Why Duplicates?

`styles/board/board-overrides.css` redefines selectors from earlier files with **same specificity** (single class):

```css
/* board-frame.css */
.enemy-meta { background: var(--bg-wood-1-rgb); }

/* board-overrides.css (imported later) */
.enemy-meta { background: var(--bg-panel-raised); }
```

Later import + same specificity = override. This avoids increasing specificity (which makes future overrides harder).

### When to Use Overrides

Use `board-overrides.css` when:
- Tweaking existing component defaults **without changing the base file**
- Fine-tuning cascade for edge cases
- A component needs different styling in specific contexts (e.g., "enemy card in hand" vs "enemy card on board")

Example:

```css
/* board-frame.css */
.enemy-card { padding: var(--space-base); }

/* board-overrides.css */
.board-frame .enemy-card { padding: var(--space-lg); }  /* Bigger padding on board */
```

### Maintenance

- **Don't merge overrides into base files** — it defeats the purpose
- **Keep overrides file short** — if it gets huge, consider restructuring base files
- **Document why an override exists** — add comments if it's non-obvious

```css
/* Override: combat mode requires more spacing for turn indicators */
.enemy-card--combat { padding: var(--space-xl); }
```

---

## Creating a New Barrel Category

Rare, but sometimes you need a new top-level category (beyond board, sidebar, modals).

### Scenario: Add a new `animations/` category

1. **Create folder + barrel**:
   ```bash
   mkdir styles/animations
   touch styles/animations/animations.css
   ```

2. **Create sub-components** (if needed):
   ```css
   /* styles/animations/animations.css */
   @import url("./fade-in.css");
   @import url("./slide-out.css");
   @import url("./pulse.css");
   ```

3. **Add to main `app.css`** (in logical order):
   ```css
   @import url("./global/global.css");
   @import url("./base/base.css");
   @import url("./board/board.css");
   @import url("./sidebar/sidebar.css");
   @import url("./animations/animations.css");  /* ← New category */
   @import url("./modals/modals.css");
   @import url("./responsive/responsive.css");
   ```

---

## See Also

- [SKILL.md](../SKILL.md) for overview of tokens + cascade rules
- [project-architecture-reference skill](../../project-architecture-reference/SKILL.md) for file structure
- [docs/arquitectura/css.md](../../../docs/arquitectura/css.md) for full technical details
