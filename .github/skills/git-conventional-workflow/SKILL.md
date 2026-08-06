---
name: "git-conventional-workflow"
description: "Git commit conventions and workflow for maintainable history"
compatibility: "Important for code review and CI clarity; directs commit message standards"
metadata:
  author: "project-maintainer"
  version: "1.0.0"
  updated: "2026-08-06"
---

# Git Conventional Workflow

This skill defines commit message standards and branching practices for the project.

## Commit Message Format

All commits follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (Required)

| Type | Meaning | Example |
|------|---------|---------|
| `feat` | New feature | `feat(combat): add poison damage mechanic` |
| `fix` | Bug fix | `fix(ui): hero HP display updates correctly` |
| `refactor` | Code restructure (no behavior change) | `refactor(scripts): extract geometry utils` |
| `style` | CSS/styling changes | `style(board): enemy card border animation` |
| `test` | Test additions/fixes | `test(e2e): add combat flow validation` |
| `docs` | Documentation changes | `docs: update architecture guide` |
| `ci` | CI/CD pipeline changes | `ci: skip e2e in CI, run separately` |
| `chore` | Dependencies, tooling, version bumps | `chore: upgrade playwright to v2.0` |
| `perf` | Performance improvements | `perf: optimize dice roll memoization` |

### Scope (Optional)

Describes **which part** of the codebase changed:

- `combat` → `scripts/core/combat.ts`
- `ui` → `scripts/ui/*.ts`
- `css` → `styles/`
- `tests` → `tests/unit/` or `tests/e2e/`
- `config` → `scripts/config/` or project config
- `(no scope)` → Project-wide changes

### Subject (Required)

- **Imperative mood**: "add", "fix", "update" (not "added", "fixes", "updated")
- **Lowercase**: start with lowercase letter
- **No period**: don't end with `.`
- **~50 characters**: concise, descriptive
- **In English**: all commits in English (even if comments in Spanish)

### Body (Optional)

- Longer description of changes
- Explain **why**, not just **what**
- Wrapped at ~72 characters
- Blank line between subject and body

### Footer (Optional)

- Reference issues: `Fixes #123`, `Related-to #456`
- Breaking changes: `BREAKING CHANGE: description`

---

## Examples

### Simple Feature

```
feat(combat): add poison damage over time

- Poison ticks every turn for 3 turns
- Damage scales with attacker level
- UI shows poison icon on affected enemy
```

### Bug Fix

```
fix(ui): hero HP display updates on damage

Previously, hero HP in HUD didn't refresh after taking damage
because setHeroHp wasn't triggering render(). Added render()
call after state mutation.

Fixes #42
```

### Refactor + Tests

```
refactor(scripts): extract geometry positioning to utils

Move board positioning logic to dedicated module to reduce
combat.ts size and enable reuse in new pathfinding system.

- Create scripts/core/geometry-utils.ts
- Migrate slot position calculations
- Update all imports in board-ui.ts
- Add unit tests for new functions

Related-to #18
```

### Styling Changes

```
style(board): increase modal padding on tablet

Adjusts responsive breakpoint to improve spacing on iPad
(1100px breakpoint). Also updates e2e test to match new
breakpoint.

- styles/responsive/tablet.css: modal padding increased
- tests/e2e/e2e.spec.js: update breakpoint check
```

### CI Changes

```
ci: enable visual regression snapshots locally

Previously snapshots were skipped in CI due to macOS vs
Ubuntu differences. Now:
- Local: all 3 projects run (chromium, webkit, mobile)
- CI: chromium only (snapshots excluded)
- Visual diffs tracked locally

Reduces false positives from platform-specific rendering.
```

---

## Commit Practices

### ✅ DO

- **Commit atomically**: One logical change per commit
  - Example: feature + tests + docs = one commit
  - Bad: feature, test, docs = three commits (hard to bisect)

- **Commit frequently**: After each complete feature/fix
  - No need to wait for 50 changes before committing
  - Each commit is deployable

- **Update snapshots + code together**:
  ```bash
  git add styles/board/enemy-card.css tests/e2e/visual-regression.spec.js-snapshots/
  git commit -m "style: enemy card shadow effect"
  ```

