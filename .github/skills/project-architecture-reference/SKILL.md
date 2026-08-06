---
name: "project-architecture-reference"
description: "Project structure, file organization, and architectural principles for Umbral de los Tres Dados"
compatibility: "Essential reference for all feature planning, implementation, and code reviews"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# Project Architecture Reference

**Umbral de los Tres Dados** is a retro tactical game served as a single HTML5 page with modular TypeScript and CSS that compile to unified artifacts.

## Key Principles

- **No framework, no bundler**: TypeScript compiles with `tsc`, then hand-concatenates to `scripts/app.js`
- **Modular by structure**: CSS and TS are organized in subcategories, but deploy as single files
- **Assets-first**: All images are WebP format, optimized by dedicated pipeline
- **Test-driven**: Playwright e2e + Node unit tests run on every build
- **Production-ready**: `npm run build:dist` generates hashed, minified, and bundled output

## Quick Navigation

| Question | Reference File |
|----------|-----------------|
| Where does each file type live? | [file-structure.md](references/file-structure.md) |
| What are the critical rules I must follow? | [critical-rules.md](references/critical-rules.md) |
| How do scripts work and when to rebuild? | See [`project-typescript-build` skill](../../project-typescript-build/SKILL.md) |
| How does CSS organize and cascade? | See [`css-module-architecture` skill](../../css-module-architecture/SKILL.md) |

---

## Start Here: File Structure

The repo is organized in 6 layers:

```
index.html                    ← Main entry point (never bundle)
├── styles/app.css           ← CSS barrel (single entry, modular inside)
├── scripts/app.js           ← JS barrel (generated, NEVER hand-edit)
├── assets/                  ← WebP images + icons
└── tests/                   ← Playwright e2e + Node unit tests
```

**Each layer has a single public import**, but modular internals. See [file-structure.md](references/file-structure.md) for the full breakdown.

---

## Critical Rules (Do or Don't Do)

Read [critical-rules.md](references/critical-rules.md) **before touching**:
- `scripts/` (when to rebuild, which files can be edited)
- `styles/board/board-overrides.css` (duplicate selectors on purpose)
- `styles/global/_colors.css` (where all new colors must go)
- `.tsbuild/` folder (generated; ignore it)
- `node_modules/` (never commit, never edit)

---

## When to Apply This Skill

Use this skill for:
- **Starting a new feature**: Understand where your code will live
- **Code review**: Validate file placement and separation of concerns
- **Onboarding agents**: Load file structure + rules before implementation
- **Debugging unexplained issues**: Often traced back to wrong file location or missed rebuild

---

## See Also

- **Speckit workflow**: `speckit-specify` → `speckit-plan` → `speckit-implement`
- **TypeScript build**: `project-typescript-build` skill (includes `build-runtime.mjs` details)
- **CSS architecture**: `css-module-architecture` skill (includes barrel pattern + theme)
- **E2E testing**: `playwright-e2e-patterns` skill (includes setup + visual regression)
