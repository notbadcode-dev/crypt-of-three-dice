# Umbral de los Tres Dados

Juego táctico retro de una sola página en el que asignas tres dados de energía para mover, atacar y defenderte dentro de una cripta de 12 niveles.

El proyecto está construido con HTML, CSS y JavaScript modular, sin framework de frontend ni bundler. La versión que carga la página se genera concatenando los módulos de `scripts/` en `scripts/app.js`.

## Características

- Tablero táctico de 5 x 5 con movimiento ortogonal y diagonal.
- Asignación de dados por turno para potenciar movimiento, ataque y defensa.
- Cuatro clases jugables: Guardián, Berserker, Exploradora y Arcanista.
- Progresión de 12 niveles con enemigos, muros y objetivos variables.
- Guardado local con múltiples ranuras.
- Modo niño, controles táctiles y soporte responsive.
- Tests Playwright para validar la experiencia en escritorio y móvil.

## Estructura del proyecto

```text
.
├── umbral-de-los-tres-dados.html  # Entrada principal del juego
├── assets/                        # Iconos, sprites e imágenes
├── styles/                        # CSS segmentado por área
├── scripts/
│   ├── app-config.js              # Constantes y configuración
│   ├── app-core.js                # Lógica principal del juego
│   ├── app-ui.js                  # Renderizado e interacciones
│   ├── app-main.js                # Arranque
│   ├── app.js                     # Runtime generado para navegador
│   └── build-runtime.mjs          # Generador del runtime
└── tests/
    ├── e2e/                       # Pruebas Playwright
    └── unit/                      # Pruebas unitarias Node
```

## Requisitos

- Node.js LTS.
- npm.

## Instalación

```bash
npm install
```

Si es la primera vez que ejecutas Playwright en la máquina:

```bash
npm run test:install
```

## Uso local

Arranca el servidor estático:

```bash
npm run serve
```

Abre:

```text
http://127.0.0.1:4173/umbral-de-los-tres-dados.html
```

También puedes abrir directamente `umbral-de-los-tres-dados.html` en el navegador, aunque para pruebas automatizadas se usa siempre el servidor local.

## Desarrollo

Si editas cualquiera de estos módulos:

- `scripts/app-config.js`
- `scripts/app-core.js`
- `scripts/app-ui.js`
- `scripts/app-main.js`

regenera el runtime:

```bash
npm run build:runtime
```

## Tests

Ejecutar toda la suite Playwright:

```bash
npm test
```

Ejecutar solo Chromium:

```bash
npm run test:chromium
```

Ejecutar tests unitarios:

```bash
npm run test:unit
```

## Controles básicos

1. Selecciona una clase.
2. Lanza los tres dados de energía.
3. Arrastra cada dado a movimiento, ataque o defensa.
4. Actúa en el tablero: muévete, ataca enemigos en alcance y termina el turno.
5. Supera los 12 niveles para completar la cripta.

## Notas

- La partida se guarda en `localStorage`.
- Los resultados de tests y capturas locales no se versionan.
- `scripts/app.js` se mantiene versionado porque es el archivo que consume la página HTML.
