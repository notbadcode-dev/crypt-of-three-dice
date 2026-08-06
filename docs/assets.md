# Assets de imagen (`assets/images/`)

- Todas las imágenes usadas en el juego están en **WebP** (no PNG). Formato
  de conversión: `cwebp -q 90 -alpha_q 100 -m 6` (lossy con alpha de alta
  calidad da mucho mejor ratio que lossless para estos sprites, sin
  pérdida visible).
- Los retratos de personaje (`class_warden`, `class_berserker`,
  `class_explorer`, `class_arcanist`) tenían fondo opaco y se les quitó el
  fondo con `rembg` (modelo `u2net`, no es dependencia del proyecto) antes
  de convertir a WebP.
- `scripts/optimize-images.mjs` (`npm run optimize:images`) analiza
  `assets/images/**/*.webp`.

## Al añadir una imagen nueva

1. Generar el WebP: `cwebp -q 90 -alpha_q 100 -m 6 origen.png -o destino.webp`.
2. Quitar el fondo con `rembg` si es un sprite/personaje.
3. Referenciar solo el `.webp` en HTML/CSS/TS — no dejar el `.png` sin usar
   en el repo.
4. Regenerar los snapshots de Playwright si la imagen aparece en capturas
   de regresión visual:
   `npx playwright test --project=chromium tests/e2e/visual-regression.spec.js --update-snapshots`
   (repetir para `webkit`/`mobile` si aplica).

## Referencias actuales notables

- `ASSET_PATHS.heroSprite` (`scripts/config/app-config.ts`) usa
  `hero-sprite-alpha.webp` (sin fondo), también para el HUD
  (`heroHudPortrait`).
- `ASSET_PATHS.enemySprite` y el `<img class="enemy-portrait">` en
  `index.html` usan `enemy_orco.webp` en ambos casos (reemplazó a los
  antiguos `enemy-portrait.webp`/`enemy-sprite.webp`, eliminados). Las
  clases CSS (`enemy-portrait`, `enemy-sprite`) se mantuvieron igual, solo
  cambió el `src`.
