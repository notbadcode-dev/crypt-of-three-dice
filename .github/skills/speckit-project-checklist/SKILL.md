---
name: "speckit-project-checklist"
description: "Pre-push validation checklist for feature completeness and project standards"
compatibility: "Essential final validation before git push; directs feature completion readiness"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# Project Pre-Push Checklist

This skill provides a final validation checklist before pushing code to ensure all project standards are met.

## Quick Pre-Push Checklist (5 minutes)

Before `git push origin <branch>`:

- [ ] **Linting passes**: `npm run lint` (no errors/warnings)
- [ ] **TypeScript compiles**: `npm run typecheck` (no type errors)
- [ ] **Unit tests pass**: `npm run test:unit` (green)
- [ ] **E2E tests pass**: `npm run test:chromium` (green)
- [ ] **Commit message follows convention**: Type(scope): subject
- [ ] **No untracked generated files**: `.tsbuild/`, `dist/`, `node_modules/`
- [ ] **TypeScript bundle regenerated** (if .ts changed): `npm run build:runtime`
- [ ] **Snapshots updated** (if CSS/images changed): `npm run test:chromium -- --update-snapshots`

**Estimated time**: 3-5 minutes (linting + typecheck + unit tests)

**Note**: E2E tests slower (~2-3 min); run in parallel with other work if possible.

---

## Full Pre-Push Validation (10-15 minutes)

For maximum confidence before pushing:

1. **Code Quality**
   - [ ] `npm run lint` passes (no errors)
   - [ ] `npm run typecheck` passes (no type errors)
   - [ ] No console.log / debugger statements left

2. **Tests**
   - [ ] `npm run test:unit` passes (100% green)
   - [ ] `npm run test:chromium` passes (100% green)
   - [ ] No flaky tests (run twice if any failures)
   - [ ] Visual snapshots reviewed (if CSS changed)
   - [ ] New tests added (if feature added)

