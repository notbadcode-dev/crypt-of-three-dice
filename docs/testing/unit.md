# Tests unitarios

- `npm run test:unit` ejecuta los tests unitarios (Node test runner) sobre
  `tests/unit/*.test.mjs`, importando `.tsbuild/scripts/app-core.js` (hay
  que generar `.tsbuild/` antes con `npx tsc --project tsconfig.json`, con
  emisión — `npm run typecheck` no genera nada porque usa `--noEmit`).
- Suite actual: `tests/unit/app-core.test.mjs`, estilo/convención: descripciones
  en español, `assert.equal`/`deepEqual`/`match`,
  `core.setTestState(makeState({...}))`.
- Cobertura (medida con `node --test --experimental-test-coverage`):
  ~91% líneas/ramas, ~95% funciones sobre `.tsbuild/scripts/**`. Excepción
  deliberada: `audio.js` con cobertura baja porque depende de
  `window.AudioContext` sin mockear; en los tests `core.app.sound = false`
  hace que `beep()` sea no-op siempre, así que cubrirlo de verdad exigiría
  mockear la Web Audio API sin aportar valor real a la lógica de juego.

## Gotchas al escribir tests nuevos

- **Orden `setTestState`/`registerUi`**: `setTestState` internamente llama
  a `setStartModalHidden(true)`, `setHelpModalHidden(true)`,
  `setUpgradeModalHidden(true)`, `setEndModalHidden(true)` y `render()`. Si
  se registra un hook con `core.registerUi(...)` **antes** de llamar a
  `core.setTestState(...)`, esas llamadas de reseteo quedan capturadas como
  ruido en el array de aserciones. Siempre llamar `setTestState(...)`
  primero y `registerUi(...)` después, justo antes de invocar la función
  bajo test.
- **Timers falsos nativos**: `node:test` soporta timers falsos desde Node
  20: `t.mock.timers.enable({ apis: ["setTimeout"] })` +
  `t.mock.timers.tick(ms)`, útil para testear flujos encadenados con
  `setTimeout` (ver `TURN_TIMING` abajo) sin dejar timers reales colgando.
  Se restauran solos al acabar el test.
- `beforeEach` debe resetear también `core.app.currentSaveSlot = null` y
  `core.app.selectedClass = "warden"` si el test muta esos campos
  (`start()`, `chooseUpgrade()`), para no filtrar estado a tests
  posteriores.

## Constantes útiles para tests

- `levels.length` = 12 (nivel final, útil para testear la victoria en
  `levelComplete`/`finish`).
- `TURN_TIMING` (ms): `monsterMoveDelay: 450`, `monsterAttackDelay: 500`,
  `nextTurnDelay: 420`, `levelCompleteDelay: 260`.
- `stats` de cada nivel en `app-config.ts` es
  `[speed, attackStat, attackCost, range]` — el nombre de variable
  `defenseCost` en `combat.ts:attack()` es engañoso: en realidad es el
  coste en puntos de ATAQUE requerido para golpear (`stats[2]`), no de
  defensa.
