# Estructura general del repositorio

- **`index.html`**: shell principal de la aplicación y markup de la UI.
- **`styles/`**: CSS organizado en subcarpetas temáticas. Ver
  [css.md](css.md) para el detalle completo.
- **`scripts/`**: TypeScript modular organizado en subcarpetas (`config/`,
  `state/`, `core/`, `ui/`) más `app-core.ts`/`app-main.ts` en la raíz. Ver
  [scripts.md](scripts.md).
- **`assets/`**: iconos e imágenes (todas en formato WebP). Ver
  [../assets.md](../assets.md).
- **`tests/e2e/`**: pruebas Playwright (end-to-end + regresión visual).
- **`tests/unit/`**: pruebas unitarias Node sobre la lógica pura de
  `scripts/core/` y `scripts/state/`.
- **`.github/workflows/ci.yml`**: pipeline de CI. Ver [../ci-cd.md](../ci-cd.md).
- **`dist/`** (generado, no versionado en el repo salvo por CI/build local):
  salida de `npm run build:dist`, lista para publicar.

## Flujo de trabajo general

- Si se editan archivos dentro de `scripts/` (`config/`, `state/`, `core/`,
  `ui/`, `app-core.ts`, `app-main.ts`), normalmente hay que regenerar
  `scripts/app.js` con `npm run build:runtime`.
- La app se sirve en tests desde `http://127.0.0.1:4173/index.html`
  (`tests/e2e/serve-static.mjs`). La raíz `/` no sirve el HTML principal.
- No asumir framework ni bundler de frontend: esto es HTML/CSS/TS modular con
  scripts propios de build.

## Qué mirar primero en un chat nuevo

1. `package.json`
2. `AGENTS.md`
3. [docs/index.md](../index.md)
4. `index.html`
5. `scripts/` (y su subcarpeta relevante) afectada por la tarea
6. `playwright.config.js` y `tests/e2e/` si hay cambios de comportamiento
