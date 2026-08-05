<p align="center">
  <img src="./assets/icons/crypt-icon.svg" width="120" alt="Umbral de los Tres Dados Logo" />
</p>

<h1 align="center">Umbral de los Tres Dados</h1>

<p align="center">
  Juego táctico retro en HTML, CSS y JavaScript modular: asigna tres dados, limpia la cripta y sobrevive a 12 niveles.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-e34f26?logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572b6?logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-f7df1e?logo=javascript&logoColor=111111" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-LTS-5fa04e?logo=node.js&logoColor=white" alt="Node.js LTS" />
  <img src="https://img.shields.io/badge/npm-required-cb3837?logo=npm&logoColor=white" alt="npm" />
  <img src="https://img.shields.io/badge/Playwright-1.54-2ead33?logo=playwright&logoColor=white" alt="Playwright" />
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

- HTML5 + CSS3 + JavaScript modular
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

App local: `http://127.0.0.1:4173/umbral-de-los-tres-dados.html`

Si necesitas instalar los navegadores de Playwright:

```bash
npm run test:install
```

---

## Scripts Principales

| Comando                   | Descripción                                      |
| ------------------------- | ------------------------------------------------ |
| `npm run serve`           | Levanta el servidor estático local               |
| `npm run build:runtime`   | Regenera `scripts/app.js` desde los módulos JS   |
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
├── umbral-de-los-tres-dados.html  # Shell principal de la aplicación
├── assets/
│   ├── icons/                     # Icono principal
│   └── images/                    # Sprites, retratos, fondos y UI raster
├── styles/
│   ├── app.css                    # Entrada CSS
│   ├── base.css                   # Base visual y tokens
│   ├── board.css                  # Tablero y carta principal
│   ├── sidebar.css                # Paneles laterales y controles
│   ├── modals.css                 # Modales y overlays
│   └── responsive.css             # Ajustes desktop/móvil
├── scripts/
│   ├── app-config.js              # Constantes, niveles y configuración
│   ├── app-core.js                # Estado y reglas del juego
│   ├── app-ui.js                  # Renderizado e interacciones
│   ├── app-main.js                # Arranque de la app
│   ├── app.js                     # Runtime generado para navegador
│   └── build-runtime.mjs          # Concatenador del runtime
└── tests/
    ├── e2e/                       # Playwright y servidor estático
    └── unit/                      # Tests unitarios de lógica aislada
```

---

## Documentación

- Reglas operativas del repo: [`AGENTS.md`](AGENTS.md)
- Entrada principal del juego: [`umbral-de-los-tres-dados.html`](umbral-de-los-tres-dados.html)
- Configuración Playwright: [`playwright.config.js`](playwright.config.js)
- Runtime generado: [`scripts/app.js`](scripts/app.js)
- Build del runtime: [`scripts/build-runtime.mjs`](scripts/build-runtime.mjs)
- Tests end-to-end: [`tests/e2e/e2e.spec.js`](tests/e2e/e2e.spec.js)
- Tests unitarios: [`tests/unit/app-core.test.mjs`](tests/unit/app-core.test.mjs)

---

## Notas

- Si cambias `scripts/app-config.js`, `scripts/app-core.js`, `scripts/app-ui.js` o `scripts/app-main.js`, ejecuta `npm run build:runtime`.
- `scripts/app.js` está versionado porque es el archivo que consume el HTML principal.
- La partida se guarda en `localStorage`.
- Los resultados de tests, capturas locales, `node_modules/` y archivos de sistema no se versionan.
