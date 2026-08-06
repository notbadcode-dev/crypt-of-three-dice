# Contexto del proyecto

## Resumen
- Proyecto: `Umbral de los Tres Dados`
- Tipo: juego táctico retro en una sola página HTML con assets, estilos y scripts separados.
- Entrada principal: `index.html`
- Objetivo actual del repo: mantener la experiencia jugable y su infraestructura de tests Playwright.

## Documentación

Toda la información detallada del proyecto (arquitectura de `scripts/` y
`styles/`, build de producción, tests, CI/CD, assets, convenciones y deuda
técnica) vive organizada en [docs/](docs/index.md). Empezar siempre por
[docs/index.md](docs/index.md).

## Qué mirar primero en un chat nuevo
1. `package.json`
2. `AGENTS.md` (este archivo)
3. [docs/index.md](docs/index.md)
4. `index.html`
5. `scripts/` (y su subcarpeta relevante: `config/`, `state/`, `core/` o `ui/`) afectados por la tarea
6. `playwright.config.js` y `tests/e2e/` si hay cambios de comportamiento

## Reglas críticas para agentes

- Si se editan archivos dentro de `scripts/`, normalmente hay que
  regenerar `scripts/app.js` con `npm run build:runtime`. Detalle completo
  de la mecánica de concatenación (orden de `sourceFiles`, el caso especial
  de `types.js`, por qué no añadir barrels nuevos) en
  [docs/arquitectura/scripts.md](docs/arquitectura/scripts.md).
- Antes de editar cualquier `scripts/*.ts` que no sea `app-core.ts` o
  `app-main.ts`, verificar con `file_search` en qué subcarpeta vive
  realmente (`config/`, `core/`, `state/` o `ui/`).
- `styles/board/board-overrides.css` contiene selectores duplicados **a
  propósito** y debe seguir importándose el último — ver
  [docs/arquitectura/css.md](docs/arquitectura/css.md).
- Si la petición del usuario menciona "archivo único" o "single file",
  confirmar si quiere tocar solo `index.html` o mantener la estructura
  modular actual.
- No tocar `node_modules/` ni artefactos de resultados salvo que el trabajo
  lo requiera explícitamente.

## Convenciones

Mantener la estética retro sobria ya existente y la compatibilidad
desktop/móvil. Detalle completo en
[docs/convenciones.md](docs/convenciones.md).

## Deuda técnica conocida

TypeScript pinneado en la serie 5.x (no en 7.x/"latest") por
incompatibilidad de `typescript-eslint` con TS 7. Detalle en
[docs/deuda-tecnica.md](docs/deuda-tecnica.md).
