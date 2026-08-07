# Build de producción

## `build:runtime` vs `build:dist`

- `npm run build:runtime`: compila TS (`tsc`) y concatena los módulos de
  `scripts/` en `scripts/app.js` (ver [scripts.md](scripts.md)). Es el único
  paso necesario para desarrollo/tests locales.
- `npm run build:dist`: ejecuta `build:runtime` y además genera `dist/`
  listo para publicar (usado por el job `deploy` de CI, ver
  [../ci-cd.md](../ci-cd.md)):
  - Bundlea y minifica todo `styles/app.css` (con su cadena de `@import`) en
    un único `dist/styles/app.<hash>.css` usando `lightningcss`
    (`bundle({filename, minify:true, targets})`, con `targets` calculados
    vía `browserslistToTargets(browserslist("defaults, not IE 11"))`).
    Motivo: los ~40 ficheros CSS con `@import` encadenados generaban un
    waterfall de peticiones render-blocking en producción; bundling + minify
    reduce el peso total significativamente en un solo request.
  - Reescribe `index.html` en `dist/index.html` para apuntar a
    `styles/app.<hash>.css` y `scripts/app.<hash>.js` (cache-busting).
  - `lightningcss` inlina el contenido de cada `@import` **sin** reescribir
    las `url()` relativas a la nueva ubicación del fichero combinado. Como
    todo `styles/<subcarpeta>/*.css` está un nivel más profundo que
    `styles/app.css`, sus `url()` usan `../../assets/...`; el bundle final
    vive en la misma posición relativa que `app.css`, así que
    `build-dist.mjs` reescribe a `../assets/...` tras el bundle
    (`.replaceAll("../../assets/", "../assets/")`) y valida que cada `url()`
    resultante resuelva a un fichero real en `assets/`.
  - `clean-css` se probó como alternativa a `lightningcss` pero **no**
    soporta CSS nesting nativo (crashea el tokenizer con selectores `&`) —
    descartado.

Verificación tras tocar `build-dist.mjs`: `npm run build:dist`, servir
`dist/` con un servidor estático simple y comprobar visualmente que la
página carga con estilos e imágenes correctas — un `url()` roto no da error
de build, solo imágenes rotas en el navegador.

## Optimización de imágenes

`npm run optimize:images` (`scripts/optimize-images.mjs`) analiza
`assets/images/**/*.webp`. Ver [../assets.md](../assets.md) para el flujo
completo de gestión de imágenes.
