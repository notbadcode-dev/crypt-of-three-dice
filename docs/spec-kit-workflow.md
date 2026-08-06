---
name: "spec-kit-workflow"
type: "documentation"
parent: "docs"
keywords: ["spec-driven-development", "workflow", "features", "implementation"]
updated: "2026-08-06"
---

# Flujo de Trabajo Spec-Driven Development — Umbral de los Tres Dados

**Versión**: 1.0 | **Actualizado**: 2026-08-06 | **Stack**: HTML + CSS + TypeScript modular + Playwright

---

## Resumen Rápido

Umbral de los Tres Dados usa **Spec Kit v0.16.0** integrado con **GitHub Copilot** para desarrollo guiado por especificaciones. El flujo diferencia entre:

1. **Cambios pequeños** (bug fixes, ajustes visuales): Rápido (especificar → planificar → tareas → implementar)
2. **Features de producción** (nuevos mecánicas, sistemas): Completo (constitution → propuesta → especificar → aclarar → planificar → checklist → tareas → analizar → implementar → convergencia → revisión)

---

## Conceptos Base

### Constitution (Vinculante)
En `.specify/memory/constitution.md`: **7 pilares inmutables** que todo desarrollo debe respetar:

1. **Identidad Visual Retro** — Mantener estética existente
2. **Arquitectura Modular** — TypeScript 5.x sin bundler, carpetas funcionales
3. **Tests NON-NEGOTIABLE** — E2E (3 proyectos) + Unit obligatorios
4. **Convenciones de Workflow** — `npm run build:runtime`, git stash prohibido
5. **Deuda Técnica Documentada** — TS 5.x pinneado; cambios justificados
6. **CI/CD & Build** — Jobs independientes, deploy NO bloqueado por tests
7. **Assets WebP** — Imágenes optimizadas

### Integración
- **Agente**: GitHub Copilot (IDE-based)
- **Comandos**: Disponibles como skills en VS Code (`/speckit-specify`, `/speckit-plan`, etc.)
- **Linguaje**: Castellano (100%)
- **Estándares**: EARS (requisitos) + Gherkin (escenarios)

---

## FLUJO 1: Cambios Pequeños (< 1 día)

Para bug fixes, ajustes visuales, refactorización limitada.

### Paso 1: Especificar (5-10 min)
En **GitHub Copilot Chat** (VS Code):

```
/speckit-specify [descripción breve]

Ejemplo:
/speckit-specify Cambiar color de fondo del tablero a un azul más oscuro
```

**Entrada**: Descripción natural de qué cambiar.  
**Salida**: `spec.md` con:
- Historias de usuario (1-2)
- Escenarios Gherkin
- Criterios de aceptación

**Dónde guardar**: Crear carpeta `.specs/[###-nombre]/` con `spec.md`

### Paso 2: Planificar (5-10 min)
```
/speckit-plan [descripción]

Ejemplo:
/speckit-plan Cambiar color de fondo del tablero a un azul más oscuro
```

**Entrada**: Misma descripción (o ref a spec.md).  
**Salida**: `plan.md` con:
- Contexto técnico (archivos afectados)
- Verificación de constitución
- Fases de implementación

**Dónde guardar**: `.specs/[###-nombre]/plan.md`

### Paso 3: Tareas (5-10 min)
```
/speckit-tasks [descripción]
```

**Entrada**: Descripción.  
**Salida**: `tasks.md` con:
- Tareas numeradas [T001], [T002], etc.
- Archivos: `styles/global/_colors.css` (o `.css` correcto)
- Criterios de finalización
- Validación: `npm run lint:css` + test visual

**Dónde guardar**: `.specs/[###-nombre]/tasks.md`

### Paso 4: Implementar
Ejecutar tareas manualmente:

1. Editar archivos indicados
2. Después de cambios CSS: `npm run lint:css:fix` (si es seguro) o revisar manualmente
3. Después de cambios TypeScript: `npm run build:runtime` (regenera `scripts/app.js`)
4. Después de cambios HTML: Verificar referencias de assets
5. Validar: `npm run lint` + `npm run test:chromium`

**Checklist antes de merge**:
- [ ] `npm run lint` pasa
- [ ] `npm run build:runtime` regeneró app.js
- [ ] `npm run test:chromium` pasa 42/42
- [ ] No hay deuda técnica nueva sin documentar
- [ ] Constitution verificada (checklist en `.specify/memory/constitution.md`)

