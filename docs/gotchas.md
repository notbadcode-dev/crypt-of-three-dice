# Gotchas — Trampas comunes de la IA

Situaciones donde el sistema parece estar funcionando correctamente (typecheck,
lint, compilación OK) pero falla en runtime o en E2E, generalmente invisible
para herramientas estáticas.

## 1. Cambios en `scripts/` — typecheck pasa, E2E falla

### Síntoma
- `npm run typecheck` ✓ OK
- `npm run lint` ✓ OK
- `npm run build:runtime` ✓ OK (compila sin errores)
- `npm run test:e2e` ✗ FALLA (errores de runtime o comportamiento roto)

### Causa
El `build-runtime.mjs` **no es un bundler real**; solo:
1. Compila con `tsc` a `.js`
2. Concatena en orden fijo (`sourceFiles`) eliminando `import`/`export` por regex

Si el regex de stripping falla, un `export` queda en el bundle, causando
duplicación de declaraciones. Si una dependencia falta en `sourceFiles`, se
ejecuta antes de estar definida.

### Remedio
**SIEMPRE correr E2E tras cambios en `scripts/`**, no solo typecheck/lint:
```bash
npm run build:runtime
npm run test:e2e
```

Si solo se ejecutan typecheck/lint, bugs invisibles pueden pasar a producción.

---

## 2. `scripts/config/types.js` es **obligatorio** en `sourceFiles`

### Síntoma
- El archivo compila y los tests pasan en desarrollo.
- En producción o tras limpiar y reconstruir, la app falla con:
  ```
  Uncaught ReferenceError: CLASS_IDS is not defined
  ```
  o similar para `PRIMARY_SLOT_KEYS`, `SLOT_KEYS`, `PHASES`, `UPGRADE_TYPES`.

### Causa
`scripts/config/types.ts` exporta **const arrays reales** en tiempo de
ejecución:
```typescript
export const CLASS_IDS = [/* valores */] as const;
export const PHASES = ['setup', 'action', ...] as const;
// etc
```

No son solo tipos TypeScript (que se borran en compilación): son valores.
Si `types.js` no va **al principio** de `sourceFiles`, otras dependencias
ejecutan antes de que `CLASS_IDS` esté definido.

### Remedio
En `scripts/build-runtime.mjs`, **nunca mover `types.js` de la primera
posición** en `sourceFiles`. Si se necesita agregar una nueva constante a
`types.ts`, verificar que sigue siendo la primera.

---

## 3. Orden de `sourceFiles` es crítico

### Síntoma
Cambios en la estructura de `scripts/` y la app falla en runtime con
`"X is not defined"` o `"Y is not a function"`.

### Regla
`sourceFiles` en `build-runtime.mjs` **define el orden de ejecución**.
Las dependencias siempre van **antes** de sus consumidores.

Orden típico:
1. `config/types.js` — constantes globales
2. `config/app-config.js` — configuración
3. `state/app-state.js` — estado
4. `state/persistence.js` — persistencia (usa app-state)
5. `core/*.js` — lógica pura (in order of dependencies)
6. `ui/*.js` — renderizado (usa core + state)
7. `app-main.js` — bootstrap final

### Remedio
Al añadir un módulo nuevo:
1. Identificar sus dependencias (qué importa)
2. Insertar en `sourceFiles` **después** de todas ellas
3. Correr E2E para verificar
4. Si falla con "X is not defined", revisar el orden

---

## 4. CSS: `board-overrides.css` debe importarse **último**

### Síntoma
El estilo se aplica pero luego se reversa sin motivo aparente.
Selectores en `board-overrides.css` no tienen efecto.

### Causa
`board-overrides.css` contiene **selectores duplicados a propósito**
con especificidad **idéntica** a otros archivos, diseñados para
reescribir (`::after`, pseudo-elementos, etc.).

Si se importa antes de otro archivo CSS que contiene el mismo selector,
la cascada de CSS hace que el otro gane.

### Remedio
En `styles/app.css` (o donde se centralicen las importaciones), asegurar
que `board-overrides.css` sea **la última línea de importación**.

Ver [architecture/css.md](architecture/css.md) para el layout completo de imports.

---

## 5. Cambios en CSS sin regenerar `app.js`

### Síntoma
Cambio visual no se ve al recargar.

### Causa
Si el cambio implica reescribir clases en `index.html` que dependen de
lógica en `scripts/`, la página vieja en caché sirve el HTML anterior.

### Remedio
- Limpiar caché del navegador o forzar reload (`Cmd+Shift+R` en macOS).
- Si el servidor está activo, a veces requiere recargar la pestaña.
- Si se agregó una clase nueva en `index.html` pero falta lógica en
  `scripts/`, regenerar con `npm run build:runtime` y recargar.