3. **Build Artifacts**
   - [ ] `npm run build:runtime` completed (if .ts changed)
   - [ ] `scripts/app.js` regenerated and matches source
   - [ ] No `.tsbuild/` folder committed (it's generated)
   - [ ] `package-lock.json` not modified (unless deps changed)

4. **Git & Documentation**
   - [ ] Commit message follows `<type>(<scope>): <subject>` format
   - [ ] Body explains *why*, not just *what*
   - [ ] No unrelated changes in commit
   - [ ] Related issue referenced in footer (if applicable)
   - [ ] `docs/` updated (if architecture/workflow changed)

5. **Feature-Specific**
   - [ ] `index.html` validated (if markup changed)
   - [ ] Responsive design tested on mobile (`npm run test:chromium` includes mobile)
   - [ ] Assets (.webp only, no PNG/JPG)
   - [ ] Config paths updated (if new images/constants)
   - [ ] E2E tests cover new functionality

---

## Validation Scripts (One Command)

Run all checks at once:

```bash
# Parallel linting + typecheck + unit tests (fast)
npm run lint & npm run typecheck & npm run test:unit

# E2E (separate, slower)
npm run test:chromium

# Bundle (if TypeScript changed)
npm run build:runtime

# Summary: all green?
```

---

## By Change Type

### Type: Feature (New Ability, New UI Component)

Required checks:
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test:unit` passes (new + existing)
- [ ] `npm run test:chromium` passes
- [ ] New E2E test added (`tests/e2e/e2e.spec.js`)
- [ ] `npm run build:runtime` completed
- [ ] Visual snapshot updated (if UI visible)
- [ ] Commit: `feat(scope): description`

### Type: Bug Fix

Required checks:
- [ ] `npm run typecheck` passes
- [ ] `npm run test:unit` passes (regression test added)
- [ ] `npm run test:chromium` passes
- [ ] Regression test proves fix (e2e or unit)
- [ ] Commit: `fix(scope): description`
- [ ] Footer: `Fixes #<issue-number>`

### Type: CSS / Styling

Required checks:
- [ ] `npm run lint:css` passes
- [ ] `npm run test:chromium` passes
- [ ] Visual snapshots reviewed + updated
- [ ] Breakpoints match test expectations (check gotchas)
- [ ] No literal colors (all in `_colors.css`)
- [ ] Commit: `style(scope): description`
- [ ] Snapshots committed together with CSS

### Type: Tests (New Test Suite)

Required checks:
- [ ] Test file named correctly (`*.spec.js` for e2e, `*.test.mjs` for unit)
- [ ] `npm run test:unit` passes (or `npm run test:chromium`)
- [ ] Test is not skipped (no `.skip`)
- [ ] Commit: `test(scope): description`

### Type: Documentation

Required checks:
- [ ] Markdown syntax valid (no broken links)
- [ ] References to code match actual file paths
- [ ] Line numbers correct (use `[file.ts](file.ts#L10)` format)
- [ ] Commit: `docs: description`

### Type: Dependencies / Tooling

Required checks:
- [ ] `npm run build:runtime` succeeds (if build scripts changed)
- [ ] No direct edits to `package.json` (use `npm install`)
- [ ] `package-lock.json` reflects changes
- [ ] Commit: `chore: upgrade X to v2.0`

---

## Common Gotchas (Failure Points)

### ❌ TypeScript compiles but e2e fails

**Cause**: `types.js` not first in `sourceFiles` (array runtime values not defined)

**Check**: `scripts/build-runtime.mjs` line with `sourceFiles`; types.js must be first

**Fix**: Reorder `sourceFiles`, rebuild: `npm run build:runtime`

---

### ❌ Tests pass locally but fail in CI

**Cause**: Generated files (`.tsbuild/`, `dist/`, `node_modules/`) accidentally committed

**Check**: `git status | grep -E "\.tsbuild|dist|node_modules"`

**Fix**: Remove from git: `git rm --cached <file>` (add to `.gitignore`)

---

### ❌ CSS looks right locally but snapshot fails

**Cause**: Animations not disabled before screenshot; OS rendering differences

**Check**: Test uses `page.addInitScript()` to disable transitions (should be default)

**Fix**: Update snapshot locally: `npm run test:chromium -- --update-snapshots`

---

### ❌ Commit message rejected by linter

**Cause**: Message format invalid (missing scope, capital letter, period at end)

**Check**: Format is `<type>(<scope>): <subject>` (no period, lowercase, scope required for this project)

**Fix**: Amend commit: `git commit --amend -m "feat(combat): new message"` then `git push -f origin`

---

### ❌ Snapshot update not committed

**Cause**: Snapshot .png changed but not staged

**Check**: `git status | grep "\.spec\.js-snapshots"`

**Fix**: `git add tests/e2e/visual-regression.spec.js-snapshots/` before push

---

## Decision Tree: Am I Ready to Push?

```
┌─ All tests green (lint, typecheck, unit, e2e)?
│
├─ YES → Proceed
│  ├─ Bundle regenerated (if .ts changed)?
│  │  ├─ YES → Proceed
│  │  └─ NO → Run npm run build:runtime
│  │
│  ├─ Snapshots updated (if CSS/images changed)?
│  │  ├─ YES → Proceed
│  │  └─ NO → Run npm run test:chromium -- --update-snapshots
│  │
│  ├─ Commit message valid?
│  │  ├─ YES → READY TO PUSH ✅
│  │  └─ NO → Amend with git commit --amend
│  │
│  └─ Any untracked generated files?
│     ├─ YES → .gitignore them or don't stage
│     └─ NO → READY TO PUSH ✅
│
└─ NO → Fix failing tests, then re-run this tree
```

---

## See Also

- [git-conventional-workflow skill](../../git-conventional-workflow/SKILL.md) for commit message details
- [project-testing-strategy skill](../../project-testing-strategy/SKILL.md) for what tests to write
- [playwright-e2e-patterns skill](../../playwright-e2e-patterns/SKILL.md) for e2e debugging
- [project-typescript-build skill](../../project-typescript-build/SKILL.md) for bundle details
- [css-module-architecture skill](../../css-module-architecture/SKILL.md) for CSS gotchas
