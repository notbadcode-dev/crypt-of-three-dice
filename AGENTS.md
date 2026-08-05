# Contexto del proyecto

## Resumen
- Proyecto: `Umbral de los Tres Dados`
- Tipo: juego táctico retro en una sola página HTML con assets, estilos y scripts separados.
- Entrada principal: `umbral-de-los-tres-dados.html`
- Objetivo actual del repo: mantener la experiencia jugable y su infraestructura de tests Playwright.

## Estructura
- `umbral-de-los-tres-dados.html`: shell principal de la aplicación y markup de la UI.
- `styles/`: CSS dividido por áreas (`base`, `board`, `sidebar`, `modals`, `responsive`, `app`).
- `scripts/app-config.js`: configuración y constantes.
- `scripts/app-core.js`: lógica principal del juego.
- `scripts/app-ui.js`: renderizado e interacciones de interfaz.
- `scripts/app-main.js`: arranque de la aplicación.
- `scripts/build-runtime.mjs`: concatena los módulos anteriores en `scripts/app.js`.
- `assets/`: iconos e imágenes.
- `tests/e2e/`: pruebas Playwright.
- `tests/unit/`: pruebas unitarias Node si existen para la lógica aislada.

## Flujo de trabajo
- Si se editan `scripts/app-config.js`, `scripts/app-core.js`, `scripts/app-ui.js` o `scripts/app-main.js`, normalmente hay que regenerar `scripts/app.js` con `npm run build:runtime`.
- La app se sirve en tests desde `http://127.0.0.1:4173/umbral-de-los-tres-dados.html`.
- No asumir framework: esto es HTML/CSS/JS modular sin bundler de frontend.

## Comandos útiles
- `npm run build:runtime`: reconstruye `scripts/app.js`.
- `npm test` o `npm run test:e2e`: ejecuta Playwright.
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
3. `umbral-de-los-tres-dados.html`
4. `scripts/` afectados por la tarea
5. `playwright.config.js` y `tests/e2e/` si hay cambios de comportamiento

## Nota para futuros agentes
- Si un cambio visual o de lógica no se refleja, comprobar si falta regenerar `scripts/app.js`.
- Si la petición del usuario menciona "archivo único" o "single file", confirmar si quiere tocar solo `umbral-de-los-tres-dados.html` o mantener la estructura modular actual.
