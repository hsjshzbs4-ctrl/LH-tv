# Rollback Plan — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN
**Purpose**: Recoverable rollback procedures for RC2 Candidate

---

## 1. Branch Recovery

### Current State
> ⚠️ Git repository not initialized at RC2 freeze time.

### Recovery Procedure (once Git is initialized)

```bash
# Return to the RC2 freeze point
git checkout release/rc2-candidate

# Or via tag
git checkout v2.0-rc2-candidate

# Or via pre-performance tag
git checkout pre-performance-certification
```

---

## 2. Tag Recovery

### Tags to Recover

| Tag | Purpose |
|-----|---------|
| `v2.0-rc2-candidate` | RC2 candidate freeze point |
| `pre-performance-certification` | Before any performance testing |

### Recovery Commands

```bash
# List all tags
git tag -l

# Verify tag exists
git show v2.0-rc2-candidate

# Reset to tag
git reset --hard v2.0-rc2-candidate
```

---

## 3. Snapshot Recovery

All snapshots are stored in `docs/snapshots/`:

| Document | Path | Recovery Value |
|----------|------|---------------|
| RC2 Candidate Snapshot | `docs/snapshots/RC2_CANDIDATE_SNAPSHOT.md` | Full platform state |
| Feature Inventory | `docs/snapshots/FEATURE_INVENTORY.md` | 146 features cataloged |
| Routes Snapshot | `docs/snapshots/ROUTES_SNAPSHOT.md` | 24 routes documented |
| Architecture Snapshot | `docs/snapshots/ARCHITECTURE_SNAPSHOT.md` | Layer architecture |
| Dependency Snapshot | `docs/snapshots/DEPENDENCY_SNAPSHOT.md` | Module relationships |
| Test Snapshot | `docs/snapshots/TEST_SNAPSHOT.md` | 488 test cases |
| Build Snapshot | `docs/snapshots/BUILD_SNAPSHOT.md` | Build configuration |
| Marketplace Snapshot | `docs/snapshots/MARKETPLACE_SNAPSHOT.md` | Marketplace state |
| Developer Platform Snapshot | `docs/snapshots/DEVELOPER_PLATFORM_SNAPSHOT.md` | Developer platform state |

---

## 4. Baseline Recovery

All baselines are stored in `docs/baselines/`:

| Document | Path |
|----------|------|
| Startup Baseline | `docs/baselines/STARTUP_BASELINE.md` |
| Memory Baseline | `docs/baselines/MEMORY_BASELINE.md` |
| Repository Baseline | `docs/baselines/REPOSITORY_BASELINE.md` |
| Marketplace Baseline | `docs/baselines/MARKETPLACE_BASELINE.md` |
| Developer Baseline | `docs/baselines/DEVELOPER_BASELINE.md` |

---

## 5. Configuration Recovery

### Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies + scripts + build config |
| `tsconfig.json` | TypeScript configuration + path aliases |
| `electron.vite.config.ts` | Build tooling configuration |
| `index.html` | Renderer entry point |

### Recovery Commands

```bash
# Restore dependencies
npm ci

# Verify integrity
npm run typecheck
npm run build
npx vitest run
npx madge --circular src
```

---

## 6. Source Recovery

### Source Tree (202 files)

```
src/                    — Main source (TypeScript + Vue)
electron/               — Electron main process
developer-platform/     — Developer portal
tests/                  — Test suite
docs/                   — Documentation + snapshots
```

---

## 7. Rollback Decision Matrix

| Scenario | Recovery Action |
|----------|----------------|
| Performance regression found | `git checkout pre-performance-certification` |
| Build broken during RC2 | `git checkout v2.0-rc2-candidate` + `npm ci` |
| Snapshot docs lost | Restore from `docs/snapshots/` (committed) |
| Test regression | `git checkout v2.0-rc2-candidate` + `npm test` |
| Architecture drift | Compare against `ARCHITECTURE_SNAPSHOT.md` |
| Route drift | Compare against `ROUTES_SNAPSHOT.md` |
| Dependency issues | Compare against `DEPENDENCY_SNAPSHOT.md` |

---

## 8. Verification After Rollback

```bash
npm run typecheck          # Must: 0 errors
npm run build              # Must: PASS
npx vitest run             # Must: 488/488
npx madge --circular src   # Must: 0 cycles
```

If any check fails after rollback, the snapshot is invalid.