### Paso 5: Merge
```bash
git add .
git commit -m "feat: [descripción breve según convención]"
git push origin [rama]
# GitHub Actions valida automáticamente
```

**Tiempo total**: 30-60 min.

---

## FLUJO 2: Features de Producción (1-5 días)

Para nuevos sistemas, mecánicas significativas, cambios de datos.

### Fase 0: Constitution Review (Opcional)
Solo si el cambio afecta **principios globales** (ej: nueva tecnología, cambio de stack).

```
/speckit-constitution ¿Cambiar a TypeScript 7.x?
```

**Salida**: Propuesta de enmienda a `.specify/memory/constitution.md`  
**Acción**: Aprobación manual + commit explícito con justificación

### Fase 1: Propuesta (30 min)
**Archivo**: `.specs/[###-nombre]/proposal.md`

Documento corto (1-2 páginas):
- **Motivación**: ¿Por qué? ¿Qué problema resuelve?
- **Alcance**: ¿Qué incluye? ¿Qué no?
- **Impacto**: ¿Archivos afectados? ¿Tests?
- **Riesgo**: ¿Qué podría fallar?

**Ejemplo**:
```markdown
# Proposal: Sistema de Logros

## Motivación
El juego necesita un mecanismo de progresión a largo plazo para mantener enganche.

## Alcance
- Agregar tabla de logros en persistencia
- Mostrar logros desbloqueados en modal de fin de partida
- Guardar logros en localStorage

## Fuera de alcance
- API remota de logros
- Logros ocultos
- Estadísticas globales

## Archivos Afectados
- scripts/state/persistence.ts (nueva estructura)
- scripts/ui/modal-manager.ts (nuevo modal)
- styles/modals/ (estilos nuevos)
- tests/e2e/e2e.spec.js (tests de persistencia)

## Riesgo Principal
Cambio a estructura de localStorage puede romper partidas guardadas existentes.
Mitigación: Versión de formato, migración graceful.
```

### Fase 2: Especificación (30-45 min)
```
/speckit-specify Quiero un sistema de logros que guarde progreso y lo muestre en fin de partida
```

**Salida**: `spec.md` con:
- **Historias de Usuario** (priorizadas P1, P2, P3)
- **Requisitos EARS** (El sistema DEBE...)
- **Escenarios Gherkin** (DADO... CUANDO... ENTONCES...)
- **Casos Límite** (¿Qué pasa si hay corrupción de datos?)
- **Errores y Permisos** (¿Qué sucede si falla localStorage?)

**Guardar en**: `.specs/[###-nombre]/spec.md`

**Estructura esperada**:
```markdown
# Especificación: Sistema de Logros

## Historias de Usuario

### HU1 - Desbloquear logro por victoria (P1)
DADO que he ganado una partida
Y he satisfecho el criterio X
CUANDO termina la partida
ENTONCES se registra el logro

### HU2 - Ver logros desbloqueados (P2)
DADO que he desbloqueado logros
CUANDO finaliza la partida
ENTONCES veo modal de logros

### HU3 - Persistencia de logros (P3)
DADO que he desbloqueado un logro
CUANDO cierro y reabre el juego
ENTONCES el logro se mantiene
```

### Fase 3: Aclaración (15-30 min)
```
/speckit-clarify ¿Qué criterios definen "victoria"? ¿Hay limpieza de logros?
```

**Entrada**: Preguntas clave sin respuesta en spec.  
**Salida**: Integración de respuestas en `spec.md`

**Ejemplo de aclaciones típicas**:
- ¿Se resetean logros si permites reintentos?
- ¿Hay versiones de dificultad con diferentes logros?
- ¿Qué datos se guardan exactamente (fecha, modo, etc.)?

### Fase 4: Plan Técnico (30-45 min)
```
/speckit-plan Sistema de logros con persistencia en localStorage
```

**Salida**: `plan.md` con:
- **Contexto Técnico**: TypeScript 5.x, localStorage, sin APIs externas
- **Arquitectura Afectada**:
  - `scripts/state/persistence.ts` (nueva estructura `Achievements`)
  - `scripts/core/game-flow.ts` (desbloquear logro en fin de partida)
  - `scripts/ui/modal-manager.ts` (modal nueva)
  - `styles/modals/achievements.css` (estilos)
