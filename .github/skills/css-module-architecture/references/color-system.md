# CSS Theme & Color System

Deep dive into how the color system is structured and how to add new colors safely.

## Two-Layer Architecture

### Layer 1: Primitives (Raw Values)

Defined at the top of `styles/global/_colors.css`. These are the actual hex/rgb values, grouped by family for discoverability:

```css
/* === PRIMITIVES === */

/* Blacks & Grays */
--black-rgb: 18, 32, 36;
--mist-1-rgb: 82, 102, 108;      /* Bright mist */
--mist-2-rgb: 113, 139, 150;     /* Medium mist */
--mist-3-rgb: 140, 160, 168;     /* Softer mist */
--mist-4-rgb: 170, 185, 192;     /* Very soft */

/* Backgrounds */
--bg-wood-1-rgb: 54, 37, 19;     /* Dark wood (panel backgrounds) */
--bg-wood-2-rgb: 89, 63, 29;     /* Lighter wood (raised surfaces) */
--bg-stone-rgb: 96, 96, 96;      /* Stone (neutral) */

/* Panels & Accents */
--green-panel-rgb: 72, 108, 101;    /* Green (panel surface) */
--green-accent-rgb: 97, 153, 137;   /* Brighter green (accent) */
--blue-accent-rgb: 70, 130, 180;    /* Blue (secondary) */

/* Text & Highlights */
--gold-rgb: 207, 163, 62;        /* Gold (highlights, borders) */
--red-rgb: 178, 34, 34;          /* Red (danger, negative) */

/* Dice Face Colors */
--die-1-rgb: 255, 255, 255;      /* White (1 on die) */
--die-2-rgb: 200, 100, 50;       /* Orange (2) */
--die-3-rgb: 255, 200, 0;        /* Gold (3) */
--die-4-rgb: 50, 150, 50;        /* Green (4) */
--die-5-rgb: 100, 100, 255;      /* Blue (5) */
--die-6-rgb: 255, 50, 50;        /* Red (6) */
```

**These are for reference only.** Never use directly in component files.

### Layer 2: Semantic Variables (What You Use)

Below primitives, the "Theme" section maps semantic names to primitives:

```css
/* === THEME === */

/* Text colors */
--text-mist-1: rgb(var(--mist-1-rgb));
--text-mist-2: rgb(var(--mist-2-rgb));
--text-mist-3: rgb(var(--mist-3-rgb));
--text-mist-4: rgb(var(--mist-4-rgb));

/* With opacity variants */
--text-soft-1: rgb(var(--mist-1-rgb), 0.9);
--text-soft-2: rgb(var(--mist-2-rgb), 0.8);
--text-soft-3: rgb(var(--mist-3-rgb), 0.7);
--text-soft-4: rgb(var(--mist-4-rgb), 0.6);
--text-soft-5: rgb(var(--mist-2-rgb), 0.5);  /* Alias for compatibility */

/* Background colors */
--bg-panel-surface: rgb(var(--bg-wood-1-rgb));
--bg-panel-raised: rgb(var(--bg-wood-2-rgb));
--bg-neutral: rgb(var(--bg-stone-rgb));

/* Accents */
--accent-gold: rgb(var(--gold-rgb));
--accent-green: rgb(var(--green-accent-rgb));
--accent-blue: rgb(var(--blue-accent-rgb));

/* Semantic uses */
--modal-danger-text: rgb(var(--gold-rgb));      /* Use gold for warnings */
--button-danger-bg: rgb(var(--red-rgb));        /* Use red for delete */
--button-success-bg: rgb(var(--green-panel-rgb));

/* Dice face background colors */
--die-1-bg: rgb(var(--die-1-rgb));
--die-2-bg: rgb(var(--die-2-rgb));
--die-3-bg: rgb(var(--die-3-rgb));
--die-4-bg: rgb(var(--die-4-rgb));
--die-5-bg: rgb(var(--die-5-rgb));
--die-6-bg: rgb(var(--die-6-rgb));
```

**Use these in component files.** Never hardcode colors.

---

## How to Add a New Color

### Scenario 1: New Ability Color (Ice)

You're adding an ice ability that needs cyan/blue tones.

1. **Find or create primitives** in `_colors.css`:
   ```css
   /* In PRIMITIVES section, grouped with blues/greens */
   --ice-light-rgb: 173, 216, 230;    /* Light cyan */
   --ice-dark-rgb: 70, 150, 200;      /* Dark blue */
   --ice-bright-rgb: 0, 255, 255;     /* Bright cyan (for effects) */
   ```

2. **Add semantic variables** in THEME section:
   ```css
   /* Ability: Ice */
   --ability-ice-bg-light: rgb(var(--ice-light-rgb));
   --ability-ice-bg-dark: rgb(var(--ice-dark-rgb));
   --ability-ice-text: rgb(var(--black-rgb), 0.9);
   --ability-ice-border: rgb(var(--ice-dark-rgb), 1.0);
   --ability-ice-glow: rgb(var(--ice-bright-rgb), 0.5);
   ```

