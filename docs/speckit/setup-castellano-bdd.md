# Configuración de Spec Kit — Castellano + BDD/EARS/Gherkin

## 🌍 Localización y Estandares

Este proyecto usa **Spec Kit** configurado para:

### Idioma
- ✅ **100% en Castellano** — Especificaciones, planes, tareas, checklists
- Todos los templates en `.specify/templates/overrides/` están traducidos
- Documentación en español

### Estándares de Especificación

#### 1. **EARS** (Easy Approach to Requirements Syntax)
Utilizado en requisitos funcionales para claridad y evitar ambigüedades:

```
El sistema DEBE [capacidad específica]
El sistema NO DEBE [prohibición]
El sistema DEBERÍA [recomendación]
El sistema PODRÁ [opcional]
```

**Por qué EARS**:
- Evita ambigüedades en lenguaje natural
- Fácil de verificar (cada requisito es testeable)
- Facilita la trazabilidad
- Mejora la comunicación entre equipo técnico y no técnico

#### 2. **Gherkin** (Behavior-Driven Development)
Utilizado en escenarios de aceptación:

```gherkin
DADO que [estado inicial]
Y [precondición]
CUANDO [acción]
Y [acción adicional]
ENTONCES [resultado esperado]
Y [verificación]
```

**Por qué Gherkin**:
- Lenguaje natural pero estructurado
- Directamente mapeable a tests automatizados (Playwright, Jest, etc.)
- Facilita comunicación entre stakeholders y desarrolladores
- Reduce ambigüedad en aceptación

#### 3. **Historias de Usuario Priorizadas**
Cada funcionalidad tiene historias de usuario agrupadas por prioridad (P1, P2, P3):

- **P1**: MVP — sin esto, el feature no tiene valor
- **P2**: Importante pero no MVP
- **P3**: Mejorable (nice-to-have)

**Por qué priorización**:
- Permite MVP incremental
- Cada historia es independientemente verificable
- Facilita gestión de riesgo

---

## 📁 Estructura de Spec Kit

```
.specify/
├── memory/
│   └── constitution.md           # Principios del proyecto (7 pilares)
│
├── templates/
│   ├── spec-template.md          # Especificaciones (EARS + Gherkin)
│   ├── plan-template.md          # Planes técnicos
│   ├── tasks-template.md         # Tareas por historia
│   └── checklist-template.md     # Validación de completitud
│
├── integrations/
│   └── copilot.manifest.json     # Configuración GitHub Copilot
│
└── scripts/
    └── bash/                     # Scripts de utility
```

### 🎯 Resolución de Templates

Spec Kit resuelve templates en este orden (primera coincidencia gana):

1. **`.specify/templates/`** ← **Tus templates en castellano** (ubicados aquí)
2. `.specify/presets/templates/` ← Presets (si aplican)
3. `.specify/extensions/templates/` ← Extensiones
4. Core de Spec Kit (inglés) ← Fallback

**Resultado**: Los templates en castellano se usan automáticamente en todas las generaciones.

---

## 🚀 Cómo Usar

### Workflow Típico con Spec Kit

#### 1. Crear Especificación (Español + Gherkin)

```bash
# En Copilot, ask:
/speckit-specify Quiero que los usuarios puedan crear y editar perfiles de jugador
```

**Genera**: `spec.md` con:
- Historias de usuario (P1, P2, P3)
- Requisitos EARS
- Escenarios Gherkin
- Todo en castellano

#### 2. Crear Plan Técnico

```bash
/speckit-plan
```

**Genera**: `plan.md` con:
- Contexto técnico
- Fases de investigación/diseño
- Arquitectura propuesta
- Verificación de constitución
- Todo en castellano

#### 3. Generar Tareas

```bash
/speckit-tasks
```

**Genera**: `tareas.md` con:
- Tareas agrupadas por historia
- Dependencias claras
- Orden recomendado
- Fases: Investigación → Fundacional → Historias
- Todo en castellano

#### 4. Implementar

```bash
/speckit-implement
```

**Ejecuta**: Las tareas definidas en `tareas.md`