- **Persistencia**: localStorage con versión de formato
- **Contratos**: Tipo `Achievement { id, name, unlockedAt? }`
- **Validaciones**: Desbloqueo idempotente, no duplicados
- **Migraciones**: Versión 1 → Versión 2 (agregar achievements)
- **Tests**: E2E (desbloqueo + persistencia), Unit (lógica de desbloqueo)
- **Verificación Constitution**: Cumple pilares I-VII

**Guardar en**: `.specs/[###-nombre]/plan.md`

### Fase 5: Checklist de Requisitos (15 min)
```
/speckit-checklist Sistema de logros
```

**Salida**: `checklist.md` validando:
- [ ] ¿Están claros los criterios de desbloqueo?
- [ ] ¿Qué pasa si localStorage falla?
- [ ] ¿Los logros se resetean en ciertos casos?
- [ ] ¿Cómo se prueban visualmente?
- [ ] ¿Compatible con datos guardados anteriores?

**Guardar en**: `.specs/[###-nombre]/checklist.md`

### Fase 6: Tareas (30-45 min)
```
/speckit-tasks Sistema de logros con persistencia
```

**Salida**: `tasks.md` con fase-by-fase:

```markdown
# Tareas: Sistema de Logros

## Fase 0: Investigación
- [ ] T001 [HU1] Investigar localStorage limits en navegadores
- [ ] T002 [HU1] Definir esquema Achievement en investigacion.md

## Fase 1: Fundacional (Persistencia)
- [ ] T003 [P] Extender persistencia.ts con estructura Achievements
- [ ] T004 [P] Tests unitarios para migración v1→v2
- [ ] T005 Migración graceful de partidas guardadas

## Fase 2: HU1 - Desbloquear Logro
- [ ] T006 [HU1] Lógica de desbloqueo en game-flow.ts
- [ ] T007 [HU1] Tests E2E: ganar partida → desbloquea logro
- [ ] T008 [HU1] Validación: no duplicados, idempotencia

## Fase 3: HU2 - Mostrar Logros
- [ ] T009 [HU2] Modal achievements.css
- [ ] T010 [HU2] Componente ModalAchievements en modal-manager.ts
- [ ] T011 [HU2] Tests E2E: fin partida → muestra modal

## Fase 4: HU3 - Persistencia
- [ ] T012 [HU3] Tests E2E: recargar juego → logros se mantienen
- [ ] T013 [HU3] Tests E2E: localStorage vacío → no errores

## Validación
- [ ] T014 `npm run lint` pasa
- [ ] T015 `npm run build:runtime` regeneró app.js
- [ ] T016 `npm run test:chromium` pasa 42/42
- [ ] T017 Constitution verificada (7 pilares)
```

**Guardar en**: `.specs/[###-nombre]/tasks.md`

### Fase 7: Análisis de Consistencia (10-15 min)
```
/speckit-analyze
```

**Entrada**: Lee spec.md + plan.md + tasks.md automáticamente.  
**Salida**: Reporte de inconsistencias:
- ¿Tareas cuentan todo lo especificado?
- ¿Plan cubre lo especificado?
- ¿Hay requisitos sin tareas?

**Acción**: Corregir inconsistencias obvias; marcar ambigüedades.

### Fase 8: Implementación por Slices (1-4 días)
**Ejecutar tareas en orden, una fase a la vez**:

```bash
# Fase 0: Investigación
1. Leer task.md, fase 0
2. Ejecutar tareas manualmente
3. Documentar en investigacion.md

# Fase 1: Fundacional
1. Extender persistence.ts
2. npm run build:runtime
3. npm run test:unit && npm run test:chromium
4. Marcar T003, T004, T005 completadas

# Fase 2: HU1
1. Implementar desbloqueo en game-flow.ts
2. npm run build:runtime
3. npm run test:chromium
4. Marcar T006-T008 completadas

# ... (fases 3-4)
```

**Checklist entre fases**:
- [ ] Build pasa: `npm run build:runtime`
- [ ] Lint pasa: `npm run lint`
- [ ] Tests pasan: `npm run test:chromium`
- [ ] Cambios visibles en git status

### Fase 9: Convergencia (15-30 min)
**Al terminar todas las tareas**:

```
/speckit-converge
```

