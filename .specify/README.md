# Spec Kit — Configuración Local

Configuración de **Spec-Driven Development Toolkit** para el proyecto **Umbral de los Tres Dados**.

## 🎯 Resumen Rápido

Este proyecto usa **Spec Kit** para desarrollo guiado por especificaciones:

- ✅ **100% en Castellano** — Todos los templates traducidos
- ✅ **EARS + Gherkin** — Especificaciones claras, testables
- ✅ **Integración GitHub Copilot** — Comandos `/speckit-*` disponibles
- ✅ **Constitución del Proyecto** — 7 pilares de gobierno

## 📁 Contenido

| Carpeta/Archivo | Propósito |
|---|---|
| `memory/constitution.md` | Principios de gobierno del proyecto (7 pilares) |
| `../../../docs/speckit/setup-castellano-bdd.md` | Guía detallada de configuración (EARS + Gherkin) |
| `templates/` | **Tus templates en castellano** |
| `integrations/` | Configuración de integraciones (Copilot, etc.) |
| `scripts/` | Scripts de utility para Spec Kit |
| `workflows/` | Flujos de trabajo (workflow.yml) |

## 🚀 Comenzar

### 1. Ver la Constitución

```bash
cat .specify/memory/constitution.md
```

### 2. Leer la Guía de Configuración

```bash
cat ../../../docs/speckit/setup-castellano-bdd.md
```

### 3. Crear tu Primer Feature

En **GitHub Copilot**:

```
/speckit-specify Quiero crear un sistema de logro de misiones para rastrear progreso del jugador
```

## 📚 Flujo de Trabajo Típico

```
1. /speckit-specify     → Especificación (historias + requisitos EARS + escenarios Gherkin)
2. /speckit-plan        → Plan técnico (arquitectura, fases, verificación constitución)
3. /speckit-tasks       → Tareas (desglosadas por historia, con dependencias)
4. /speckit-implement   → Implementación (ejecuta tareas)
5. /speckit-checklist   → Validación (verifica que todo está completo)
```

## 🌍 Características

### EARS (Easy Approach to Requirements Syntax)
Requisitos claros, sin ambigüedad:

```
RF-001: El sistema DEBE permitir que usuarios creen perfiles
RF-002: El sistema NO DEBE permitir duplicados de email
RF-003: El sistema DEBERÍA enviar confirmación por email
```

### Gherkin (Behavior-Driven Development)
Escenarios testables:

```gherkin
DADO que soy un usuario nuevo
CUANDO creo una cuenta
ENTONCES recibo confirmación por email
```

### Historias Priorizadas (P1, P2, P3)
- **P1**: MVP (sin esto no hay valor)
- **P2**: Importante (mejora significativa)
- **P3**: Nice-to-have (optimización)

## 🔗 Enlaces Útiles

| Recurso | Ubicación |
|---------|-----------|
| Constitución | [memory/constitution.md](memory/constitution.md) |
| Guía Castellano + BDD | [memory/SETUP-CASTELLANO-BDD.md](memory/SETUP-CASTELLANO-BDD.md) |
| Templates (Castellano) | [templates/overrides/](templates/overrides/) |
| Documentación Spec Kit | [https://github.github.io/spec-kit/](https://github.github.io/spec-kit/) |
| Proyecto | [../../index.html](../../index.html) |

## ❓ Preguntas Frecuentes

### ¿Cómo veo las especificaciones creadas?

Están en `.specs/[###-nombre-feature]/` — check if directory is in root:

```bash
ls -la .specs/
```

### ¿Cómo ejecuto tests de los escenarios Gherkin?

Los escenarios Gherkin se mapean a tests en:
- `tests/e2e/` (Playwright)
- `tests/unit/` (Node test runner)

Ejecuta:
```bash
npm run test:chromium    # E2E en Chromium
npm run test:unit        # Tests unitarios
```

### ¿Puedo cambiar los templates?

Sí, están en `.specify/templates/overrides/` — modifica según necesites.

Spec Kit resuelve templates en orden:
1. `.specify/templates/overrides/` ← **Tus personalizaciones**
2. `.specify/templates/` ← Core de Spec Kit

### ¿Qué pasa si me equivoco en una especificación?

Usa `/speckit-clarify` para aclarar puntos ambiguos:

```
/speckit-clarify [tu pregunta]
```

---

**Última actualización**: 2026-08-06  
**Versión**: 1.0  
**Spec Kit**: 0.16.0  
**Constitución**: 1.0.0
