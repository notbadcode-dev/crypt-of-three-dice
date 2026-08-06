# [TIPO DE CHECKLIST] Checklist: [NOMBRE DE FUNCIONALIDAD]

**Propósito**: [Descripción breve de qué cubre este checklist]

**Creado**: [FECHA]

**Funcionalidad**: [Enlace a spec.md o documentación relevante]

**Referencia**: Verificación de cumplimiento con [especificación/plan/constitution]

---

## 📋 Estructura General

Este checklist se divide en categorías. Marca con `[x]` cuando completes cada item.

```markdown
[x] Item completado
[ ] Item pendiente
[~] Item en progreso / parcial
```

---

## ✅ Checklist Base — Todos los Items

### Categoría 1: Requisitos Funcionales

- [ ] CHK001 Requisito RF-001 verificado y completado
  - Criterio de aceptación: [Cómo se verifica]
  - Evidencia: [Enlace a test, PR, etc.]

- [ ] CHK002 Requisito RF-002 verificado y completado
  - Criterio de aceptación: [Cómo se verifica]
  - Evidencia: [Enlace]

- [ ] CHK003 Requisito RF-003 verificado y completado
  - Criterio de aceptación: [Cómo se verifica]
  - Evidencia: [Enlace]

### Categoría 2: Historias de Usuario

#### Historia de Usuario 1 (P1 - MVP)
- [ ] CHK010 HU1 especificación clara y aprobada
- [ ] CHK011 HU1 escenarios Gherkin especificados
- [ ] CHK012 HU1 implementada
- [ ] CHK013 HU1 tests E2E pasando
- [ ] CHK014 HU1 tests unitarios pasando
- [ ] CHK015 HU1 documentada para usuario final

#### Historia de Usuario 2 (P2)
- [ ] CHK020 HU2 especificación clara y aprobada
- [ ] CHK021 HU2 implementada
- [ ] CHK022 HU2 tests pasando
- [ ] CHK023 HU2 documentada

#### Historia de Usuario 3 (P3)
- [ ] CHK030 HU3 especificación clara y aprobada
- [ ] CHK031 HU3 implementada
- [ ] CHK032 HU3 tests pasando
- [ ] CHK033 HU3 documentada

### Categoría 3: Calidad de Código

- [ ] CHK040 Linting (ESLint + Stylelint) pasa sin errores
- [ ] CHK041 TypeScript typecheck (`npm run typecheck`) pasa
- [ ] CHK042 Code review completado y aprobado
- [ ] CHK043 Sin deuda técnica introducida (o documentada)
- [ ] CHK044 Refactorización completada si es necesaria

### Categoría 4: Testing

- [ ] CHK050 Tests unitarios implementados para lógica crítica
  - Cobertura mínima: [Porcentaje]
  - Archivos: `tests/unit/[nombres]`

- [ ] CHK051 Tests de integración implementados
  - Archivos: `tests/e2e/[nombres]`

- [ ] CHK052 Tests E2E en Chromium pasando
  - Comando: `npm run test:chromium`
  - Resultado: 100% pasando

- [ ] CHK053 Tests E2E en WebKit pasando
  - Comando: `npx playwright test --project=webkit`
  - Resultado: 100% pasando

- [ ] CHK054 Tests E2E en Mobile pasando
  - Comando: `npx playwright test --project=mobile`
  - Resultado: 100% pasando

- [ ] CHK055 Todos los escenarios Gherkin tienen tests automatizados

### Categoría 5: Rendimiento

- [ ] CHK060 Métricas de rendimiento dentro de objetivos
  - Objetivo: [Especificar, ej: <200ms p95]
  - Resultado actual: [Medido]

- [ ] CHK061 No hay memory leaks detectados
  - Herramienta usada: [Profiling]
  - Resultado: [Aprobado]

- [ ] CHK062 Optimizaciones aplicadas si es necesario
  - Optimizaciones: [Cuáles se aplicaron]

