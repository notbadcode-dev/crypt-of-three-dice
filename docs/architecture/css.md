# Arquitectura y tooling CSS

## Organización en barrels

`styles/app.css` es el **único** fichero CSS referenciado por los tests
(`tests/e2e/e2e.spec.js`); la estructura interna de subcarpetas es libre
siempre que `app.css` siga siendo la entrada. Cada subcarpeta tiene su
propio barrel (`<carpeta>/<carpeta>.css`) importado desde `styles/app.css`:

- `global/`: tokens (`_colors.css`, `_gradients.css`, `_typography.css`,
  `_shadows.css`, `_motion.css`).
- `base/`: `reset.css`, `topbar.css`, `layout.css`.
- `board/`: `board-frame.css`, `board-slots.css`, `action-meter.css`,
  `enemy-card.css`, `hero-panel.css`, `turn-panel.css`, `board-debug.css` y
  `board-overrides.css` (⚠️ ver más abajo).
- `sidebar/`: `sidebar-panel.css`, `turn-phase.css`, `dice.css`,
  `skills.css`, `resources.css`, `logbar.css`, `info-legend.css`.
- `modals/`: `modal-shell.css`, `poster.css`, `choice-cards.css`,
  `save-load.css`, `start-modal.css`, `toast-tutorial.css`.
- `responsive/`: un fichero por breakpoint (`desktop.css`,
  `desktop-short.css`, `tablet.css`, `mobile.css`, `mobile-small.css`) más
  `misc.css` (reglas sin media query).

Al mover ficheros CSS entre subcarpetas hay que ajustar todos los `url(...)`
relativos (p. ej. `../assets/` → `../../assets/` al bajar un nivel).

### `board-overrides.css`: duplicados intencionados

`styles/board/board-overrides.css` contiene selectores **duplicados a
propósito** (`.enemy-meta`, `.enemy-meta-cell img`, `.enemy-meta-value`,
`.top-slot,.bottom-slot`, `.board-frame`, `.enemy-card`,
`.combat-dashboard`, `.combat-dashboard::before/::after`,
`.enemy-portrait-frame`, `.enemy-portrait`) que sobrescriben en cascada a
los definidos en `board-frame.css`/`enemy-card.css` por orden de
importación (misma especificidad). Este fichero **debe** seguir
importándose el último en `styles/board/board.css`; no fusionar estas
reglas con sus bases ni reordenar los `@import`. `stylelint`
(`no-duplicate-selectors`) no lo marca porque esa regla solo detecta
duplicados dentro de un mismo fichero.

## Theme de colores

`styles/global/_colors.css` tiene dos capas:

- **Paleta**: primitivos crudos agrupados por familia (fondos, verdes de
  panel, piedra, dorado, estados, dado, texto...). Único lugar del proyecto
  donde deben aparecer valores hex/rgb nuevos.
- **Tema semántico**: variables de uso (`--text-mist-1..4`,
  `--text-parchment*`, `--modal-danger-text`, etc.) que referencian la
  paleta. Incluye alias `--text-soft-1..5` mantenidos por compatibilidad con
  componentes existentes.

`styles/global/_gradients.css` centraliza gradientes reutilizables
compuestos desde la paleta (`--gradient-die-light`, `--gradient-die-dark`,
`--gradient-panel-log`, `--gradient-panel-surface`...).

**Regla estricta**: ningún fichero fuera de `styles/global/` debe declarar
un literal hex/rgb o un `linear-gradient(...)` nuevo; todo pasa por
variables de `_colors.css`/`_gradients.css`. Un futuro theme alternativo
debe sobrescribir solo la capa semántica (p. ej.
`:root[data-theme="..."] { ... }`), nunca la paleta ni los componentes.

### Gotcha: sintaxis `rgb()` mixta rompe el fondo silenciosamente