#### 5. Verificar Completitud

```bash
/speckit-checklist
```

**Genera**: Checklist para validación final

---

## 📐 Ejemplo: Especificación EARS + Gherkin

### Requisito EARS (Claro, Sin Ambigüedad)

```
RF-001: El sistema DEBE permitir que un usuario cree una cuenta con email y contraseña
  - Contexto: Nuevo usuario sin cuenta
  - Verificación: El usuario recibe confirmación de email y puede loginear
```

Vs. versión ambigua (evitar):
```
❌ "Los usuarios deben poder registrarse"
   (¿Con email? ¿Por qué campos? ¿Validaciones?)
```

### Escenario Gherkin (Testeable)

```gherkin
DADO que soy un usuario nuevo
Y he recibido el email de bienvenida
CUANDO hago click en "Confirmar email"
Y ingreso una contraseña fuerte
ENTONCES el sistema me muestra "Cuenta creada exitosamente"
Y puedo loguear con mis credenciales
```

Este escenario se convierte directamente en test:
```javascript
test('Usuario nuevo puede crear cuenta y loguear', async ({ page }) => {
  // DADO que...
  await page.goto('/registro');
  
  // CUANDO...
  await page.fill('[data-testid="email"]', 'nuevo@ejemplo.com');
  await page.fill('[data-testid="contraseña"]', 'MiClave123!');
  await page.click('button[type=submit]');
  
  // ENTONCES...
  await expect(page.locator('text=Cuenta creada')).toBeVisible();
});
```

---

## 🔄 Mapeo: Gherkin → Tests

| Gherkin | Playwright Test |
|---------|-----------------|
| `DADO que...` | `test('...', async ({ page }) => { ...`)  |
| `Y [precondición]` | `await page.goto(...); await page.fill(...);` |
| `CUANDO [acción]` | `await page.click(...);` |
| `ENTONCES [resultado]` | `await expect(...).toBeVisible();` |

**Beneficio**: Tus especificaciones SON tests, cero duplicación.

---

## ✅ Checklist de Configuración

- [x] Templates en `.specify/templates/` creados (spec, plan, tasks, checklist)
- [x] Todos los templates en **castellano**
- [x] Templates incluyen **EARS** para requisitos
- [x] Templates incluyen **Gherkin** para escenarios
- [x] Constitución del proyecto aprobada ([constitution.md](../../.specify/memory/constitution.md))
- [ ] Primer feature creada con `/speckit-specify` para validar workflow
- [ ] Team familiarizado con EARS + Gherkin
- [ ] CI/CD integrado con specs (opcional: auto-run escenarios Gherkin)

---

## 🎓 Recursos y Referencias

### EARS (Easy Approach to Requirements Syntax)
- Plantillas EARS: [https://www.easy-approach.org/](https://www.easy-approach.org/)
- Guía rápida: Usa "El sistema DEBE/NO DEBE/DEBERÍA/PODRÁ"

### Gherkin (Behavior-Driven Development)
- Documentación oficial: [https://cucumber.io/docs/gherkin/](https://cucumber.io/docs/gherkin/)
- Integración con Playwright: Tests en Gherkin → `@cucumber/cucumber`

### Spec Kit
- Documentación: [https://github.github.io/spec-kit/](https://github.github.io/spec-kit/)
- Constitución del proyecto: [index.md](../index.md)

---

## 📋 Próximos Pasos

1. **Crea tu primer feature**:
   ```bash
   /speckit-specify [descripción de funcionalidad]
   ```

2. **Revisa la especificación generada**:
   - Verifica historias de usuario
   - Verifica requisitos EARS
   - Verifica escenarios Gherkin

3. **Crea el plan técnico**:
   ```bash
   /speckit-plan
   ```

4. **Genera tareas**:
   ```bash
   /speckit-tasks
   ```

5. **Implementa según tareas**:
   ```bash
   /speckit-implement
   ```

---

**Configuración actualizada**: 2026-08-06  
**Versión Spec Kit**: 0.16.0  
**Versión Constitución**: 1.1 (EARS migration)
