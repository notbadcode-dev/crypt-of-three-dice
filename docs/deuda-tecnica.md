# Deuda técnica conocida

## TypeScript pinneado en la serie 5.x

- `typescript` está fijado a una versión de la serie 5.x (no en `latest`,
  que desde 2026-08 es la 7.0.2 — reescritura nativa en Go, "tsgo", instala
  un binario nativo por plataforma tipo `@typescript/typescript-darwin-arm64`).
- Motivo: `typescript-eslint@8.66.0` (usado en `eslint.config.mjs` para el
  linting type-aware de `scripts/**/*.ts`) declara
  `peerDependencies.typescript: ">=4.8.4 <6.1.0"` — TS 7 queda fuera de ese
  rango soportado y rompería el lint.
- Se evaluó aislar TS 7 solo para el build vía `overrides` de npm (nested
  `node_modules/typescript-eslint/node_modules/typescript@5.9.3`) —
  técnicamente viable pero descartado por riesgo: dos compiladores TS
  distintos podrían divergir en qué errores detectan, para un beneficio no
  demostrado.
- **Acción pendiente**: revisar de nuevo cuando `typescript-eslint` publique
  soporte oficial para la serie 7.x. Mientras tanto, mantener `typescript`
  en la última versión estable de la 5.x compatible con ese rango.
