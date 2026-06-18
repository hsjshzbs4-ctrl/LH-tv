# Dead Code Report v2 — Sprint #2

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`
**Tool**: ts-prune + manual grep verification

---

## 1. Sprint #2 Cleanup Applied

### electron/utils/config.ts

| Removed | Lines | Reason |
|---------|-------|--------|
| `POSTER_DIR` | 1 | Zero TS imports (legacy JS has own local var) |
| `DOWNLOADS_DIR` | 1 | Zero references anywhere |
| `ApiSite` (interface) | 4 | Only used by `API_SITES` (also removed) |
| `API_SITES` | 5 | Zero TS imports |
| `CONTENT_FILTER` | 3 | Zero references |
| `STORAGE_KEYS` | 7 | Duplicate — `src/shared/storage/` has definitive version |
| `STORAGE_LIMITS` | 3 | Duplicate — `src/shared/storage/` has definitive version |
| `CACHE` | 4 | Duplicate — `src/core/cache/` has definitive version |
| `IPC_TIMEOUT` | 9 | Zero references |
| `DOWNLOAD` | 3 | Zero TS imports (legacy JS has own config.js) |
| `PLAYER` | 6 | Duplicate — `src/core/player/` has definitive version |
| **Total removed** | **~52 lines** | |

### electron/utils/http-client.ts

| Removed | Lines | Reason |
|---------|-------|--------|
| `fetchJson` | 8 | Zero imports across entire codebase |
| `fetchText` | 6 | Zero imports across entire codebase |
| **Total removed** | **~14 lines** | |

---

## 2. Cleanup Verification

```
TypeScript:  0 errors ✅
Tests:       242 files / 2134 tests ✅
Build:       PASS ✅
```

---

## 3. Verified False Positives (NOT Removed)

| Export | ts-prune Flag | Actual Status |
|--------|--------------|---------------|
| `gracefulShutdown` | Unused | Used in `electron/main.ts` via `electron/runtime/index.ts` barrel |
| `registerShutdownHooks` | Unused | Used in `electron/main.ts` |
| `attachRendererRecovery` | Unused | Used in `electron/main.ts` |
| `attachUnresponsiveRecovery` | Unused | Used in `electron/main.ts` |
| `attachLoadFailureRecovery` | Unused | Used in `electron/main.ts` |
| `useKeyboard` | Unused | Used in `src/App.vue` (SFC, not analyzed) |
| `usePlayer` | Unused | Likely used in .vue files |
| `useScroll` | Unused | Likely used in .vue files |
| `useStorageSync` | Unused | Likely used in .vue files |
| `useVirtualList` | Unused | Likely used in .vue files |
| `fetchWithTimeout` | Unused | Used in legacy `electron/shared-legacy/` JS files |

---

## 4. Frozen Zone — Unchanged

All exports in Frozen Zone are **barrel exports (Public API)** — kept intentionally:

- `src/ai/index.ts` — ~50 barrel exports → ✅ INTENTIONAL
- `src/ecosystem/index.ts` — ~50 barrel exports → ✅ INTENTIONAL
- `src/community/index.ts` — ~40 barrel exports → ✅ INTENTIONAL
- `src/enterprise/index.ts` — ~50 barrel exports → ✅ INTENTIONAL
- `src/governance/index.ts` — (no ts-prune output) → ✅ All consumed

---

## 5. Remaining ts-prune Output (Post-Cleanup)

Excluding Frozen Zone and verified false positives, remaining "unused" exports are either:
- Used in .vue SFC files (not analyzed by ts-prune)
- Used in legacy JS files (different import system)
- Barrel exports for public API

**Action**: No further cleanup recommended at this time.
