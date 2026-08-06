# Convenciones del proyecto

## Diseño y UX

- Mantener la estética retro sobria ya existente; evitar rediseños que
  rompan la identidad visual.
- Preservar compatibilidad desktop y móvil.
- Antes de cambios grandes en UI, revisar `index.html` y los estilos
  segmentados en `styles/` para no duplicar reglas.

## Flujo de trabajo

- No tocar `node_modules/` ni artefactos de resultados (`tests/*/results/`,
  `output/`) salvo que el trabajo lo requiera explícitamente.
- Si un cambio visual o de lógica no se refleja al probar, comprobar si
  falta regenerar `scripts/app.js` con `npm run build:runtime`.
- Si la petición del usuario menciona "archivo único" o "single file",
  confirmar si quiere tocar solo `index.html` o mantener la estructura
  modular actual (CSS/TS separados) — el proyecto está deliberadamente
  modularizado, no es un HTML monolítico.

## Bisección de bugs con cambios concurrentes sin commitear

Si hay cambios propios más cambios de otra sesión/proceso sin commitear en
el mismo working tree, **no usar `git stash`** (revierte todo, incluidos
los cambios ajenos, dando falsos positivos al comparar). En su lugar,
aislar fichero a fichero:

```
cp file /tmp/backup
git show HEAD:path/to/file > file
<rebuild + test>
cp /tmp/backup file
<rebuild>
```

Esto permite aislar un fichero sin tocar el resto del working tree.

## Estructura de documentación

- Toda la documentación de referencia vive en [docs/](index.md), organizada
  por tema en subcarpetas (`arquitectura/`, `testing/`).
- `AGENTS.md` en la raíz se mantiene deliberadamente corto: es el punto de
  entrada rápido para agentes IA, con enlaces a `docs/` para el detalle.
