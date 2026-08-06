# Tests end-to-end (Playwright)

## Configuración

- `playwright.config.js`: `testDir` es `./tests/e2e`. 3 proyectos:
  - `chromium` (Desktop Chrome, 1440×900)
  - `webkit` (Desktop Safari, 1280×900)
  - `mobile` (device iPhone 13, motor webkit)
- `webServer` corre `node tests/e2e/serve-static.mjs` en el puerto 4173, con
  `reuseExistingServer: !process.env.CI`.
- Sin `workers:` explícito → Playwright usa su default: `1` worker en CI
  (`process.env.CI` definido), ~mitad de CPUs en local.
- `testIgnore: process.env.CI ? "**/visual-regression.spec.js" : undefined`:
  los snapshots de `tests/e2e/visual-regression.spec.js-snapshots/` se
  generaron en macOS (sufijo `-darwin.png`), pero CI corre en
  `ubuntu-latest` (necesitaría `-linux.png`), así que esa suite se excluye
  solo en CI en vez de mantener baselines para Linux. En local
  (`test:e2e`, `test:chromium`) la suite visual sigue corriendo normalmente.

## Inventario de tests

2 specs × 3 proyectos:

- `tests/e2e/e2e.spec.js`: 34 tests (tags `@smoke`, `@regression`,
  `@integration`, `@persistence`, `@a11y`).
- `tests/e2e/visual-regression.spec.js`: 8 tests (`toHaveScreenshot`).

Total: 126 tests. Verificar con `npx playwright test --list` si se
sospecha que faltan tests (el README puede quedar desactualizado en su
tabla de recuento).

## Gotchas conocidos

### Sincronizar breakpoints CSS con los tests

El helper `expectNoInternalScroll` en `e2e.spec.js` acepta una opción
`{ allowVerticalScroll }`. El test "las vistas principales no introducen
scroll interno en tamaños de escritorio e iPad" la activa cuando
`viewport.width <= 1100`, porque `styles/responsive/tablet.css` añade a
propósito `overflow-y: auto` en `#startModal .modal` en ese mismo
breakpoint (red de seguridad para que el contenido nunca se solape cuando
el alto disponible es escaso). **Si cambia ese breakpoint en CSS, hay que
actualizar también el `<= 1100` de este test.**

Ese mismo test cubre los viewports 1366×768, 1180×820, 1252×1756 y
1024×768, pero no cubre anchos reales de iPad portrait (820, 1024) ni
landscape de iPhone (~852×393) — si se toca de nuevo el modal inicial,
verificar manualmente esos tamaños también.

### `transform` y el test de estabilidad de layout

Ver [../arquitectura/css.md](../arquitectura/css.md#gotcha-transform-rompe-el-test-de-estabilidad-de-layout).

### Falso positivo de consola en WebKit

En WebKit (incluso en ejecución aislada) puede aparecer de forma no
determinista un único mensaje de consola: *"Refused to apply a stylesheet
because its hash, its nonce, or 'unsafe-inline' does not appear in the
style-src directive of the Content Security Policy."*, que hace fallar el
`afterEach` de `e2e.spec.js` (`expect(pageErrors...).toEqual([])`). No hay
`<style>` ni `style="..."` inline en `scripts/`/`styles/` que lo justifique;
Chromium con el mismo flujo nunca lo muestra. Se considera un artefacto de
WebKit bajo presión de recursos/paralelismo local, no un bug de la app. Solo
investigar si reaparece de forma reproducible con 1 worker y sin otros
proyectos corriendo a la vez.

### Flakiness por paralelismo local

Correr los 3 proyectos a la vez en local (`npm run test:e2e`) puede producir
fallos flaky por contención de recursos (CPU/red contra un único servidor
de desarrollo compartido) que **no** son bugs reales. Antes de dar por real
un fallo visto en una tanda grande local, reproducirlo aislado con
`--project=<nombre>` y, si sigue fallando, con `-g "<nombre del test>"` (1
worker). Este problema es solo local: en CI el default de Playwright ya es
`workers: 1`.

## Regenerar snapshots visuales

```
npx playwright test --project=<chromium|webkit|mobile> tests/e2e/visual-regression.spec.js --update-snapshots
```

Necesario tras cambios de imágenes, colores/theme, o layout que afecten a
capturas existentes. El test de regresión visual desactiva automáticamente
todas las animaciones/transiciones CSS antes de capturar, así que
transiciones/animaciones nuevas no deberían romper snapshots por sí solas.
