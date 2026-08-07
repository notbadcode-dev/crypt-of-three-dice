# Plan de Implementación: [FUNCIONALIDAD]

**Rama**: `[###-nombre-funcionalidad]` | **Fecha**: [FECHA] | **Especificación**: [enlace]

**Entrada**: Especificación de funcionalidad desde `/specs/[###-nombre-funcionalidad]/spec.md`

---

## 📝 Resumen Ejecutivo

[Extrae de la especificación: requisito primario + enfoque técnico de investigación]

**Valor para el usuario**: [Qué problema resuelve]

**Enfoque técnico**: [Cómo lo resolveremos]

---

## 🔧 Contexto Técnico

| Aspecto | Especificación |
|---------|---|
| **Lenguaje/Versión** | [ej: TypeScript 5.7, Python 3.11, o REQUIERE CLARIFICACIÓN] |
| **Stack Principal** | [ej: Node.js + Express, React 18, etc.] |
| **Dependencias Críticas** | [librerías principales requeridas] |
| **Almacenamiento** | [ej: PostgreSQL, localStorage, archivos, o N/A] |
| **Testing** | [ej: Playwright, Jest, pytest, Vitest] |
| **Plataforma Objetivo** | [ej: navegador, desktop, servidor] |
| **Tipo de Proyecto** | [ej: librería, CLI, aplicación web, componente] |
| **Metas de Rendimiento** | [ej: <200ms p95, 60 fps, 1000 req/s] |
| **Restricciones** | [ej: <100MB, offline-capable, sin terceros] |
| **Escala Esperada** | [ej: 10k usuarios, 50 pantallas] |

---

## ✅ Verificación de Constitución

**PUERTA**: Debe pasar ANTES de Fase 0 (Investigación)  
**Re-verificar**: Después de Fase 1 (Diseño)

### Verificación contra los 7 Pilares:

- [ ] **I. Identidad Visual Retro**: [Aplica a tu proyecto — verificar]
- [ ] **II. Arquitectura Modular**: [Cumple con estructura modular sin framework]
- [ ] **III. Tests (NON-NEGOTIABLE)**: [Especificados tests E2E + unit]
- [ ] **IV. Flujo de Trabajo**: [Sigue convenciones del proyecto]
- [ ] **V. Deuda Técnica**: [No introduce deuda nueva o documentada]
- [ ] **VI. CI/CD & Build**: [Integra con pipeline actual]
- [ ] **VII. Assets**: [Optimización de assets si aplica]

---

## 🗂️ Estructura de Proyecto

### Documentación (esta funcionalidad)

```
.specs/[###-nombre]/
├── spec.md                    # Especificación funcional (entrada)
├── plan.md                    # Este archivo (salida de /speckit-plan)
├── investigacion.md           # Fase 0: investigación técnica
├── modelo-datos.md            # Fase 1: diseño de datos
├── guia-rapida.md             # Fase 1: guía de desarrollador
├── contratos/                 # Fase 1: definición de APIs/interfaces
│   ├── api.yaml               # Especificación OpenAPI o similar
│   └── tipos.ts               # Tipos TypeScript compartidos
└── tareas.md                  # Fase 2: salida de /speckit-tasks
```

### Código Fuente (Estructura Base — Ajusta según tu proyecto)

```
Proyecto Single:

scripts/                       # TypeScript modularizado
├── config/                    # [Para esta funcionalidad]
├── core/                      # [Lógica de negocio nueva]
├── state/                     # [Estado/persistencia]
├── ui/                        # [UI/componentes nuevos]

styles/                        # CSS temático
├── board/                     # [Si afecta UI del tablero]
└── [nueva-carpeta]/           # [Si introduce nuevo componente]

tests/
├── e2e/                       # Pruebas end-to-end (Playwright)
└── unit/                      # Pruebas unitarias (Node test runner)
```

---

## 🎯 Fases de Implementación

### Fase 0: Investigación (Bloqueante) ⚠️

**Propósito**: Validar enfoque técnico y responder preguntas de diseño

**Entregables**:
- `investigacion.md`: Hallazgos técnicos, opciones consideradas, decisiones
- Decisiones documentadas sobre: [arquitectura clave, librerías, patrones]
- Riesgos y mitigaciones identificados

**Tareas**:
- Investigar [aspecto 1]
- Investigar [aspecto 2]
- Investigar [aspecto 3]

**Duración estimada**: [X horas]

---

### Fase 1: Diseño (Bloqueante)

**Propósito**: Definir estructura técnica detallada

**Entregables**:
- `modelo-datos.md`: Esquema de datos, relaciones, persistencia
- `contratos/`: Definición de APIs, tipos, interfaces
- `guia-rapida.md`: Cómo un nuevo desarrollador empieza a contribuir
- Revisión de arquitectura completa

**Tareas**:
- Diseñar modelo de datos
- Diseñar contratos/APIs
- Crear ejemplos de uso

**Duración estimada**: [X horas]

---

### Fase 2: Generación de Tareas

**Propósito**: Desglosar en tareas atómicas (salida de `/speckit-tasks`)

**Salida**: `tareas.md` con:
- Tareas agrupadas por historia de usuario (independientes)
- Dependencias claras
- Orden recomendado

---

### Fase 3: Implementación (Paralela por Historia)

**Propósito**: Ejecutar tareas según `tareas.md`

**Checkpoint**: Cada historia de usuario P1, P2, P3 completada y verificada

---

### Fase 4: Refinamiento e Integración

**Propósito**: Asegurar que todo funciona junto

- Tests E2E completos
- Optimizaciones de rendimiento
- Documentación final
- Code review final

---

## 🔀 Decisiones Técnicas Clave

| Decisión | Rationale | Alternativas Rechazadas |
|----------|-----------|------------------------|
| [Decisión 1] | [Por qué] | [Qué otras opciones consideramos] |
| [Decisión 2] | [Por qué] | [Alternativas] |

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|------------|-----------|
| [Riesgo 1] | Alto | Media | [Cómo prevenimos] |
| [Riesgo 2] | Medio | Baja | [Cómo prevenimos] |

---

## 📊 Estimación y Timeline

| Fase | Duración Est. | Dependencias |
|------|--------------|--------------|
| Fase 0: Investigación | [X horas] | — |
| Fase 1: Diseño | [X horas] | Fase 0 ✓ |
| Fase 2: Tareas | [X horas] | Fase 1 ✓ |
| Fase 3: Implementación | [X horas] | Fase 2 ✓ |
| Fase 4: Refinamiento | [X horas] | Fase 3 ✓ |
| **Total** | **[X horas]** | |

---

## 🚀 Criterios de Éxito

Para que este plan se considere **"Completado"**:

- ✅ Fase 0 (Investigación) completada y aprobada
- ✅ Fase 1 (Diseño) completada con contratos claros
- ✅ Fase 2 (Tareas) generadas con dependencias correctas
- ✅ Fase 3 (Implementación) completada con todos los tests pasando
- ✅ Fase 4 (Refinamiento) completada con documentación final
- ✅ Verificación con constitución del proyecto: **APROBADA**

---

## 📚 Referencias y Documentación

- Constitución del Proyecto: [docs/index.md](../../../docs/index.md)
- Especificación: `spec.md` (this feature)
- Convencionnes: [docs/conventions.md](../../../docs/conventions.md)
- Deuda Técnica: [docs/technical-debt.md](../../../docs/technical-debt.md)

---

**Versión**: 1.0 | **Última actualización**: [FECHA]  
**Aprobado por**: [Rol/Persona] | **Fecha aprobación**: [FECHA]