**Entrada**: Lee spec.md + plan.md + tasks.md + código.  
**Salida**: Reporte final:
- ¿Todas las historias están implementadas?
- ¿Hay tareas incompletas?
- ¿Código diverge de especificación?

**Acción**: Si convergencia encuentra gaps, agregar tareas nuevas a tasks.md.

### Fase 10: Revisión Humana (15-30 min)
**Crear PR con**:
- Título: `feat: sistema de logros #[###]`
- Descripción: Enlace a `.specs/[###-nombre]/`
- Checklist:
  - [ ] `npm run lint` pasa
  - [ ] `npm run build:runtime` ejecutado
  - [ ] `npm run test:chromium` pasa
  - [ ] Constitution verificada (todos los pilares)
  - [ ] Convergence completada sin gaps
  - [ ] Code review aprobada

**Merge**: Una vez aprobada.

**Tiempo total**: 1-5 días dependiendo de complejidad.

---

## Guía de Comandos

### Comandos Spec Kit (GitHub Copilot)
```
/speckit-specify [descripción]          → spec.md (historias + Gherkin)
/speckit-clarify [preguntas]            → Actualiza spec.md
/speckit-plan [descripción]             → plan.md (contexto + fases)
/speckit-checklist [funcionalidad]      → checklist.md (validaciones)
/speckit-tasks [descripción]            → tasks.md (tareas T001, T002, ...)
/speckit-implement [scope]              → Ejecución guiada (opcional)
/speckit-analyze                        → Verifica consistencia
/speckit-converge                       → Valida completitud
/speckit-constitution [pregunta]        → Enmienda a constitution.md
```

### Comandos npm (Build/Test/Lint)
```
npm run build:runtime                   # ✅ OBLIGATORIO: Compilar TS + regenerar app.js
npm run typecheck                       # Verificar tipos TS sin compilar
npm run lint                            # ESLint + Stylelint
npm run lint:fix                        # ESLint con --fix
npm run lint:css:fix                    # Stylelint con --fix
npm run test:chromium                  # Tests E2E (Chromium)
npm run test:e2e                        # Tests E2E (todos: chromium + webkit + mobile)
npm run test:unit                       # Tests unitarios (Node)
npm run test:headed                     # Tests E2E en modo visible
npm run test:ui                         # Tests E2E interfaz interactiva
```

### Workflow de Cambios
```bash
# Después de editar scripts/*.ts:
npm run build:runtime                   # ✅ OBLIGATORIO

# Después de editar styles/*.css:
npm run lint:css:fix                    # Opcional (si seguro)
npm run lint                            # Validar

# Antes de commit:
npm run lint                            # ESLint + Stylelint
npm run typecheck                       # Tipos TS
npm run test:chromium                  # Tests E2E

# Antes de push (en CI automáticamente):
npm run build:dist                      # Build producción opcional

# Commit:
git add .
git commit -m "feat|fix|refactor: descripción"
git push origin rama
```

---

## Estructura de Directorios para Features

```
.specs/
└── [###-nombre-feature]/                 # Ej: 001-achievement-system
    ├── spec.md                            # ✅ OBLIGATORIO (salida de /speckit-specify)
    ├── plan.md                            # ✅ OBLIGATORIO (salida de /speckit-plan)
    ├── tasks.md                           # ✅ OBLIGATORIO (salida de /speckit-tasks)
    ├── proposal.md                        # Opcional (propuesta inicial)
    ├── checklist.md                       # Opcional (salida de /speckit-checklist)
    ├── investigacion.md                   # Opcional (hallazgos técnicos)
    ├── modelo-datos.md                    # Opcional (cambios de persistencia)
    ├── contratos/                         # Opcional (interfaces/tipos nuevos)
    │   └── achievements.ts
    └── README.md                          # Opcional (resumen rápido)

Código Afectado (actualizar durante Fase 8):
├── scripts/
│   ├── config/                           # Configuración
│   ├── core/                             # Lógica de negocio
│   ├── state/                            # Persistencia/estado
│   └── ui/                               # Componentes visuales
├── styles/
│   ├── board/                            # Tablero
│   ├── modals/                           # Modales
│   ├── sidebar/                          # Barra lateral
│   └── responsive/                       # Media queries
└── tests/
    ├── e2e/                              # Tests Playwright
    └── unit/                             # Tests Node
```