- **Regenerate bundle + code together**:
  ```bash
  git add scripts/core/combat.ts scripts/app.js scripts/build-runtime.mjs
  git commit -m "feat(combat): poison damage mechanic"
  ```

- **Write descriptive messages**: Use body for "why"
  - Future you (or reviewers) won't remember the context
  - `git blame` + `git show <commit>` should explain the change

### ❌ DON'T

- **Don't mix concerns**: One type per commit
  - Bad: `feat: add poison + refactor geometry + fix color bug`
  - Good: three commits

- **Don't commit generated files separately**
  - If `scripts/app.js` is regenerated, it must be in same commit as source
  - CI checks both; mismatches fail

- **Don't commit without tests**
  - Feature commits must include relevant tests
  - Bug fix commits include regression test

- **Don't use vague messages**
  - `feat: updates` ❌
  - `feat(combat): add poison damage mechanic` ✅

---

## Branching Strategy

### Main Branch: `master`

- **Always deployable**: All tests passing
- **Only receives**: Pull requests with reviews
- **Direct pushes**: Avoided (use PRs)

### Feature Branches

- **Name format**: `feature/short-description` or `fix/issue-name`
  - `feature/poison-damage`
  - `fix/hero-hp-display`
  - `refactor/geometry-utils`

- **Create from**: `master`
- **Merge back to**: `master` (PR required)

### Temporary Local Branches

For bisecting/debugging without polluting remote:

```bash
git checkout -b debug/test-order-issue
# ... test things ...
git checkout master
# debug branch stays local (never push)
```

---

## Pre-Push Checklist

Before `git push origin <branch>`:

1. **Linting passes**: `npm run lint`
2. **Types check**: `npm run typecheck`
3. **Unit tests pass**: `npm run test:unit`
4. **E2E tests pass**: `npm run test:chromium` (or full `test:e2e`)
5. **Commit message is descriptive**: Explains *why* not just *what*
6. **No untracked generated files**: `.tsbuild/`, `dist/`, `node_modules/`
7. **Bundle regenerated** (if TypeScript changed): `npm run build:runtime`
8. **Snapshots updated** (if CSS/images changed): `npm run test:chromium -- --update-snapshots`

---

## Interactive Rebase (Cleaning Up History)

If your branch has sloppy commits before pushing:

```bash
# Rebase last 3 commits (interactive)
git rebase -i HEAD~3

# In editor:
# pick abc1234 feat: add poison damage
# fixup def5678 oops, typo
# reword ghi9012 fix: update tests
# [Save and editor closes; prompts for reword message]

# Force-push to your branch (only if not yet merged)
git push origin feature/poison-damage -f
```

**Only rebase before push.** After merge to `master`, don't rebase (confuses history).

---

## Commit Flow Example

Scenario: Adding a new ability "Poison Damage"

```bash
# 1. Create feature branch
git checkout -b feature/poison-damage

# 2. Make changes
# - scripts/core/combat.ts: add poison logic
# - scripts/ui/ability-display.ts: show poison icon
# - styles/board/ability-icon.css: poison icon styling
# - tests/unit/app-core.test.mjs: test poison damage
# - tests/e2e/e2e.spec.js: test poison UI display

# 3. Build + test
npm run build:runtime
npm run lint
npm run test:unit
npm run test:chromium

# 4. Commit atomically (one logical unit)
git add scripts/core/combat.ts tests/unit/app-core.test.mjs scripts/app.js
git commit -m "feat(combat): add poison damage mechanic

- Damage ticks every turn for 3 turns
- Scales with attacker level
- Includes unit tests for damage calculation
- Related-to #15"

git add scripts/ui/ability-display.ts tests/e2e/e2e.spec.js
git commit -m "feat(ui): display poison status on enemy card

- Shows poison icon in enemy card
- Includes e2e test for poison UI
- Related-to #15"

git add styles/board/ability-icon.css tests/e2e/visual-regression.spec.js-snapshots/
git commit -m "style(board): poison ability icon styling

- New icon design with green tint
- Updated visual snapshots
- Related-to #15"

# 5. Push (will create PR)
git push origin feature/poison-damage
```

---

## See Also

- [Conventional Commits specification](https://www.conventionalcommits.org/)
- `git log --oneline` to see project history
- `git blame <file>` to see who changed what
- [docs/convenciones.md](../../../docs/convenciones.md) for project-specific conventions