Las variables `--x-rgb` (p. ej. `--bg-wood-2-rgb`, `--black-rgb`) son
**tripletes separados por comas** (`18, 32, 36`), pensadas para la sintaxis
legacy `rgb(var(--x-rgb), alpha)`. Mezclar esa variable con alpha por `/`
(`rgb(var(--x-rgb) / 96%)`) produce CSS inválido
(`rgb(18, 32, 36 / 96%)`) — el navegador descarta toda la declaración
`background` sin ningún error de build ni de stylelint. Usar siempre
`rgb(var(--x-rgb), 0.96)` (coma + decimal), nunca `/` con estas variables.

## Tokens de movimiento

`styles/global/_motion.css` (importado desde `global/global.css`) centraliza
`--transition-fast/base/slow`, `--ease-out-soft`, `--ease-snap`, más un
bloque `@media (prefers-reduced-motion: reduce)` que fuerza duraciones ~0
globalmente. Reutilizar estos tokens en vez de declarar duraciones/easings
sueltos en componentes.

### Gotcha: `transform` rompe el test de estabilidad de layout

El test e2e "los elementos principales del layout permanecen estables
durante el flujo del turno" mide `getBoundingClientRect()` de una lista fija
de selectores con tolerancia ~1px. Cualquier `transform` (incluido en
`:hover`/`@keyframes`) aplicado directamente a uno de esos elementos medidos
altera el resultado de `getBoundingClientRect()` aunque no cambie el layout
box, rompiendo el test. Para dar feedback visual de hover/animación en esos
elementos, usar `opacity`, `filter`, `box-shadow`, `background-size` o
`width`/`height` en pseudo-elementos hijos — nunca `transform` en el
elemento medido directamente. Ver [../testing/e2e.md](../testing/e2e.md).

## Stylelint

- Config: `stylelint.config.mjs` (extiende `stylelint-config-standard`).
- Reglas de notación (color-function-notation/alias, alpha-value-notation,
  hue-degree-notation, media-feature-range-notation) activas.
  `value-keyword-case` activa con
  `ignoreProperties: ["/^font$/", "/^font-family$/", "/^--font/"]` para no
  romper la capitalización de nombres de fuente propios (SFMono-Regular,
  Menlo, Consolas).
- Desactivadas a propósito por chocar con el estilo existente:
  `selector-id-pattern`/`selector-class-pattern`/`custom-property-pattern`
  (ids camelCase compartidos con JS: `#levelHud`, `#hpHud`...),
  `no-descending-specificity` (ver `board-overrides.css` arriba),
  `import-notation`, reglas de línea en blanco,
  `declaration-block-single-line-max-declarations` (el proyecto usa reglas
  compactas de una línea a propósito),
  `declaration-block-no-redundant-longhand-properties`,
  `declaration-no-important` (usos reales y deliberados de `!important` en
  `modals.css`/`base.css` para overrides de estado).
- `stylelint-declaration-strict-value` activo para
  `color`/`background-color`/`border-color`/`fill`/`stroke` (obliga a usar
  `var()`/keyword). Deliberadamente **no** activado para
  `background`/`box-shadow` (shorthands): marcaría como error hasta palabras
  clave como `inset`/`center`/`0` dentro de esas propiedades.

## Verificación tras tocar CSS

1. `npx stylelint "styles/**/*.css"` (debe salir limpio).
2. `npm run build:runtime` si algo en `scripts/` referencia clases nuevas.
3. `npm run test:chromium` — si solo fallan tests de
   `visual-regression.spec.js` por diffs de píxeles pequeños esperados,
   regenerar snapshots:
   `npx playwright test --project=chromium tests/e2e/visual-regression.spec.js --update-snapshots`
   (y repetir para `webkit`/`mobile` si aplica) y volver a correr la suite
   completa para confirmar 100% verde.
4. Comprobación visual manual (Playwright MCP o navegador) cuando el cambio
   afecte a layout, ya que no toda combinación de tamaños tiene test
   automatizado.