---

## Decisión del Flujo

**¿Qué flujo elegir?**

| Cambio | Flujo | Tiempo |
|--------|-------|--------|
| Cambiar color CSS | **Flujo 1** (Pequeño) | 30-60 min |
| Ajustar modal | **Flujo 1** (Pequeño) | 60-90 min |
| Agregar nuevo sistema (logros, etc.) | **Flujo 2** (Production) | 1-5 días |
| Bug fix + test | **Flujo 1** (Pequeño) | 30-60 min |
| Refactorización de arquitectura | Consultar + posible **enmienda Constitution** | Variable |

---

## Checklist: Antes de Merge

```markdown
## ✅ Checklist Técnico (obligatorio para merge)

- [ ] `npm run lint` pasa (0 errores)
- [ ] `npm run build:runtime` regeneró `scripts/app.js`
- [ ] `npm run test:chromium` pasa 42/42
- [ ] No hay cambios en `node_modules/` o `output/`
- [ ] Si TypeScript 5.x cambios: `npm run typecheck` pasa

## ✅ Checklist Spec (obligatorio para features)

- [ ] spec.md completo (historias + Gherkin + criterios)
- [ ] plan.md completo (contexto + fases + verificación constitution)
- [ ] tasks.md completo (tareas numeradas + criterios + validación)
- [ ] checklist.md completado (si aplica)
- [ ] Convergencia ejecutada sin gaps

## ✅ Checklist Constitution (obligatorio para merge)

- [ ] I. Identidad Visual: No rompe estética retro
- [ ] II. Arquitectura: Módulos organizados, TypeScript 5.x
- [ ] III. Tests: E2E + unit pasan
- [ ] IV. Workflow: build:runtime ejecutado, sin git stash
- [ ] V. Deuda Técnica: Documentada si la hay
- [ ] VI. CI/CD: Build pasa, tests independientes
- [ ] VII. Assets: WebP optimizado si hay imágenes

## ✅ Checklist Visual (antes de merge)

- [ ] Tests visuales pasan en chromium
- [ ] Responsive funciona (desktop + mobile)
- [ ] Accesibilidad: Escape cierra modales, foco visible

## ✅ Checklist de Merge

- [ ] PR aprobada por revisor
- [ ] Rama actualizada con main (si requiere)
- [ ] Todos los checks arriba marcados
- [ ] GitHub Actions pasó en CI
```

---

## Recursos

| Recurso | Ubicación |
|---------|-----------|
| Constitution (vinculante) | `.specify/memory/constitution.md` |
| Specs activas | `.specs/[###-nombre]/` |
| Templates | `.specify/templates/` |
| Skills Copilot | `.github/skills/speckit-*/` |
| Documentación Arquitectura | `docs/arquitectura/` |
| Tests | `tests/e2e/` + `tests/unit/` |
| Package.json (npm scripts) | `package.json` |

---

## Preguntas Frecuentes

**P: ¿Puedo saltarme especificación para cambios simples?**  
R: No. Siempre usa `/speckit-specify`, aunque sea breve. Esto evita cambios no documentados.

**P: ¿Qué pasa si `npm run build:runtime` falla?**  
R: Hay error en TypeScript. Ejecuta `npm run typecheck` para ver detalles y corrige antes de commit.

**P: ¿Puedo usar `git stash`?**  
R: No. Usa `/tmp/backup.txt` en su lugar. Constitution lo prohibe (facilita revisión auditada).

**P: ¿Cuándo ejecuto convergence?**  
R: Cuando TODAS las tareas de `tasks.md` estén completadas. Identifica gaps faltantes.

**P: ¿Lint falla, ¿qué hago?**  
R: Ejecuta `npm run lint:fix` si los errores son automaticamente reparables. Revisa manualmente si no.

**P: ¿Puedo mergear si tests fallan?**  
R: No. Constitution es NON-NEGOTIABLE. 42/42 tests DEBEN pasar en master.

**P: ¿Cómo documentar deuda técnica?**  
R: Agregando sección en `plan.md` → "Deuda Técnica Introducida" + justificación. Luego en `docs/deuda-tecnica.md`.

---

**Última actualización**: 2026-08-06  
**Versión Spec Kit**: 0.16.0  
**Integración**: GitHub Copilot  
**Lenguaje**: Castellano
