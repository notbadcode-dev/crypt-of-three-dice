# CI/CD (GitHub Actions)

- Archivo único: `.github/workflows/ci.yml`. Repo:
  `notbadcode-dev/crypt-of-three-dice`, rama por defecto `master`.
- 6 jobs independientes, corren en paralelo, cada uno hace su propio
  `npm ci`:
  - **`lint-js`**: `npx eslint .`
  - **`lint-css`**: `npm run lint:css`
  - **`typecheck`**: `npm run typecheck` (`tsc --noEmit`)
  - **`unit`**: `npx tsc --project tsconfig.json` (con emisión, genera
    `.tsbuild/`) → `npm run test:unit`. Sube `tests/unit/results` siempre
    como artefacto `unit-test-results`. Importante: el paso de typecheck de
    este job usa `tsc` **con emisión** (no `npm run typecheck`, que usa
    `--noEmit`) porque `test:unit` necesita `.tsbuild/` generado; si se usa
    `--noEmit` aquí, `test:unit` falla en CI con `ERR_MODULE_NOT_FOUND`
    aunque pase en local (donde `.tsbuild/` ya existe de una ejecución
    previa).
  - **`e2e`**: instala navegadores Playwright (`chromium`, `webkit`; el
    proyecto "mobile" usa el device iPhone 13, que internamente es webkit)
    → `npm run test:e2e`. Sube `tests/e2e/results/html-report` como
    artefacto `playwright-report` solo si falla. Ver
    [testing/e2e.md](testing/e2e.md) para el detalle de `testIgnore` en CI.
  - **`deploy`** (solo push a `master`): `needs: [lint-js, lint-css,
    typecheck, unit]` — `e2e` deliberadamente **no** está en `needs` de
    `deploy`: los tests e2e siguen corriendo como check normal en cada
    push/PR, pero no bloquean ni retrasan la publicación en GitHub Pages.
    Ejecuta `npm run build:dist` (ver
    [arquitectura/build.md](arquitectura/build.md)) y publica `dist/` con
    `actions/upload-pages-artifact` + `actions/deploy-pages`. Requiere
    GitHub Pages habilitado con origen "GitHub Actions" en Settings > Pages
    del repo (ajuste manual, no automatizable desde el código).

## Notas

- Localmente `npm run lint` sigue encadenando `eslint . && npm run lint:css`
  con `&&` (conveniente para uso manual), pero CI usa los jobs separados
  `lint-js`/`lint-css` en paralelo en vez de ese script compuesto.
- Si se toca `package.json`, comprobar que el script `lint` siga
  encadenando ambos linters — hubo un caso real donde solo quedó `eslint .`
  sin stylelint, pese a que el nombre del job de CI sugería que cubría
  ambos.
