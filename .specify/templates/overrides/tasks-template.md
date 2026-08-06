---
description: "Lista de tareas para implementación de funcionalidad (castellano + BDD)"
---

# Tareas: [NOMBRE DE FUNCIONALIDAD]

**Entrada**: Documentos de diseño desde `.specs/[###-nombre-funcionalidad]/`

**Requisitos Previos**: `plan.md` (requerido), `spec.md` (requerido para historias), `investigacion.md`, `modelo-datos.md`, `contratos/`

**Tests**: Los ejemplos incluyen tareas de tests. Tests son OPCIONALES — solo inclúyelos si se piden explícitamente en la especificación.

**Organización**: Las tareas están agrupadas por historia de usuario para permitir implementación y prueba independiente de cada historia.

---

## 📐 Formato: `[ID] [P] [SU#] Descripción`

- **[ID]**: Identificador único (T001, T002, etc.)
- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[SU#]**: A qué historia de usuario pertenece (ej: HU1, HU2, HU3)
- **Paths**: Incluye rutas exactas de archivos en las descripciones

---

## 🚀 Fase 0: Investigación & Diseño (Bloqueante)

**Propósito**: Investigación necesaria antes de implementar

- [ ] T001 Investigar [aspecto técnico] y documentar en `investigacion.md`
- [ ] T002 Diseñar modelo de datos en `modelo-datos.md`
- [ ] T003 [P] Definir contratos de API/interfaz en `contratos/`
- [ ] T004 Verificar cumplimiento con constitución del proyecto

**Checkpoint**: Investigación completa → diseño aprobado → podemos comenzar implementación

---

## 🏗️ Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicialización del proyecto y estructura básica

- [ ] T005 Crear estructura del proyecto según plan de implementación
- [ ] T006 Inicializar dependencias del proyecto [lenguaje/framework]
- [ ] T007 [P] Configurar herramientas de linting y formateo
- [ ] T008 [P] Configurar tests (unit, integration, E2E)
- [ ] T009 Configurar CI/CD pipeline básico

---

## ⚙️ Fase 2: Fundacional (Bloquea Todo)

**Propósito**: Infraestructura core que DEBE completarse antes de CUALQUIER historia

**⚠️ CRÍTICO**: No puede comenzar trabajo de historias hasta que esta fase esté 100% completa

- [ ] T010 Configurar esquema de base de datos y framework de migraciones
- [ ] T011 [P] Implementar framework de autenticación/autorización
- [ ] T012 [P] Configurar enrutamiento de API y middleware
- [ ] T013 Crear modelos/entidades base que todas las historias necesitan
- [ ] T014 Configurar manejo de errores e infraestructura de logging
- [ ] T015 Configurar gestión de variables de entorno

**✅ Checkpoint**: Fundación lista → trabajo de historias puede comenzar en paralelo

---

## 📖 Fase 3: Historia de Usuario 1 - [Título] (Prioridad: P1) 🎯 MVP

**Objetivo**: [Descripción breve de qué entrega esta historia]

**Prueba Independiente**: [Cómo verificar que esta historia funciona por sí sola]

### Tests para Historia 1 (OPCIONAL — solo si se solicitan) ⚠️

> **NOTA: Escribe tests PRIMERO, asegúrate de que FALLEN antes de implementar (TDD)**

**Tests de Contrato**:
- [ ] T016 [P] [HU1] Test de contrato para [endpoint/interfaz] en `tests/contract/test_[nombre].py`

**Tests de Integración**:
- [ ] T017 [P] [HU1] Test de integración para [viaje de usuario] en `tests/integration/test_[nombre].py`

**Tests Unitarios**:
- [ ] T018 [P] [HU1] Tests unitarios para [módulo] en `tests/unit/test_[nombre].py`

### Implementación para Historia 1

**Modelos/Entidades**:
- [ ] T019 [P] [HU1] Crear modelo `[Entidad1]` en `src/modelos/[entidad1].py`
- [ ] T020 [P] [HU1] Crear modelo `[Entidad2]` en `src/modelos/[entidad2].py`

**Lógica de Negocio**:
- [ ] T021 [P] [HU1] Implementar servicio `[Servicio]` en `src/servicios/[servicio].py` (depende de T019, T020)
- [ ] T022 [HU1] Implementar [característica/endpoint] en `src/[ubicación]/[archivo].py`

**Validación y Manejo de Errores**:
- [ ] T023 [HU1] Añadir validación de entrada y manejo de errores
- [ ] T024 [HU1] Añadir logging para operaciones de Historia 1

**Documentación**:
- [ ] T025 [HU1] Documentar [characterística] en docs/

**✅ Checkpoint**: Historia de Usuario 1 completamente funcional y verificable independientemente

---

## 📖 Fase 4: Historia de Usuario 2 - [Título] (Prioridad: P2)

**Objetivo**: [Descripción breve]

**Prueba Independiente**: [Cómo verificar]

### Tests para Historia 2 (OPCIONAL)

- [ ] T026 [P] [HU2] Tests de contrato/integración para [viaje de usuario]
- [ ] T027 [P] [HU2] Tests unitarios para [módulo]

### Implementación para Historia 2

- [ ] T028 [P] [HU2] Crear modelo/servicio para [Entidad]
- [ ] T029 [HU2] Implementar [característica/endpoint]
- [ ] T030 [HU2] Validación y manejo de errores
- [ ] T031 [HU2] Logging y documentación

**✅ Checkpoint**: Historia de Usuario 2 completamente funcional

---

## 📖 Fase 5: Historia de Usuario 3 - [Título] (Prioridad: P3)

[Mismo formato que HU2]

---

## 🔀 Fase 6: Refinamiento e Integración

**Propósito**: Asegurar que todas las historias funcionan juntas correctamente

- [ ] T032 [P] Tests de integración E2E (todas las historias juntas)
- [ ] T033 Revisión de código y refactorización
- [ ] T034 Optimización de rendimiento si es necesario
- [ ] T035 Documentación final y guía de usuario

---

## 📋 Convenciones de Tareas

### Nomenclatura y Dependencias

```
T001 — Tarea inicial (sin dependencias)
T002 [P] — Puede ejecutarse en paralelo con T001
T003 — Depende de T001 y T002 (ejecutar después)
```

### Marcar Completadas

```markdown
- [x] T001 — Esta tarea está COMPLETADA
- [ ] T002 — Esta tarea está PENDIENTE
- [~] T003 — Esta tarea está EN PROGRESO
```

### Estructura de Archivos (Ajusta según tu proyecto)

```
src/
├── modelos/
├── servicios/
├── rutas/
└── utilidades/

tests/
├── contrato/
├── integracion/
└── unitarios/

docs/
```

---

## ✅ Definición de "Completada" (Definition of Done)

Una tarea está completada cuando:

- ✅ El código está escrito
- ✅ Los tests pasan (100% de los escenarios Gherkin)
- ✅ Code review aprobado
- ✅ Logging y manejo de errores implementados
- ✅ Documentación actualizada
- ✅ Sin deuda técnica introducida

---

## 📊 Progreso General

| Fase | Estado | Finalizado |
|------|--------|-----------|
| Fase 0: Investigación | ⏳ Pendiente | 0/4 |
| Fase 1: Configuración | ⏳ Pendiente | 0/5 |
| Fase 2: Fundacional | ⏳ Bloqueante | 0/6 |
| Fase 3: HU1 (MVP) | ⏳ Bloqueada | 0/8 |
| Fase 4: HU2 | ⏳ Bloqueada | 0/5 |
| Fase 5: HU3 | ⏳ Bloqueada | 0/5 |
| Fase 6: Refinamiento | ⏳ Bloqueada | 0/4 |

---

**Versión**: 1.0 | **Última actualización**: [FECHA]
