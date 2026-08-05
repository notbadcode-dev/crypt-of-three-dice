// Barrel de re-exports: mantiene compatibilidad con los tests unitarios que
// importan `.tsbuild/scripts/app-core.js` directamente. Este archivo no forma
// parte del bundle de producción (ver scripts/build-runtime.mjs); la lógica
// real vive en los módulos re-exportados a continuación.
export * from "./core/audio.js";
export * from "./core/combat.js";
export * from "./core/dice.js";
export * from "./core/game-flow.js";
export * from "./core/geometry.js";
export * from "./state/app-state.js";
export * from "./state/persistence.js";

