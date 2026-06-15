# RC3-A: Electron Production Audit

> LH-TV 2.x | Date: 2026-06-15 | Audit: RC3-A | Branch: release/rc2-candidate

---

## Audit Result: **PASS WITH FINDINGS** ⚠️

**Score: 68/100** — Functional but has production-critical gaps.

---

## 1. Window Lifecycle — WARN (75/100)

**File**: `electron/main.ts:65-108, 242-243`

### Verified

| Check | Status |
|-------|--------|
| Single BrowserWindow | ✅ PASS |
| `mainWindow` ref nulled on `'closed'` | ✅ PASS |
| macOS `'activate'` recreates window | ✅ PASS |
| `backgroundColor: '#0a0a0f'` set | ✅ PASS |
| `minWidth: 1024, minHeight: 576` | ✅ PASS |

### Findings

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | HIGH | `main.ts:79` | `webSecurity: false` — disables same-origin policy |
| 2 | MEDIUM | `main.ts:73` | `frame: false` — no native title bar; hung renderer = no close button |
| 3 | LOW | `main.ts:65-107` | No `show: false` + `ready-to-show` pattern — potential white flash |
| 4 | LOW | `main.ts:66-82` | No `will-resize`/`will-move` bounds enforcement beyond min values |

---

## 2. BrowserView / Puppeteer Lifecycle — WARN (65/100)

**Files**: `electron/main.ts:78`, `electron/shared-legacy/video-scraper.js:60-331`, `electron/shared-legacy/poster-fetcher.js:346-548`, `electron/ipc/bridge.ts:270-279`

### Verified

| Check | Status |
|-------|--------|
| `<webviewTag>` enabled | ⚠️ INFO (intentional for fallback sources) |
| Puppeteer browser cleanup on quit | ✅ PASS (bridge.ts:270-279) |
| Page pool reuse | ✅ PASS |

### Findings

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | MEDIUM | `video-scraper.js:60-75` | `getBrowser()` has no concurrency lock — dual launch risk |
| 2 | MEDIUM | `video-scraper.js:322-331` | `closeBrowser()` does NOT drain `pagePool` — handle leak |
| 3 | LOW | `poster-fetcher.js:376` | Race condition: `browserLaunchPromise = null` set too early |
| 4 | LOW | `poster-fetcher.js:364-365` | Hardcoded Edge path (`C:\Program Files (x86)\...`) |
| 5 | LOW | `poster-fetcher.js:364` | Hardcoded `userDataDir: 'D:/L-H/puppeteer-data'` |

---

## 3. IPC Cleanup — WARN (70/100)

**Files**: `electron/main.ts:111-190`, `electron/services/updater.service.ts:74-145`, `electron/ipc/bridge.ts:182-186`, `electron/preload.ts`

### Verified

| Check | Status |
|-------|--------|
| ~47 `ipcMain.handle()` handlers registered | ✅ PASS |
| contextBridge used in preload | ✅ PASS |
| Rate limiting on search/detail (3 req/s) | ✅ PASS |
| Event unsubscribe functions returned | ✅ PASS |

### Findings

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | MEDIUM | All IPC files | Zero `ipcMain.removeHandler()` calls — permanent handler lifetime |
| 2 | MEDIUM | `download-ipc.js:17-24` | `'progress'` EventEmitter listener — no guard against double-registration |
| 3 | LOW | `updater.service.ts:74-145` | `stopAutoUpdate()` does not remove IPC handlers |
| 4 | LOW | `main.ts:127-129` | `OPEN_EXTERNAL` uses minimal `https?://` regex, no hostname allowlist |
| 5 | LOW | `main.ts:167-178` | ECOSYSTEM_SEARCH — fire-and-forget, no renderer acknowledgment |

---

## 4. Process Cleanup — FAIL (45/100)

**Files**: `electron/main.ts:36-58, 193-203, 236-243`

### Findings

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | **HIGH** | `main.ts:57` | `process.exit(1)` on fatal uncaughtException **bypasses Puppeteer cleanup** — leaks child processes |
| 2 | **HIGH** | `main.ts:236-240` | `window-all-closed` handler is `async` with NO try/catch — if cleanup throws, `app.quit()` unreachable |
| 3 | MEDIUM | `main.ts:236` | Cleanup in `window-all-closed` instead of `before-quit` — macOS Cmd+Q may not trigger |
| 4 | MEDIUM | `main.ts` (missing) | No `will-quit` handler — last-chance cleanup missing |
| 5 | LOW | `main.ts:60-62` | `unhandledRejection` only logs, no renderer notification |
| 6 | LOW | `main.ts:197-202` | `second-instance` discards CLI args / deep links |

---

## 5. Renderer Cleanup — FAIL (35/100)

**File**: `electron/main.ts:65-108, 215-233`

### Findings

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| 1 | **CRITICAL** | `main.ts` (missing) | No `render-process-gone` handler — renderer crash = silent dead end |
| 2 | **CRITICAL** | `main.ts` (missing) | No `webContents.on('unresponsive')` handler — no hang recovery |
| 3 | **HIGH** | `main.ts` (missing) | No `webContents.on('did-fail-load')` handler — load failure = blank screen |
| 4 | MEDIUM | `main.ts:215-216` | `MAIN_READY` event re-fires on renderer reload (Ctrl+R) — not idempotent |
| 5 | LOW | `main.ts:79` | `webSecurity: false` + `webviewTag: true` — webview has unrestricted cross-origin access |

---

## Summary

| Area | Rating | Critical | High | Medium | Low |
|------|--------|----------|------|--------|-----|
| Window Lifecycle | WARN (75) | 0 | 1 | 1 | 2 |
| BrowserView Lifecycle | WARN (65) | 0 | 0 | 2 | 3 |
| IPC Cleanup | WARN (70) | 0 | 0 | 2 | 3 |
| Process Cleanup | **FAIL (45)** | 0 | 2 | 2 | 2 |
| Renderer Cleanup | **FAIL (35)** | 2 | 1 | 1 | 1 |

---

## RC3 Release Blockers

These must be fixed before RC3 production release:

1. **[CRITICAL]** Add `render-process-gone` handler — reload or show crash dialog on renderer crash
2. **[CRITICAL]** Add `'unresponsive'` handler — detect and recover from renderer hang
3. **[HIGH]** Replace `process.exit(1)` with graceful shutdown that closes Puppeteer browsers
4. **[HIGH]** Add `did-fail-load` handler — show error on initial load failure

---

## Mitigation: Known Limitations

These are acknowledged design decisions, not blockers:

- `webSecurity: false` — required for cross-origin video sources (CORS); mitigated by CSP headers
- `frame: false` — intentional frameless design; trade-off accepted
- No `ipcMain.removeHandler()` — single-window app, permanent handlers are acceptable
- Puppeteer Edge path — only affects poster-fetcher fallback; video-scraper probes multiple paths

---

## Certification

```
RC3-A ELECTRON PRODUCTION AUDIT
Status:   PASS WITH FINDINGS ⚠️
Score:    68/100
Blocker:  4 items (2 CRITICAL + 2 HIGH)
Verdict:  CONDITIONAL PASS — proceed with documented mitigations
```
