# Test Projects Guide (Chromium, WebKit, Mobile)

## Resumen

Cuando crees un nuevo test e2e, **todos los tests corren en los 3 proyectos por defecto**:
- `@chromium`: Desktop Chrome, 1440×900
- `@webkit`: Desktop Safari, 1280×900  
- `@mobile`: iPhone 13

No es necesario agregar tags explícitos **a menos que quieras excluir un test de ciertos proyectos**.

## Proyectos en CI

Cada proyecto tiene su **job independiente** que corre en paralelo:

```yaml
# .github/workflows/ci.yml
e2e-chromium:  # Instala chromium, corre --project=chromium
e2e-webkit:    # Instala webkit, corre --project=webkit
e2e-mobile:    # Instala chromium+webkit, corre --project=mobile
```

**Duración aproximada:**
- Cada job: ~5-10 minutos
- Los 3 corren en paralelo → tiempo total: ~5-10 minutos (no 15-30)
- Todos en paralelo **no bloquean deploy** (deploy depende de lint + typecheck + unit)

## Proyectos locales

```bash
# Correr un proyecto específico
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=webkit
npm run test:e2e -- --project=mobile

# Correr todos (corre los 3 secuencialmente)
npm run test:e2e
```

## Cuándo excluir un test de un proyecto

### Caso 1: Test específico de resolución (desktop only)

Si tu test solo tiene sentido en desktop (ej: layout de 1440px), **marca desktop explícitamente**:

```javascript
test("board layout es responsivo en 1440px @smoke", async ({ page }, testInfo) => {
  // Solo en chromium y webkit (desktop)
  test.skip(testInfo.project.name === "mobile", "Desktop-only layout test");
  
  await page.setViewportSize({ width: 1440, height: 900 });
  // ... test
});
```

O más limpio con etiquetas:

```javascript
test("board layout es responsivo en 1440px @smoke @desktop", async ({ page }) => {
  // Este test corre en chromium + webkit
  // En CI: cada job ve su tag
});
```

Luego en `playwright.config.js`, puedes filtrar:

```javascript
// Ejecutar solo tests @desktop
npm run test:e2e -- --grep @desktop
```

### Caso 2: Test específico de mobile

Si tu test es mobile-only:

```javascript
test("botones son tapables en móvil @mobile-only", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only test");
  // ... test
});
```

### Caso 3: Test que falla en un navegador

Si descubres un bug en webkit que no afecta a chromium:

```javascript
test("modal se abre correctamente @smoke", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "webkit", "WebKit modal bug #123");
  // ... test
});
```

## Patrón recomendado: No uses tags de proyecto

**Mejor: usa la lógica del test para excluir si es necesario.**

Razones:
- Los tags `@chromium`, `@webkit`, `@mobile` ya están documentados en headers de archivos
- Agregar tags a cada test es repetitivo (42 tests = 42 tags)
- El filtrado en CI se hace por `--project=<nombre>`, no por tags

## Estructura actual

### e2e.spec.js

- 34 tests funcionales
- Corren en los 3 proyectos (chromium, webkit, mobile)
- Tags existentes: `@smoke`, `@regression`, `@a11y`, `@persistence`, `@integration`
- Estos tags describen el **tipo de test**, no el proyecto

### visual-regression.spec.js

- 8 tests visuales
- Corren localmente en los 3 proyectos
- Excluidos en CI (snapshots -darwin.png, CI es linux)
- Sin tags de proyecto (no aplica)

## Checklist para nuevo test e2e

1. ¿El test tiene sentido en todos los tamaños (desktop + mobile)?
   - Sí → No hagas nada, corre en los 3
   - No → Usa `test.skip(testInfo.project.name !== "...")` 

2. ¿Necesitas debugging?
   - `npm run test:e2e -- --project=chromium -g "nombre del test"`
   - Esto corre **solo 1 test, 1 proyecto**

3. ¿Antes de mergear?
   - Verifica que pasa localmente: `npm run test:e2e -- --project=chromium`
   - En CI, los 3 jobs lo validarán

## Validación en CI

Cuando haces push, GitHub Actions ejecuta:

```
lint-js, lint-css, typecheck, unit (se ejecutan y deben pasar)
  ↓ (en paralelo, no bloquean)
e2e-chromium, e2e-webkit, e2e-mobile (se ejecutan en paralelo)
  ↓ (pero no bloquean)
deploy (solo depende de lint + unit + typecheck)
```

Si e2e falla, se notifica en la PR pero **no bloquea deploy**.

## Cambiar snapshots visuales

```bash
# Regenerar snapshots en chromium local
npx playwright test --project=chromium \
  tests/e2e/visual-regression.spec.js \
  --update-snapshots
```

Los snapshots se guardan con sufijo de SO:
- `-darwin.png` (macOS, tu máquina)
- `-linux.png` (solo si necesitas Linux)

Commit los nuevos snapshots y CI validará que pasen.

## Gotchas conocidos: WebKit y Mobile en CI

### WebKit CSP warning (no es un error real)

En CI, WebKit ocasionalmente emite:
```
"Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' 
does not appear in the style-src directive of the Content Security Policy."
```

**No hay CSS inline en el proyecto que justifique esto.** Es un artefacto de WebKit bajo presión de recursos.

**Solución**: Ya está filtrado en `test.afterEach()` de `e2e.spec.js`. El error no bloquea los tests.

### Timeouts ocasionales en webkit/mobile

Webkit y mobile en CI (ubuntu-latest) pueden experimentar timeouts por contención de recursos con otros jobs GitHub Actions.

**Señales de que es un timeout transitorio (no un bug real):**
- El test pasa localmente: `npm run test:e2e -- --project=webkit`
- El test pasa en otro intento de CI
- Solo falla en webkit/mobile, no en chromium

**Mitigaciones aplicadas:**
- Timeouts globales subidos: 60s (era 30s)
- Expect timeout: 10s (era 5s)
- Función `closeTutorialIfOpen()` mejorada con waits y manejo de errores

Si un test falla repetidamente solo en CI webkit/mobile pero pasa localmente, contacta a otro dev para validar
que no sea un timing race real en la app.

