# RC2 Freeze — Architecture Freeze Rules

**Date**: 2026-06-14
**Version**: LH-TV 2.0 RC2 Candidate
**Status**: ❄️ FROZEN

---

## Freeze Rules

The following activities are **PROHIBITED** during RC2 freeze:

### ❌ No New Features
- No new modules
- No new pages/views
- No new components
- No new services
- No new routes

### ❌ No Refactors
- No file renames
- No module restructuring
- No pattern changes
- No code reorganization

### ❌ No Architecture Changes
- No layer modifications
- No dependency direction changes
- No new path aliases
- No build configuration changes

### ❌ No Breaking Changes
- No API signature changes
- No type interface changes
- No route path changes
- No store schema changes

---

## Allowed Activities

### ✅ Benchmarking
- Performance measurement scripts
- Load testing
- Stress testing
- Metric collection

### ✅ Testing
- New test cases for existing features
- Performance test implementation
- Memory profiling
- Concurrency testing

### ✅ Certification
- RC2 Performance Certification
- RC2 Memory Certification
- RC2 Security Certification
- Documentation updates (reports only)

### ✅ Bug Fixes (Critical Only)
- Fixes for crash bugs
- Fixes for data loss bugs
- Fixes for security vulnerabilities
- Must not change architecture

---

## Frozen Architecture

### Layer Boundaries (Immutable)

```
Views/Pages
    ↓ (Facade only)
Facades / Services
    ↓ (Manager only)
Managers / Core Modules
    ↓ (Shared only)
Shared (Types, Storage, IPC)
```

### Frozen Files

These files define architectural contracts and **MUST NOT CHANGE**:

| File | Reason |
|------|--------|
| `src/provider-contracts/*` | Provider type contracts |
| `src/shared/types/*` | Shared type contracts |
| `src/shared/ipc/ipc.channels.ts` | IPC channel definitions |
| `src/shared/storage/storage.keys.ts` | Storage key definitions |
| `src/router/index.ts` | Route definitions (24 frozen) |
| `package.json` | Dependency versions |

### Frozen Module Counts

| Layer | Files | Status |
|-------|-------|--------|
| Core Modules | 80 | ❄️ |
| Marketplace Core | 18 | ❄️ |
| Marketplace UI | 17 | ❄️ |
| Developer Platform | 15 | ❄️ |
| Views | 12 | ❄️ |
| Components | 15 | ❄️ |
| Provider Layer | 14 | ❄️ |
| Shared Layer | 14 | ❄️ |
| Electron | 38 | ❄️ |
| **TOTAL** | **202** | ❄️ |

---

## Validation Gates (Must Pass)

| Gate | Command | Expected |
|------|---------|----------|
| TypeCheck | `npm run typecheck` | 0 errors |
| Build | `npm run build` | PASS |
| Tests | `npx vitest run` | 66 files / 488 tests |
| Cycles | `npx madge --circular src` | 0 |
| Routes | Check `src/router/index.ts` | 24 routes |

---

## Freeze Duration

From: 2026-06-14
Until: RC2 Performance + Memory + Security Certification complete

---

## Violation Response

If a freeze violation is detected:
1. Document the violation
2. Revert to the frozen snapshot
3. Re-validate all gates
4. Re-certify if needed

---

## Unfreeze Conditions

The freeze is lifted when:
- [ ] RC2 Performance Certification complete
- [ ] RC2 Memory Certification complete
- [ ] RC2 Security Certification complete
- [ ] All certifications PASS
- [ ] RC2 Final Report generated
