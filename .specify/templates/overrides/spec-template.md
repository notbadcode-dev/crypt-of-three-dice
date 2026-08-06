# Especificación de Funcionalidad: [NOMBRE DE FUNCIONALIDAD]

**Rama de Funcionalidad**: `[###-nombre-funcionalidad]`

**Creado**: [FECHA]

**Estado**: Borrador

**Entrada del usuario**: "[ARGUMENTOS]"

---

## 📋 Historias de Usuario & Pruebas *(obligatorio)*

<!--
  IMPORTANTE: Las historias de usuario DEBEN estar PRIORIZADAS como viajes del usuario
  ordenados por importancia. Cada historia/viaje DEBE ser INDEPENDIENTEMENTE VERIFICABLE,
  es decir: si implementas SOLO una de ellas, deberías tener aún un MVP viable.

  Asigna prioridades (P1, P2, P3...) donde P1 es la más crítica.
  Cada historia es un "slice" independiente que puede:
  - Desarrollarse independientemente
  - Probarse independientemente
  - Desplegarse independientemente
  - Demostrarse a usuarios independientemente
-->

### Historia de Usuario 1 - [Título Breve] (Prioridad: P1)

[Describe este viaje del usuario en lenguaje natural]

**Por qué esta prioridad**: [Explica el valor y por qué tiene esta prioridad]

**Prueba Independiente**: [Describe cómo esto puede probarse sin otras funcionalidades — ej: "Puede probarse completamente mediante [acción específica] y entrega [valor específico]"]

**Escenarios de Aceptación** (Formato Gherkin):

**Escenario 1**: [Descripción de la situación]
```gherkin
DADO que [estado inicial / contexto]
Y [precondición adicional si aplica]
CUANDO [acción que realiza el usuario]
Y [acción adicional si aplica]
ENTONCES [resultado esperado]
Y [verificación adicional si aplica]
```

**Escenario 2**: [Descripción de caso alternativo]
```gherkin
DADO que [estado inicial]
CUANDO [acción alternativa]
ENTONCES [resultado alternativo]
```

---

### Historia de Usuario 2 - [Título Breve] (Prioridad: P2)

[Describe este viaje del usuario]

**Por qué esta prioridad**: [Explica el valor]

**Prueba Independiente**: [Describe cómo se prueba]

**Escenarios de Aceptación**:

**Escenario 1**:
```gherkin
DADO que [estado inicial]
CUANDO [acción]
ENTONCES [resultado esperado]
```

---

### Historia de Usuario 3 - [Título Breve] (Prioridad: P3)

[Describe este viaje del usuario]

**Por qué esta prioridad**: [Explica el valor]

**Prueba Independiente**: [Describe cómo se prueba]

**Escenarios de Aceptación**:

**Escenario 1**:
```gherkin
DADO que [estado inicial]
CUANDO [acción]
ENTONCES [resultado esperado]
```

---

[Añade más historias según sea necesario, cada una con prioridad asignada]

### Casos Límite y Errores

<!--
  ACCIÓN REQUERIDA: Identifica y documenta todos los casos límite
  que el sistema debe manejar correctamente.
-->

- ¿Qué ocurre cuando [condición límite]?
- ¿Cómo maneja el sistema [escenario de error]?
- ¿Cuál es el comportamiento cuando [caso inusual]?

---

## 📌 Requisitos Funcionales *(obligatorio)*

<!--
  Utiliza la sintaxis EARS (Easy Approach to Requirements Syntax)
  para escribir requisitos claros y sin ambigüedades.

  Estructura EARS:
  - "El sistema DEBE" (obligatorio, funcionalidad)
  - "El sistema NO DEBE" (prohibición)
  - "El sistema PODRÁ" (opcional, mejora)
  - "El sistema DEBERÍA" (recomendado)
-->

### Requisitos EARS

- **RF-001**: El sistema **DEBE** [capacidad específica, ej: "permitir que usuarios creen cuentas"]
  - Contexto: [Explicación de por qué]
  - Verificación: [Cómo se verifica]

- **RF-002**: El sistema **DEBE** [capacidad, ej: "validar direcciones de correo electrónico"]
  - Contexto: [Explicación]
  - Verificación: [Cómo se verifica]

- **RF-003**: El sistema **NO DEBE** [prohibición, ej: "permitir duplicados en datos clave"]
  - Contexto: [Por qué es importante]
  - Verificación: [Cómo se valida]

- **RF-004**: El sistema **DEBERÍA** [recomendación, ej: "proporcionar retroalimentación visual inmediata"]
  - Contexto: [Explicación]
  - Verificación: [Cómo se verifica]

- **RF-005**: El sistema **PODRÁ** [opcional, ej: "exportar datos en múltiples formatos"]
  - Contexto: [Por qué podría ser útil]
  - Verificación: [Cómo se verifica]

*Ejemplo de requisito ambiguo marcado para clarificación:*

- **RF-006**: El sistema **DEBE** autenticar usuarios mediante [REQUIERE CLARIFICACIÓN: ¿método? correo/contraseña, SSO, OAuth, biometría?]
- **RF-007**: El sistema **DEBE** retener datos de usuario durante [REQUIERE CLARIFICACIÓN: ¿período? 30 días, 1 año, indefinidamente?]

---

## 🎯 Requisitos No Funcionales

- **Rendimiento**: [Objetivo específico, ej: <200ms p95, 1000 req/s]
- **Seguridad**: [Requisitos, ej: cifrado end-to-end, OWASP compliance]
- **Escalabilidad**: [Números, ej: soportar 10k usuarios concurrentes]
- **Disponibilidad**: [Objetivo, ej: 99.9% uptime]
- **Compatibilidad**: [Plataformas/navegadores/versiones]

---

## 🔗 Dependencias y Supuestos

- **Supuesto 1**: [Aquello que asumimos que es cierto]
- **Supuesto 2**: [Otra suposición importante]
- **Dependencia**: [Feature/componente externo requerido]

---

## ✅ Criterios de Aceptación de la Funcionalidad Completa

Para considerar esta funcionalidad como **"Hecha"** (Done):

- [ ] Todas las historias de usuario P1 están completadas y probadas
- [ ] Todos los escenarios Gherkin pasan en tests automatizados
- [ ] Se cumple cada requisito RF-XXX
- [ ] Sin defectos críticos o bloqueantes
- [ ] Documentación de usuario actualizada
- [ ] Aprobado por product owner/stakeholder

---

**Versión**: 1.0 | **Última actualización**: [FECHA]