3. **Use in component**:
   ```css
   /* styles/board/ability-ice.css */
   .ability-ice {
     background: var(--ability-ice-bg-light);
     border: 2px solid var(--ability-ice-border);
     color: var(--ability-ice-text);
     box-shadow: 0 0 10px var(--ability-ice-glow);
   }
   ```

### Scenario 2: New UI State (Disabled)

1. **Add primitive** (slight desaturation of existing):
   ```css
   --disabled-text-rgb: 120, 120, 120;
   ```

2. **Add semantic variable**:
   ```css
   --text-disabled: rgb(var(--disabled-text-rgb), 0.6);
   ```

3. **Use**:
   ```css
   button:disabled {
     color: var(--text-disabled);
     background: var(--bg-panel-surface);
     opacity: 0.6;
   }
   ```

---

## Color Consistency Rules

### Naming Convention

Semantic variable names follow this pattern:

```
--[element]-[semantic-meaning]-[variant]
```

- `element`: `text`, `bg`, `border`, `button`, `ability`, `card`, `icon`
- `semantic-meaning`: `danger`, `success`, `mist`, `gold`, `ice`, `wood`, etc.
- `variant`: `light`, `dark`, `soft`, `bright`, `glow` (optional)

Examples:
- `--text-danger` (red text for error)
- `--bg-panel-raised` (lighter wood background)
- `--border-gold` (gold border for premium)
- `--ability-ice-glow` (ice ability glow effect)

### Opacity Layering

Use opacity variants for different intensity levels:

```css
/* Light intensity */
--text-soft-1: rgb(var(--mist-1-rgb), 0.9);

/* Medium intensity */
--text-soft-2: rgb(var(--mist-2-rgb), 0.8);

/* Very light (almost invisible) */
--text-soft-5: rgb(var(--mist-2-rgb), 0.5);
```

Opacity variants should use the same primitive family (e.g., all mist variants come from `--mist-*-rgb`).

### A Future Theme Alternative

The two-layer system allows a future dark theme:

```css
/* Current (light) theme */
:root {
  --text-mist-1: rgb(82, 102, 108);     /* Bright text on light bg */
  --bg-panel-surface: rgb(54, 37, 19);  /* Dark wood */
}

/* Future dark theme */
:root[data-theme="dark"] {
  --text-mist-1: rgb(200, 220, 230);    /* Light text on dark bg */
  --bg-panel-surface: rgb(30, 30, 40);  /* Very dark bg */
}
```

This is possible **because component files only reference semantic variables**, never primitives.

---

## Gradient Token System

`styles/global/_gradients.css` centralizes multi-color gradients:

```css
/* Dice face gradients */
--gradient-die-light: linear-gradient(135deg, rgb(var(--gold-rgb)) 0%, rgb(var(--bg-wood-2-rgb)) 100%);
--gradient-die-dark: linear-gradient(135deg, rgb(var(--bg-wood-2-rgb)) 0%, rgb(var(--black-rgb)) 100%);

/* Panel backgrounds */
--gradient-panel-log: linear-gradient(180deg, rgb(var(--bg-wood-1-rgb)), rgb(var(--bg-wood-2-rgb)));
--gradient-panel-surface: linear-gradient(135deg, rgb(var(--green-panel-rgb)) 0%, rgb(var(--green-accent-rgb)) 100%);

/* Special effects */
--gradient-fire: linear-gradient(45deg, #ff4500, #ff8c00, #ffa500);
--gradient-ice: linear-gradient(45deg, #87ceeb, #00ced1, #00bfff);
```

Use in components:

```css
.die-face {
  background: var(--gradient-die-light);
}

.panel-background {
  background: var(--gradient-panel-log);
}
```

---

## Color Audit Tools

### Find Stray Colors (Outside `_colors.css`)

```bash
grep -r "#[0-9a-f]\|rgb(" styles/ \
  --exclude-dir=global \
  --exclude="*-rgb*" \
  | grep -v "^Binary"
```

Should return nothing (or only expected CSS functions like `rgb()` syntax, not values).

### Find Undefined Variables

```bash
npm run lint:css
```

Stylelint catches undefined `var(--x-y-z)` references.

### Color Contrast Audit

Use a browser DevTools color picker on production to verify accessibility:
- Text on background: WCAG AA (4.5:1 contrast ratio minimum)
- UI components: WCAG AA (3:1 minimum)

---

## See Also

- [SKILL.md](../SKILL.md) for quick reference
- [_colors.css](../../../styles/global/_colors.css) (actual file)
- [_gradients.css](../../../styles/global/_gradients.css) (actual file)
- [docs/architecture/css.md](../../../docs/architecture/css.md) for full details