### Categoría 6: Seguridad y Validación

- [ ] CHK070 Validación de entrada implementada
  - Campos validados: [Cuáles]

- [ ] CHK071 Manejo de errores robusto
  - Casos cubiertos: [Cuáles]

- [ ] CHK072 Logging de operaciones críticas
  - Eventos registrados: [Cuáles]

- [ ] CHK073 Datos sensibles no están expuestos
  - Verificado: [Cómo]

### Categoría 7: Documentación

- [ ] CHK080 Documentación de usuario actualizada
  - Archivos: [Cuáles docs se actualizaron]

- [ ] CHK081 Documentación técnica completa
  - Ubicación: [docs/arquitectura o similar]

- [ ] CHK082 Ejemplos de uso proporcionados
  - Ubicación: [Dónde están los ejemplos]

- [ ] CHK083 README o guía de inicio rápido actualizada

### Categoría 8: Verificación de Constitución

- [ ] CHK090 **I. Identidad Visual Retro**: Mantiene estética existente
- [ ] CHK091 **II. Arquitectura Modular**: No introduz framework, modular
- [ ] CHK092 **III. Tests Coverage**: Tests E2E + unit obligatorios ✅
- [ ] CHK093 **IV. Flujo de Trabajo**: Sigue convenciones del proyecto
- [ ] CHK094 **V. Deuda Técnica**: Documentada o inexistente
- [ ] CHK095 **VI. CI/CD & Build**: Compatible con pipeline actual
- [ ] CHK096 **VII. Assets**: WebP si hay imágenes, optimizado

### Categoría 9: Verificación Final

- [ ] CHK100 Todas las tareas en `tareas.md` completadas
- [ ] CHK101 Todos los requisitos RF-XXX verificados
- [ ] CHK102 Todas las historias de usuario completadas
- [ ] CHK103 Todos los escenarios Gherkin pasan
- [ ] CHK104 Build de producción (`npm run build:dist`) exitoso
- [ ] CHK105 Deployment listo para producción

---

## 📝 Notas y Comentarios

### Por Completar

Usa esta sección para notas, hallazgos o comentarios:

- **[FECHA]**: [Comentario sobre progreso]
- **[FECHA]**: [Hallazgo importante]
- **[FECHA]**: [Bloqueante o riesgo identificado]

---

## 📊 Progreso General

| Sección | Items | Completados | % |
|---------|-------|-------------|---|
| Requisitos Funcionales | 3 | 0 | 0% |
| Historias de Usuario | 12 | 0 | 0% |
| Calidad de Código | 5 | 0 | 0% |
| Testing | 6 | 0 | 0% |
| Rendimiento | 3 | 0 | 0% |
| Seguridad | 4 | 0 | 0% |
| Documentación | 4 | 0 | 0% |
| Constitución | 7 | 0 | 0% |
| Verificación Final | 6 | 0 | 0% |
| **TOTAL** | **50** | **0** | **0%** |

---

## ✅ Criterios para Marcar como "Hecha"

Para que esta funcionalidad esté definitivamente **COMPLETADA**:

1. ✅ Todos los checkboxes anteriores están marcados `[x]`
2. ✅ % de Progreso es 100%
3. ✅ Aprobación del product owner/stakeholder
4. ✅ Aprobación técnica (code review, tests)
5. ✅ Documentación completa y revisada
6. ✅ Preparada para merge a `master` y deploy

---

## 🔗 Enlaces Útiles

- **Especificación**: `spec.md`
- **Plan**: `plan.md`
- **Tareas**: `tareas.md`
- **Constitución**: [../../docs/index.md](../../../../docs/index.md)
- **Convenciones**: [docs/convenciones.md](../../../../docs/convenciones.md)

---

**Versión**: 1.0 | **Última actualización**: [FECHA]  
**Owner**: [Nombre] | **Reviewer**: [Nombre]