---

## 6. Narrowing de tipos en closures

### Síntoma
TypeScript compila OK pero en runtime el tipo es `undefined` dentro de
una `.map()` o `.every()`.

### Causa
El narrowing de accesos con punto (`obj.prop`) NO se propaga dentro de
closures pasadas a métodos de array. Ejemplo:
```typescript
if (card.status === 'active') {
  cards.map(c => c.status.toUpperCase()); // TS error: status podría ser undefined
}
```

### Remedio
Extraer la propiedad a una `const` antes del chequeo:
```typescript
if (card.status === 'active') {
  const status = card.status;
  cards.map(c => status.toUpperCase()); // OK
}
```

---

## 7. Cambios en `app-state.ts` vs `persistence.ts`

### Síntoma
Estado no persiste, o persiste cuando no debería.

### Guía rápida
- **`app-state.ts`**: estado global en memoria (`currentPhase`, `selectedCard`, etc.)
  - Se pierde al recargar (excepto los campos guardados en persistencia)
  - Modificar aquí para cambios que **sólo viven en sesión**

- **`persistence.ts`**: serialización/deserialización para localStorage
  - Llamar `persist()` cuando se quiere guardar a localStorage
  - Llamar `load()` al arranque para restaurar
  - **No** modificar `persist()` sin actualizar también `load()`

Ver comentarios en ambos archivos para detalles.

---

## 8. Tests E2E — proyectos (chromium, webkit, mobile)

### Síntoma
- Test pasa en `chromium` pero falla en `webkit` o `mobile`.
- Visual regression falla solo en CI (linux) pero pasa localmente (darwin).

### Causa
Diferencias entre navegadores:
- `webkit` tiene bugs de rendering distintos a Chromium
- `mobile` emula viewport pequeño, causando reflow
- CI en Linux genera snapshots `.png` distintas a macOS (anti-aliasing, subpixel rendering)

### Remedio
- Correr tests en todos los proyectos antes de push: `npm run test:e2e`
- Visual regression: generado localmente en macOS; CI solo corre las snapshots
  (no las regenera). Si hay diferencias legítimas, regenerar con
  `npm run test:e2e -- --update-snapshots` y commitear.

Ver [testing/e2e-projects-guide.md](testing/e2e-projects-guide.md) para detalles.

---

## 9. TypeScript 5.x — no actualizar a 7.x

### Síntoma
`npm install` falla o `npm run lint` rompe con errores de `typescript-eslint`.

### Causa
`typescript-eslint@8.66.0` solo soporta TS `>=4.8.4 <6.1.0`.
TS 7.x (desde 2026-08) está fuera de ese rango.

### Remedio
**Nunca actualizar `typescript` a 7.x** mientras `typescript-eslint` no
publique soporte. Mantener la última versión estable de la serie 5.x.

Más detalle en [technical-debt.md](technical-debt.md).

---

## 10. Cambios que parecen correctos pero rompen en git push

### Síntoma
- Local: `npm run lint && npm run typecheck && npm run test:e2e` ✓ OK
- GitHub CI: falla con error distinto en ubuntu que en macOS

### Cause Probables
1. **Rutas con case-sensitive**: macOS ignora, ubuntu es case-sensitive.
   - Solución: verificar con `find . -name "*.ts"` si hay inconsistencias
   - Usar siempre lowercase para nombres de archivo

2. **Snapshots de visual regression**: darwin genera `.png`, ubuntu no (CI
   no regenera).
   - Solución: visual regression es solo informativa en CI, no bloquea deploy

3. **Cambios en `scripts/` y regex de stripping**: a veces pasan localmente
   pero fallan al concatenar.
   - Solución: correr E2E en CI antes de deploy

---

## Checklist rápido antes de commit

- [ ] Si toqué `scripts/**/*.ts` → `npm run test:e2e` (no solo typecheck)
- [ ] Si toqué `styles/**/*.css` → verificar orden de importes
- [ ] Si modifiqué `app-state.ts` → verificar que `persistence.ts`
      también se actualiza si es necesario
- [ ] Si agregué un módulo en `scripts/` → verificado orden en `sourceFiles`
- [ ] Si toqué imports → `npm run lint:fix` (case-sensitive en CI)
- [ ] Si cambie viewport/responsive → `npm run test:e2e`

---

## Cuándo escalar: "Local pasa, CI falla"

1. Revisar logs de CI (GitHub Actions)
2. Buscar "ReferenceError", "is not defined", "case mismatch"
3. Si es visual regression, ignorar (no bloquea)
4. Si es E2E: revisar screenshot en artifact
5. Si es lint/typecheck: imposible, CI es stricter

Última opción: clonar el repo en una rama limpia y reproducir localmente.
