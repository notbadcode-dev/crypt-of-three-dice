# Scripts TypeScript y build runtime

## Organización de `scripts/`

- `scripts/config/`: configuración, constantes y tipos (`app-config.ts`,
  `types.ts`).
- `scripts/state/`: estado global y persistencia (`app-state.ts`,
  `persistence.ts`).
- `scripts/core/`: lógica de juego pura (`audio.ts`, `combat.ts`, `dice.ts`,
  `game-flow.ts`, `geometry.ts`).
- `scripts/ui/`: renderizado e interacciones de interfaz (`app-ui.ts`,
  `board-ui.ts`, `hud-ui.ts`, `modal-manager.ts`, `save-load-ui.ts`,
  `ui-feedback.ts`).
- `scripts/app-core.ts`: barrel de re-exports de `state/` y `core/`, usado
  solo por los tests unitarios (no entra en el bundle de producción).
- `scripts/app-main.ts`: arranque de la aplicación.
- `scripts/build-runtime.mjs`: compila con `tsc` y concatena los módulos
  anteriores en `scripts/app.js`.
- `scripts/build-dist.mjs`: genera `dist/` para producción (ver
  [build.md](build.md)).
- `scripts/optimize-images.mjs`: optimiza `assets/images/**/*.webp`.

Los únicos `.ts` planos legítimos en la raíz de `scripts/` son `app-core.ts`
y `app-main.ts`. Antes de editar cualquier otro archivo `scripts/*.ts`,
verificar con `file_search "scripts/**/*.ts"` en qué subcarpeta vive
realmente (`config/`, `core/`, `state/` o `ui/`).

## Mecánica de `build-runtime.mjs`

`build-runtime.mjs` **no es un bundler real**: compila con `tsc` y concatena
los `.js` resultantes en un orden fijo (`sourceFiles`), eliminando
`import`/`export` por regex. Reglas importantes:

- Si se añade un módulo nuevo hay que insertarlo a mano en `sourceFiles`
  (después de sus dependencias) y actualizar las rutas relativas en los
  imports afectados.
- `scripts/config/types.js` va primero en `sourceFiles` porque `types.ts`
  define const arrays reales en tiempo de ejecución (`CLASS_IDS`,
  `PRIMARY_SLOT_KEYS`, `SLOT_KEYS`, `PHASES`, `UPGRADE_TYPES`), no solo
  tipos/interfaces que se borran en compilación. Si se quita de
  `sourceFiles`, la app rompe en runtime con `"X is not defined"` — solo
  detectable ejecutando los tests e2e (Playwright), no con `typecheck` ni
  `eslint`.
- No añadir barrels (`export * from ...`) nuevos salvo `scripts/app-core.ts`:
  `stripExports` en `build-runtime.mjs` solo limpia `export const`/
  `export function`, así que un `export *` adicional rompería el bundle
  final si no se ajusta ese script.
- Tras cualquier cambio en `scripts/`, correr también los tests e2e y no
  solo `typecheck`/`eslint` — el paso de concatenación puede tener bugs
  invisibles para las herramientas de tipos/lint (operan sobre módulos ES
  con imports reales, no ven el bundle concatenado).

## Orden de `sourceFiles` — tabla de ejecución

Los archivos en `sourceFiles` dentro de `build-runtime.mjs` se concatenan
en este orden. **Cada módulo debe estar DESPUÉS de sus dependencias.**

| Orden | Archivo | Rol | Por qué aquí |
|---|---|---|---|
| 1 | `config/types.js` | Constantes globales (`CLASS_IDS`, `PHASES`, etc.) | Define valores de ejecución; lo usan todos |
| 2 | `config/app-config.js` | Configuración (constantes de UI, timings) | Usado por el resto |
| 3 | `state/app-state.js` | Estado global en memoria | Accedido por core + ui |
| 4 | `state/persistence.js` | Guardado/carga en localStorage | Depende de app-state |
| 5–9 | `core/*.js` (audio, combat, dice, game-flow, geometry) | Lógica pura de juego | Independientes entre sí, usados por ui |
| 10–15 | `ui/*.js` (app-ui, board-ui, hud-ui, modal-manager, save-load-ui, ui-feedback) | Renderizado e interacciones | Usan core + state |
| 16 | `app-main.js` | Bootstrap (inicializa listeners, llama al entry point) | Se ejecuta último |

**Regla de oro:** si al editar un módulo lo compilado falla en E2E pero
typecheck/lint pasan, probablemente falta verificar que está en la posición
correcta de `sourceFiles`.

## Notas de TypeScript

- `target`/`lib`: ES2024. `module`: `ES2022` con `moduleResolution: bundler`
  (se mantiene así, no `ESNext`/`Preserve`, porque `build-runtime.mjs`
  depende de que `tsc` emita `import`/`export` estándar para su regex de
  stripping).
- Flags estrictas activas: `isolatedModules`,
  `forceConsistentCasingInFileNames` (importante: macOS es
  case-insensitive, CI en `ubuntu-latest` es case-sensitive),
  `noUncheckedSideEffectImports`, `erasableSyntaxOnly`,
  `exactOptionalPropertyTypes`.
- El narrowing (estrechamiento) de accesos con punto (`obj.prop`) vía type
  guards NO se propaga dentro de closures pasadas a `.every()`/`.map()`.
  Extraer la propiedad a una `const` local antes del chequeo de narrowing
  para que se propague a la closure.
- APIs modernas usadas a propósito donde aplica: `Array.prototype.toSorted`
  (ES2023), `Object.hasOwn` (ES2022), `structuredClone` (deep clone nativo).

Ver también [../technical-debt.md](../technical-debt.md) para el motivo por el
que TypeScript está pinneado en la serie 5.x.
