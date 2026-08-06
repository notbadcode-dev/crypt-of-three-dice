# Documentación — Umbral de los Tres Dados

Índice central de la documentación del proyecto. Para el contexto mínimo de
arranque de un agente IA, ver [../AGENTS.md](../AGENTS.md); este índice
profundiza en cada área.

## Resumen del proyecto

- Juego táctico retro servido como una sola página HTML (`index.html`), con
  CSS y TypeScript modulares que se compilan/concatenan a artefactos únicos
  (`scripts/app.js`, y opcionalmente un CSS bundleado en `dist/`).
- Sin framework de frontend ni bundler tipo Vite/Webpack: TypeScript se
  compila con `tsc` y se concatena a mano con un script propio.
- Entrada principal: [../index.html](../index.html).

## Índice de documentos

| Documento | Contenido |
|---|---|
| [arquitectura/estructura.md](arquitectura/estructura.md) | Layout general del repo (carpetas de alto nivel) |
| [arquitectura/scripts.md](arquitectura/scripts.md) | Organización de `scripts/` y mecánica de `build-runtime.mjs` |
| [arquitectura/css.md](arquitectura/css.md) | Barrels CSS, theme de colores, tokens de movimiento, tooling |
| [arquitectura/build.md](arquitectura/build.md) | Build de producción (`build:dist`), bundling CSS, optimización de imágenes |
| [testing/e2e.md](testing/e2e.md) | Suite Playwright: proyectos, inventario de tests, gotchas conocidos |
| [testing/unit.md](testing/unit.md) | Tests unitarios (Node test runner), cobertura, patrones |
| [ci-cd.md](ci-cd.md) | Jobs de GitHub Actions |
| [assets.md](assets.md) | Flujo de trabajo de imágenes (WebP) |
| [convenciones.md](convenciones.md) | Convenciones de estilo/UX y de flujo de trabajo |
| [deuda-tecnica.md](deuda-tecnica.md) | Deuda técnica conocida y pendiente |

## Comandos útiles (`npm run ...`)

| Comando | Qué hace |
|---|---|
| `build:runtime` | Compila TS (`tsc`) y reconstruye `scripts/app.js` |
| `build:dist` | `build:runtime` + genera `dist/` listo para producción (HTML/CSS/JS con hash, CSS bundleado y minificado) |
| `typecheck` | Solo comprueba tipos (`tsc --noEmit`), sin generar `scripts/app.js` |
| `optimize:images` | Optimiza imágenes en `assets/images/**/*.webp` |
| `lint` | ESLint + Stylelint encadenados (`eslint . && npm run lint:css`) |
| `lint:fix` | ESLint con `--fix` |
| `lint:css` / `lint:css:fix` | Stylelint sobre `styles/**/*.css` |
| `test` / `test:e2e` | Suite Playwright completa (3 proyectos) |
| `test:chromium` | Playwright solo en Chromium |
| `test:headed` / `test:ui` | Playwright en modo visible / UI interactiva |
| `test:unit` | Tests unitarios (Node test runner) sobre `tests/unit/*.test.mjs` |
| `serve` | Servidor estático local (`tests/e2e/serve-static.mjs`) |

Ver [arquitectura/scripts.md](arquitectura/scripts.md) y
[testing/e2e.md](testing/e2e.md) para detalles de cada uno.
