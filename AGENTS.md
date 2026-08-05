# Contexto del proyecto

## Resumen
- Proyecto: `Umbral de los Tres Dados`
- Tipo: juego táctico retro en una sola página HTML con assets, estilos y scripts separados.
- Entrada principal: `index.html`
- Objetivo actual del repo: mantener la experiencia jugable y su infraestructura de tests Playwright.

## Estructura
- `index.html`: shell principal de la aplicación y markup de la UI.
- `styles/`: CSS organizado en subcarpetas temáticas, cada una con su propio barrel (`<carpeta>/<carpeta>.css`) importado desde `styles/app.css`:
  - `global/`: tokens (`_colors.css`, `_typography.css`, `_shadows.css`).
  - `base/`: `reset.css`, `topbar.css`, `layout.css`.
  - `board/`: `board-frame.css`, `board-slots.css`, `action-meter.css`, `enemy-card.css`, `hero-panel.css`, `turn-panel.css`, `board-debug.css` y `board-overrides.css` (⚠️ overrides intencionados, importado el último — ver más abajo).
  - `sidebar/`: `sidebar-panel.css`, `turn-phase.css`, `dice.css`, `skills.css`, `resources.css`, `logbar.css`, `info-legend.css`.
  - `modals/`: `modal-shell.css`, `poster.css`, `choice-cards.css`, `save-load.css`, `start-modal.css`, `toast-tutorial.css`.
  - `responsive/`: un fichero por breakpoint (`desktop.css`, `desktop-short.css`, `tablet.css`, `mobile.css`, `mobile-small.css`) más `misc.css` (reglas sin media query).
  - `styles/app.css` es el único fichero CSS referenciado por los tests (`tests/e2e/e2e.spec.js`); la estructura interna de subcarpetas es libre siempre que `app.css` siga siendo la entrada.
- `scripts/config/`: configuración, constantes y tipos (`app-config.ts`, `types.ts`).
- `scripts/state/`: estado global y persistencia (`app-state.ts`, `persistence.ts`).
- `scripts/core/`: lógica de juego pura (`audio.ts`, `combat.ts`, `dice.ts`, `game-flow.ts`, `geometry.ts`).
- `scripts/ui/`: renderizado e interacciones de interfaz (`app-ui.ts`, `board-ui.ts`, `hud-ui.ts`, `modal-manager.ts`, `save-load-ui.ts`, `ui-feedback.ts`).
- `scripts/app-core.ts`: barrel de re-exports de `state/` y `core/`, usado por los tests unitarios (no entra en el bundle de producción).
- `scripts/app-main.ts`: arranque de la aplicación.
- `scripts/build-runtime.mjs`: concatena los módulos anteriores (en un orden fijo, ver `sourceFiles`) en `scripts/app.js`.
- `assets/`: iconos e imágenes.
- `tests/e2e/`: pruebas Playwright.
- `tests/unit/`: pruebas unitarias Node si existen para la lógica aislada.

## Flujo de trabajo
- Si se editan archivos dentro de `scripts/` (`config/`, `state/`, `core/`, `ui/`, `app-core.ts`, `app-main.ts`), normalmente hay que regenerar `scripts/app.js` con `npm run build:runtime`.
- La app se sirve en tests desde `http://127.0.0.1:4173/index.html`.
- No asumir framework: esto es HTML/CSS/TS modular sin bundler de frontend.

## Comandos útiles
- `npm run build:runtime`: compila TS (`tsc`) y reconstruye `scripts/app.js`.
- `npm run typecheck`: solo comprueba tipos (`tsc --noEmit`), sin generar `scripts/app.js`.
- `npm run lint`: ESLint (flat config) sobre `scripts/**/*.ts`, `.mjs` y el HTML principal.
- `npm run lint:css`: Stylelint sobre `styles/**/*.css`.
- `npm test` o `npm run test:e2e`: ejecuta Playwright.
- `npm run test:unit`: ejecuta los tests unitarios (Node test runner) sobre `tests/unit/*.test.mjs`, importando `.tsbuild/scripts/app-core.js`.
- `npm run test:chromium`: tests solo en Chromium.
- `npm run test:headed`: tests visibles.
- `npm run serve`: servidor estático para pruebas locales.

## Convenciones
- Mantener la estética retro sobria ya existente; evitar rediseños que rompan la identidad visual.
- Preservar compatibilidad desktop y móvil.
- Antes de cambios grandes en UI, revisar el HTML principal y los estilos segmentados para no duplicar reglas.
- No tocar `node_modules/` ni artefactos de resultados salvo que el trabajo lo requiera explícitamente.

## Qué mirar primero en un chat nuevo
1. `package.json`
2. `AGENTS.md`
3. `index.html`
4. `scripts/` (y su subcarpeta relevante: `config/`, `state/`, `core/` o `ui/`) afectados por la tarea
5. `playwright.config.js` y `tests/e2e/` si hay cambios de comportamiento

## Nota para futuros agentes
- Si un cambio visual o de lógica no se refleja, comprobar si falta regenerar `scripts/app.js`.
- Si la petición del usuario menciona "archivo único" o "single file", confirmar si quiere tocar solo `index.html` o mantener la estructura modular actual.
- `scripts/build-runtime.mjs` NO es un bundler real: compila con `tsc` y concatena los `.js` resultantes en el orden fijo de `sourceFiles`, quitando `import`/`export` por regex. Si se añade un módulo nuevo hay que insertarlo a mano en `sourceFiles` (después de sus dependencias) y actualizar las rutas relativas en los imports afectados. IMPORTANTE: `scripts/config/types.js` también está en `sourceFiles` (primero de todos) porque `types.ts` define const arrays reales en tiempo de ejecución (`CLASS_IDS`, `PRIMARY_SLOT_KEYS`, `SLOT_KEYS`, `PHASES`, `UPGRADE_TYPES`), no solo tipos/interfaces borrados en compilación — si se quita de `sourceFiles` la app rompe en runtime con "X is not defined".
- No añadir barrels (`export * from ...`) nuevos salvo `scripts/app-core.ts`, que existe solo para que los tests unitarios importen `.tsbuild/scripts/app-core.js` de una vez; `stripExports` en `build-runtime.mjs` solo limpia `export const`/`export function`, así que un `export *` adicional rompería el bundle final si no se ajusta ese script.
- `styles/board/board-overrides.css` contiene selectores DUPLICADOS A PROPÓSITO (`.enemy-meta`, `.enemy-meta-cell img`, `.enemy-meta-value`, `.top-slot,.bottom-slot`, `.board-frame`, `.enemy-card`, `.combat-dashboard`, `.combat-dashboard::before/::after`, `.enemy-portrait-frame`, `.enemy-portrait`) que sobrescriben en cascada a los definidos en `board-frame.css`/`enemy-card.css` por orden de importación (misma especificidad). Este fichero DEBE seguir importándose el último en `styles/board/board.css`; no fusionar estas reglas con sus bases ni reordenar los `@import`.
