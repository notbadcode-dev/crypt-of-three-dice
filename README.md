<p align="center">
  <img src="./assets/icons/crypt-icon.svg" width="120" alt="Umbral de los Tres Dados Logo" />
</p>

<h1 align="center">Umbral de los Tres Dados</h1>

<p align="center">
  Juego táctico retro en HTML, CSS y TypeScript modular: asigna tres dados, limpia la cripta y sobrevive a 12 niveles.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-22-brightgreen?logo=node.js" alt="Node Version" />
  <img src="https://img.shields.io/badge/npm-10-red?logo=npm&logoColor=red" alt="npm Version" />
  <img src="https://img.shields.io/badge/HTML-5-e34f26?logo=html5&logoColor=e34f26" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS-3-1572b6?logo=css3&logoColor=1572b6" alt="CSS3" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Playwright-1.62-2ead33?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iIzJFQUQzMyIgZD0iTTMuMiA1LjZjMi42IDEuMSA1IDEuMSA3LjYgMCAxLjIgMy44LjQgOC40LTIgMTAuNC0xLjggMS41LTQuMiAxLjItNS41LS41LTEuOC0yLjQtMS40LTYuNi0uMS05LjlaIi8%2BPHBhdGggZmlsbD0iI0Q2NTM0OCIgZD0iTTEzLjIgNS42YzIuNiAxLjEgNSAxLjEgNy42IDAgMS4yIDMuOC40IDguNC0yIDEwLjQtMS44IDEuNS00LjIgMS4yLTUuNS0uNS0xLjgtMi40LTEuNC02LjYtLjEtOS45WiIvPjxjaXJjbGUgY3g9IjYuMSIgY3k9IjEwLjgiIHI9IjEiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI4LjgiIGN5PSIxMC44IiByPSIxIiBmaWxsPSIjZmZmIi8%2BPGNpcmNsZSBjeD0iMTYuMSIgY3k9IjEwLjgiIHI9IjEiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxOC44IiBjeT0iMTAuOCIgcj0iMSIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik01LjYgMTMuOWMxLjIuOCAyLjUuOCAzLjggME0xNS42IDEzLjljMS4yLjggMi41LjggMy44IDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg%3D%3D&logoWidth=18" alt="Playwright" />
</p>

---

## Tabla De Contenidos

- [Tabla De Contenidos](#tabla-de-contenidos)
- [Descripción](#descripción)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Inicio Rápido](#inicio-rápido)
- [Scripts Principales](#scripts-principales)
- [Estructura](#estructura)
- [Documentación](#documentación)
- [Notas](#notas)

---

## Descripción

`Umbral de los Tres Dados` es un juego táctico retro de una sola página centrado en gestión de dados y posicionamiento en tablero, con:

- tablero táctico de 5 x 5 con muros, enemigos y línea de visión
- asignación de tres dados por turno a movimiento, ataque y defensa
- cuatro clases jugables: Guardián, Berserker, Exploradora y Arcanista
- progresión de 12 niveles con enemigos y recompensas variables
- guardado local con múltiples ranuras
- modo niño, interacción táctil y soporte responsive
- cobertura Playwright en escritorio, WebKit y móvil

---

## Stack

- HTML5 + CSS3 + TypeScript modular
- Runtime navegador generado en `scripts/app.js`
- Node.js para scripts de build, servidor local y tests
- Playwright para pruebas end-to-end
- Node Test Runner para pruebas unitarias aisladas
- Assets raster y SVG organizados en `assets/`

---

## Requisitos

- Node.js `LTS`
- npm
- Navegadores Playwright instalados para ejecutar la suite completa

---

## Inicio Rápido

```bash
npm install
npm run serve
```

App local: `http://127.0.0.1:4173/index.html`

Si necesitas instalar los navegadores de Playwright:

```bash
npm run test:install
```

---

## Scripts Principales

| Comando                   | Descripción                                      |
| ------------------------- | ------------------------------------------------ |
| `npm run serve`           | Levanta el servidor estático local               |
| `npm run build:runtime`   | Regenera `scripts/app.js` desde los módulos TS   |
| `npm test`                | Ejecuta toda la suite Playwright                 |
| `npm run test:e2e`        | Ejecuta las pruebas end-to-end                   |
| `npm run test:chromium`   | Ejecuta las pruebas solo en Chromium             |
| `npm run test:unit`       | Ejecuta las pruebas unitarias con Node           |
| `npm run test:headed`     | Ejecuta Playwright con navegador visible         |
| `npm run test:ui`         | Abre la UI de Playwright                         |
| `npm run test:report`     | Muestra el último reporte HTML de Playwright     |
| `npm run test:install`    | Instala navegadores requeridos por Playwright    |

---

## Estructura

```text
.
├── index.html                     # Shell principal de la aplicación
├── assets/
│   ├── icons/                     # Icono principal
│   └── images/                    # Sprites, retratos, fondos y UI raster
├── styles/
│   ├── app.css                    # Entrada CSS (barrel principal)
│   ├── global/                    # Tokens: colores, tipografía, sombras (+ barrel)
│   ├── base/                      # Reset, topbar y layout (+ barrel)
│   ├── board/                     # Tablero, HUD, carta enemigo/héroe/turno (+ barrel)
│   ├── sidebar/                   # Paneles laterales, dados y controles (+ barrel)
│   ├── modals/                    # Modales, overlays y toast (+ barrel)
│   └── responsive/                # Ajustes por breakpoint desktop/móvil (+ barrel)
├── scripts/
│   ├── config/                    # Constantes, niveles, configuración y tipos
│   ├── state/                     # Estado global y persistencia
│   ├── core/                      # Lógica de juego pura (dados, combate, audio...)
│   ├── ui/                        # Renderizado e interacciones de interfaz
│   ├── app-core.ts                # Barrel de re-exports para tests unitarios
│   ├── app-main.ts                # Arranque de la app
│   ├── app.js                     # Runtime generado para navegador
│   └── build-runtime.mjs          # Concatenador del runtime
└── tests/
    ├── e2e/                       # Playwright y servidor estático
    └── unit/                      # Tests unitarios de lógica aislada
```

---

## Documentación

- Reglas operativas del repo: [`AGENTS.md`](AGENTS.md)
- Entrada principal del juego: [`index.html`](index.html)
- Configuración Playwright: [`playwright.config.js`](playwright.config.js)
- Runtime generado: [`scripts/app.js`](scripts/app.js)
- Build del runtime: [`scripts/build-runtime.mjs`](scripts/build-runtime.mjs)
- Tests end-to-end: [`tests/e2e/e2e.spec.js`](tests/e2e/e2e.spec.js)
- Tests unitarios: [`tests/unit/app-core.test.mjs`](tests/unit/app-core.test.mjs)

---

## Notas

- Si cambias `scripts/config/app-config.ts`, `scripts/app-core.ts`, `scripts/ui/app-ui.ts` o `scripts/app-main.ts`, ejecuta `npm run build:runtime`.
- `scripts/app.js` está versionado porque es el archivo que consume el HTML principal.
- La partida se guarda en `localStorage`.
- Los resultados de tests, capturas locales, `node_modules/` y archivos de sistema no se versionan.
