# Umbral de los Tres Dados — Constitución del Proyecto

## Identidad del Proyecto
- **Nombre**: Umbral de los Tres Dados
- **Tipo**: Juego táctico retro servido como página HTML única
- **Arquitectura**: CSS y TypeScript modulares compilados a artefactos únicos (`scripts/app.js`)
- **Entrada principal**: `index.html`
- **Stack**: HTML/CSS/TypeScript vanilla (sin framework frontend ni bundler Vite/Webpack)

---

## Principios de Desarrollo (7 pilares)

### I. Identidad Visual Retro y Consistencia
**Objetivo**: Mantener la identidad visual retro sobria única del proyecto.

- Preservar estética retro ya existente; evitar rediseños que rompan la identidad visual.
- Mantener compatibilidad desktop y móvil.
- Antes de cambios grandes en UI: revisar `index.html` y estilos segmentados en `styles/` para evitar duplicación.

**Referencia**: [Convenciones del proyecto](../../docs/convenciones.md#diseño-y-ux)

---

### II. Arquitectura Modular sin Framework
**Objetivo**: Mantener una arquitectura modular, predecible y fácil de auditar.

- **TypeScript**: Modularizado en subcarpetas (`config/`, `core/`, `state/`, `ui/`)
  - Compilado con `tsc` (no TypeScript 7.x por incompatibilidad con `typescript-eslint`)
  - Concatenado a artefacto único `scripts/app.js` por script propio
  - Regeneración obligatoria: `npm run build:runtime` tras cambios TS
  
- **CSS**: Organizado en subcarpetas temáticas
  - `base/` (reset, layout, tipografía)
  - `board/`, `modals/`, `sidebar/` (componentes)
  - `responsive/` (media queries)
  - `global/` (variables de color, gradientes, sombras, movimiento)
  - Barrels centralizados importados en orden específico
  
- **Sin bundler** — concatenación manual controlada → auditoría clara, predecibilidad

**Referencia**: [Arquitectura de Scripts](../../docs/arquitectura/scripts.md), [Arquitectura CSS](../../docs/arquitectura/css.md)

---

### III. Calidad y Cobertura de Tests (NON-NEGOTIABLE)
**Objetivo**: Garantizar confiabilidad mediante tests automatizados en múltiples niveles.

- **Suite E2E (Playwright)**
  - 3 proyectos: chromium, webkit, mobile
  - Inventario de tests documentado en `docs/testing/e2e.md`
  - Gotchas y patterns conocidos registrados
  
- **Tests Unitarios (Node test runner)**
  - Cobertura de lógica en `scripts/core/` y `scripts/state/`
  - Ejecución: `npm run test:unit`
  
- **Prerequisito obligatorio**: Regenerar `scripts/app.js` con `npm run build:runtime` después de cambios TypeScript antes de probar.

**Referencia**: [Testing E2E](../../docs/testing/e2e.md), [Testing Unit](../../docs/testing/unit.md)

---

### IV. Convenciones de Flujo de Trabajo
**Objetivo**: Evitar footguns y conflictos en desarrollo colaborativo.

- **Prohibiciones explícitas**
  - No tocar `node_modules/` ni artefactos de resultados (`tests/*/results/`, `output/`) salvo explícitamente necesario
  - Nunca usar `git stash` para aislar cambios propios de cambios concurrentes sin commitear (falsos positivos); usar backup de archivo en `/tmp/`
  
- **Verificaciones obligatorias**
  - Si cambio visual/lógica no se refleja: ¿Se regeneró `scripts/app.js`? (`npm run build:runtime`)
  - Si petición menciona "archivo único": Confirmar si toca solo `index.html` o mantiene estructura modular
  
- **Bisección de bugs sin commits**
  - Aislar fichero a fichero (backup en `/tmp/`, git show, rebuild, test, restaurar) en lugar de `git stash`

**Referencia**: [Convenciones del proyecto](../../docs/convenciones.md#flujo-de-trabajo)

---

### V. Deuda Técnica Consciente y Documentada
**Objetivo**: Reconocer y gestionar proactivamente limitaciones técnicas conocidas.

- **TypeScript pinneado en serie 5.x** (no latest = 7.x)
  - **Razón**: `typescript-eslint@8.66.0` declara `peerDependencies.typescript: ">=4.8.4 <6.1.0"`; TS 7 queda fuera
  - **Alternativa considerada**: Aislar TS 7 en build con `npm overrides` → técnicamente viable, descartado por riesgo
  - **Riesgo**: Dos compiladores TS distintos podrían divergir en errores detectados
  
- **Acción pendiente**: Revisar cuando `typescript-eslint` publique soporte oficial para serie 7.x
  - Actualizar a última versión estable 5.x compatible con ese rango

**Referencia**: [Deuda Técnica](../../docs/deuda-tecnica.md)

---

### VI. Integración Continua y Build
**Objetivo**: Garantizar que el código siempre esté en estado de producción.

- **GitHub Actions**
  - Jobs **independientes**: lint, tests E2E, tests unit, build dist
  - Deploy **no depende** de E2E — ambos se ejecutan, pero E2E no bloquea producción
  
- **Build de desarrollo**: `npm run build:runtime`
  - Compila TS + regenera `scripts/app.js`
  
- **Build de producción**: `npm run build:dist`
  - Ejecuta `build:runtime` + genera `dist/`
  - HTML/CSS/JS con hash
  - CSS bundleado y minificado
  - Artefacto listo para deploy

**Referencia**: [CI/CD](../../docs/ci-cd.md)

---

### VII. Assets y Optimización
**Objetivo**: Garantizar imágenes web optimizadas sin sacrificar calidad visual.

- **Formato**: WebP obligatorio (compatibilidad: todos los navegadores modernos)
- **Flujo de optimización**: `npm run optimize:images`
  - Procesa `assets/images/**/*.webp`
  - Documentación del flujo en `docs/assets.md`

**Referencia**: [Assets](../../docs/assets.md)

---

## Documentación de Referencia Rápida

| Recurso | Contenido |
|---------|----------|
| [docs/index.md](../../docs/index.md) | Inicio para agentes + lista de comandos npm |
| [docs/arquitectura/](../../docs/arquitectura/) | Estructura, scripts, CSS, build |
| [docs/testing/](../../docs/testing/) | E2E (Playwright) + Unit (Node) |
| [docs/ci-cd.md](../../docs/ci-cd.md) | GitHub Actions jobs |
| [docs/assets.md](../../docs/assets.md) | Flujo imágenes WebP |
| [docs/convenciones.md](../../docs/convenciones.md) | Estilo, UX, flujo de trabajo |
| [docs/deuda-tecnica.md](../../docs/deuda-tecnica.md) | TypeScript 5.x, limitaciones conocidas |

---

## Comandos npm Esenciales

```bash
# Desarrollo
npm run build:runtime      # Compila TS + regenera app.js
npm run typecheck          # Verifica tipos sin generar artefactos

# Testing
npm run test:chromium      # E2E en Chromium
npm run test:e2e          # E2E completo (3 proyectos)
npm run test:unit         # Tests unitarios
npm run test:headed       # E2E en modo visible

# Linting & Optimización
npm run lint              # ESLint + Stylelint
npm run lint:fix          # ESLint con --fix
npm run optimize:images   # Optimiza WebP

# Producción
npm run build:dist        # Build listo para deploy
npm run serve             # Servidor estático local
```

---

## Governance

**Esta constitución es vinculante** para todas las decisiones de desarrollo.

- Cambios a principios requieren actualización explícita en `.specify/memory/constitution.md`
- La constitución se propaga a agentes y skills vía `specify` CLI
- Todas las PRs y cambios deben verificar cumplimiento con los 7 pilares
- Complejidad debe justificarse contra estos principios

**Version**: 1.0.0 | **Ratified**: 2026-08-06 | **Last Amended**: 2026-08-06
