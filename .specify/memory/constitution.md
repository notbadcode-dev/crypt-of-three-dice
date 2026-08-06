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

**Requisitos Verificables (EARS)**:
- **P-I-001**: El proyecto **DEBE** preservar la estética retro ya existente en cambios visuales.
  - Verificación: Code review valida que cambios CSS/HTML no rompan identidad retro existente
  
- **P-I-002**: El proyecto **DEBE** mantener compatibilidad funcionalmente equivalente en desktop y móvil.
  - Verificación: Tests E2E en proyectos `chromium`, `webkit` y `mobile` pasan al 100%
  
- **P-I-003**: El proyecto **NO DEBE** introducir rediseños que modifiquen la paleta, tipografía o componentes retro sin explícita aprobación.
  - Verificación: PR documenta y justifica cambios visuales contra `docs/convenciones.md#diseño-y-ux`

**Referencia**: [Convenciones del proyecto](../../docs/convenciones.md#diseño-y-ux)

---

### II. Arquitectura Modular sin Framework
**Objetivo**: Mantener una arquitectura modular, predecible y fácil de auditar.

**Requisitos Verificables (EARS)**:
- **P-II-001**: El proyecto **DEBE** organizar TypeScript en subcarpetas funcionales (`config/`, `core/`, `state/`, `ui/`).
  - Verificación: Archivos `.ts` nuevos están en subcarpeta correcta; build con `npm run build:runtime` no genera errores de orden
  
- **P-II-002**: El proyecto **DEBE** regenerar `scripts/app.js` después de cambios TypeScript usando `npm run build:runtime`.
  - Verificación: PR documenta regeneración; cambios TS visibles en `scripts/app.js` concatenado
  
- **P-II-003**: El proyecto **NO DEBE** usar TypeScript 7.x (pinneado en serie 5.x).
  - Verificación: `package.json` especifica `typescript: "^5.x"`; `npm run typecheck` pasa
  
- **P-II-004**: El proyecto **DEBE** organizar CSS en subcarpetas temáticas (`base/`, `board/`, `modals/`, `sidebar/`, `responsive/`, `global/`).
  - Verificación: Estilos nuevos están en carpeta apropiada; imports mantienen orden especificado en `styles/app.css`
  
- **P-II-005**: El proyecto **NO DEBE** usar bundler externo (Webpack, Vite) — concatenación manual es explícita y auditable.
  - Verificación: `package.json` no contiene webpack/vite; build usa scripts propios

**Referencia**: [Arquitectura de Scripts](../../docs/arquitectura/scripts.md), [Arquitectura CSS](../../docs/arquitectura/css.md)

---

### III. Calidad y Cobertura de Tests (NON-NEGOTIABLE)
**Objetivo**: Garantizar confiabilidad mediante tests automatizados en múltiples niveles.

**Requisitos Verificables (EARS)**:
- **P-III-001**: El proyecto **DEBE** tener suite E2E completa con 3 proyectos Playwright (chromium, webkit, mobile).
  - Verificación: `npm run test:e2e` ejecuta 3 proyectos; CI ejecuta todos; 100% pasan en master
  
- **P-III-002**: El proyecto **DEBE** tener tests unitarios para lógica crítica en `scripts/core/` y `scripts/state/`.
  - Verificación: `npm run test:unit` pasa; archivos en `tests/unit/` cubren módulos core
  
- **P-III-003**: El proyecto **DEBE** regenerar `scripts/app.js` con `npm run build:runtime` ANTES de ejecutar tests.
  - Verificación: Cambios TS seguidos de build → tests pasan; sin build → tests pueden fallar
  
- **P-III-004**: El proyecto **NO DEBE** mergear cambios sin tests E2E + unit pasando al 100%.
  - Verificación: GitHub Actions bloquea merge si lint, tests, build fallan; regla enforce en master

**Referencia**: [Testing E2E](../../docs/testing/e2e.md), [Testing Unit](../../docs/testing/unit.md)

---

### IV. Convenciones de Flujo de Trabajo
**Objetivo**: Evitar footguns y conflictos en desarrollo colaborativo.

**Requisitos Verificables (EARS)**:
- **P-IV-001**: El proyecto **NO DEBE** tocar `node_modules/` ni artefactos de resultados (`tests/*/results/`, `output/`).
  - Verificación: `.gitignore` excluye estas carpetas; PRs no incluyen cambios en estas rutas
  
- **P-IV-002**: El proyecto **NO DEBE** usar `git stash` para aislar cambios propios en desarrollo colaborativo.
  - Verificación: Si aislamiento de cambios es necesario, usar backup en `/tmp/` + git show + rebuild + test + restaurar
  
- **P-IV-003**: El proyecto **DEBE** regenerar `scripts/app.js` después de cambios TypeScript antes de testear.
  - Verificación: `npm run build:runtime` ejecutado; cambios TS reflejados en `scripts/app.js` en git status
  
- **P-IV-004**: El proyecto **DEBE** documentar todas las decisiones de "archivo único" vs "estructura modular".
  - Verificación: PR justifica explícitamente si mantiene estructura modular actual o simplifica

**Referencia**: [Convenciones del proyecto](../../docs/convenciones.md#flujo-de-trabajo)

---

### V. Deuda Técnica Consciente y Documentada
**Objetivo**: Reconocer y gestionar proactivamente limitaciones técnicas conocidas.

**Requisitos Verificables (EARS)**:
- **P-V-001**: El proyecto **DEBE** mantener TypeScript pinneado en serie 5.x (no latest/7.x).
  - Verificación: `package.json` especifica `typescript: "^5.x"`; razon documentada en `docs/deuda-tecnica.md`
  - Contexto: `typescript-eslint@8.66.0` declara `peerDependencies.typescript: ">=4.8.4 <6.1.0"`
  
- **P-V-002**: El proyecto **DEBE** documentar TODAS las limitaciones técnicas conocidas en `docs/deuda-tecnica.md`.
  - Verificación: Archivo contiene lista de limitaciones, razones y acciones pendientes
  
- **P-V-003**: El proyecto **NO DEBE** introducir deuda técnica sin documentar en PR o issue.
  - Verificación: PR documenta deuda nueva o explica por qué no introduce deuda

**Acción Pendiente**: Revisar cuando `typescript-eslint` publique soporte oficial para serie 7.x → actualizar

**Referencia**: [Deuda Técnica](../../docs/deuda-tecnica.md)

---

### VI. Integración Continua y Build
**Objetivo**: Garantizar que el código siempre esté en estado de producción.

**Requisitos Verificables (EARS)**:
- **P-VI-001**: El proyecto **DEBE** tener GitHub Actions con jobs independientes: lint, tests E2E, tests unit, build dist.
  - Verificación: `.github/workflows/ci.yml` define 4+ jobs; cada uno con scope independiente
  
- **P-VI-002**: El proyecto **DEBE** permitir deploy sin que E2E bloquee (ambos ejecutan independientemente).
  - Verificación: Deploy job NO depende de E2E job; E2E es check informativo, no bloqueante
  
- **P-VI-003**: El proyecto **DEBE** regenerar `scripts/app.js` en build de desarrollo.
  - Verificación: `npm run build:runtime` compila TS + regenera `scripts/app.js`; CI lo ejecuta
  
- **P-VI-004**: El proyecto **DEBE** generar `dist/` con assets hasheados y CSS minificado en build de producción.
  - Verificación: `npm run build:dist` crea `dist/`; CI ejecuta antes de deploy; artefacto listo para producción

**Referencia**: [CI/CD](../../docs/ci-cd.md)

---

### VII. Assets y Optimización
**Objetivo**: Garantizar imágenes web optimizadas sin sacrificar calidad visual.

**Requisitos Verificables (EARS)**:
- **P-VII-001**: El proyecto **DEBE** usar formato WebP para todas las imágenes (compatible en navegadores modernos).
  - Verificación: Archivos en `assets/images/` son `.webp`; no hay `.jpg`/`.png` sin versión WebP
  
- **P-VII-002**: El proyecto **DEBE** optimizar imágenes con flujo `npm run optimize:images`.
  - Verificación: Script ejecuta `optimize-images.mjs`; procesa `assets/images/**/*.webp`; salida verificada
  
- **P-VII-003**: El proyecto **DEBE** documentar flujo de optimización en `docs/assets.md`.
  - Verificación: Archivo contiene pasos exactos, herramientas usadas, calidad esperada

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

---

## Verificación de Cumplimiento (Checklist para PRs)

Antes de mergear cualquier cambio, verificar los 7 pilares:

- [ ] **I. Identidad Visual Retro**: Cambios mantienen estética retro existente (P-I-001/002/003)
- [ ] **II. Arquitectura Modular**: Cambios siguen estructura modular sin frameworks (P-II-001/002/003/004/005)
- [ ] **III. Tests Coverage**: Tests E2E + unit pasan; regenerado app.js (P-III-001/002/003/004)
- [ ] **IV. Flujo de Trabajo**: Cambios evitan git stash; documentan decisiones de arquitectura (P-IV-001/002/003/004)
- [ ] **V. Deuda Técnica**: TS 5.x mantenido; deuda documentada si la hay (P-V-001/002/003)
- [ ] **VI. CI/CD & Build**: Build ejecutado; CI pasa; deploy no bloqueado por E2E (P-VI-001/002/003/004)
- [ ] **VII. Assets**: WebP optimizado si hay imágenes nuevas (P-VII-001/002/003)

---

## Governance

**Esta constitución es vinculante** para todas las decisiones de desarrollo.

**Requisitos en Formato EARS (Easy Approach to Requirements Syntax)**:
- Cada pilar tiene requisitos verificables etiquetados `P-[I-VII]-[001-005]`
- Formato: `El proyecto DEBE/NO DEBE/DEBERÍA/PODRÁ [capacidad verificable]`
- Cada requisito incluye criterio de verificación explícito

**Workflow**:
- Cambios a principios requieren actualización explícita en `.specify/memory/constitution.md`
- La constitución se propaga a agentes y skills vía `specify` CLI
- Todas las PRs DEBEN verificar cumplimiento con los 7 pilares (checklist arriba)
- Complejidad debe justificarse contra estos principios

**Versión**: 1.1 | **Ratified**: 2026-08-06 | **Last Amended**: 2026-08-06 (migración a EARS verificable)
