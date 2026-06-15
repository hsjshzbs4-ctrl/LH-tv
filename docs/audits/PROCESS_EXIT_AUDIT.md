# Process Exit Path Audit

> LH-TV 2.x | Date: 2026-06-15 | Audit: RC3.1 Blocker #3 | Branch: release/rc2-candidate

---

## Audit Result: 12 exit paths, 2 need changes

---

## Exit Path Inventory

### A. Electron Main Process — `electron/main.ts`

#### Path 1: Fatal uncaughtException — HIGH RISK

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:57` |
| Code | `setTimeout(() => process.exit(1), 1000)` |
| Classification | `fatal-crash` |
| Leak Risk | **HIGH** — bypasses ALL cleanup |
| Action | **REPLACE** with graceful shutdown |

**Analysis**: The `setTimeout` is cosmetic (allows IPC `APP_ERROR` to be sent). Puppeteer browsers from `poster-fetcher.js` and `video-scraper.js` are never closed. Web Workers in renderer are not terminated. HTTP connections are left dangling.

**Fix**: Replace with `gracefulShutdown('fatal-error')` that closes browsers → stops updater → flushes state → `app.quit()`.

#### Path 2: Single-instance lock failure — SAFE

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:195` |
| Code | `app.quit()` |
| Classification | `second-instance` |
| Leak Risk | **None** — runs before any initialization |
| Action | **Leave as-is** |

#### Path 3: window-all-closed — MEDIUM RISK

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:236-240` |
| Code | `await closeBrowsers(); app.quit()` |
| Classification | `user-quit` |
| Leak Risk | **MEDIUM** — no try/catch, macOS Cmd+Q may skip |
| Action | **HARDEN** — add try/finally, add `before-quit` handler |

**Analysis**: The `async` function has no try/catch. If `closeBrowsers()` throws, `app.quit()` unreachable → process hangs. On macOS, Cmd+Q may fire `before-quit` instead of `window-all-closed` → cleanup skipped.

**Fix**: Add `app.on('before-quit', ...)` that runs the same cleanup. Wrap `closeBrowsers()` in try/finally with guaranteed `app.quit()`.

---

### B. Updater Service — `electron/services/updater.service.ts`

#### Path 4: autoUpdater.quitAndInstall() — MEDIUM-LOW RISK

| Attribute | Value |
|-----------|-------|
| File | `electron/services/updater.service.ts:89` |
| Code | `autoUpdater.quitAndInstall()` |
| Classification | `updater-restart` |
| Leak Risk | **MEDIUM-LOW** — `window-all-closed` should fire but no explicit browser close |
| Action | **INTEGRATE** — call `closeBrowsers()` before `quitAndInstall()` |

**Analysis**: The updater path calls `stopAutoUpdate()` (clears timer) but does NOT call `closeBrowsers()`. Relies on `window-all-closed` firing during the quit sequence. The update installer spawns a short-lived child process (Squirrel/NSIS) that self-terminates.

**Fix**: Call `closeBrowsers()` in the `INSTALL_UPDATE` IPC handler before `quitAndInstall()`.

---

### C. Standalone Scripts — `scripts/`

#### Paths 5-8: refresh-posters.js — SAFE

| Path | Line | Classification | Risk | Action |
|------|------|---------------|------|--------|
| 5 | 116 | `dev-exit` (missing data dir) | None | Leave |
| 6 | 205 | `dev-exit` (no catalog) | None | Leave |
| 7 | 230 | `dev-exit` (dry run) | None | Leave |
| 8 | 323 | `fatal-crash` (script) | Low | Leave |

These run as standalone Node.js processes — no Puppeteer, no persistent connections. The OS cleans up sockets.

#### Paths 9-11: fetch-missing-posters.js — MEDIUM RISK

| Path | Line | Classification | Risk | Action |
|------|------|---------------|------|--------|
| 9 | 81 | `dev-exit` (all cached) | None | Leave |
| 10 | 114 | `dev-exit` (success) | **MEDIUM** | **ADD** `closeBrowser()` before exit |
| 11 | 118 | `fatal-crash` (script) | **MEDIUM** | **ADD** `closeBrowser()` before exit |

**Analysis**: `batchFetchPosters()` launches a Puppeteer browser but never closes it. `process.exit()` kills the Node.js process, which kills the browser — but it's an unclean shutdown. Repeated runs could accumulate zombie browser processes.

---

### D. Test Code — `tests/`

#### Path 12: Packaged EXE smoke test — SAFE

| Attribute | Value |
|-----------|-------|
| File | `tests/packaged.spec.ts:21,40` |
| Code | `spawn(EXE_PATH)` → `proc.kill()` |
| Classification | `ci-test` |
| Leak Risk | Low — test-only, `proc.kill()` sends SIGTERM |
| Action | **Leave** |

---

## Summary

| # | Location | Classification | Risk | Action |
|---|----------|---------------|------|--------|
| 1 | `main.ts:57` | fatal-crash | **HIGH** | Replace with `gracefulShutdown()` |
| 2 | `main.ts:195` | second-instance | None | Leave as-is |
| 3 | `main.ts:236` | user-quit | MEDIUM | Add try/finally + `before-quit` |
| 4 | `updater.service.ts:89` | updater-restart | MEDIUM-LOW | Call `closeBrowsers()` first |
| 5-8 | `refresh-posters.js` | dev-exit | None/Low | Leave as-is |
| 9 | `fetch-missing-posters.js:81` | dev-exit | None | Leave as-is |
| 10 | `fetch-missing-posters.js:114` | dev-exit | MEDIUM | Add `closeBrowser()` |
| 11 | `fetch-missing-posters.js:118` | fatal-crash | MEDIUM | Add `closeBrowser()` |
| 12 | `packaged.spec.ts` | ci-test | Low | Leave as-is |

---

## Changes Required for RC3.1

| Priority | Path | Change |
|----------|------|--------|
| **HIGH** | Path 1 | Create `electron/runtime/shutdownManager.ts` → `gracefulShutdown()` |
| **MEDIUM** | Path 3 | Add `before-quit` handler + try/finally in `window-all-closed` |
| **MEDIUM** | Path 4 | Call `closeBrowsers()` before `quitAndInstall()` |
| **LOW** | Paths 10-11 | Add `closeBrowser()` in script (out of scope for RC3.1 — standalone scripts) |

Only Path 1 and Path 3 are Electron runtime paths that can leak child processes. Path 4 is a minor integration fix. Paths 10-11 are standalone scripts — deferred.
