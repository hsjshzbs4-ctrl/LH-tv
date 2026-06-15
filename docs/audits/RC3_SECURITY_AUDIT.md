# RC3-B: Security Audit

> LH-TV 2.x | Date: 2026-06-15 | Audit: RC3-B | Branch: release/rc2-candidate

---

## Audit Result: **PASS WITH FINDINGS** ⚠️

**Score: 70/100** — Core Electron security is solid; isolation and enforcement gaps exist.

---

## 1. contextIsolation — ✅ PASS

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:77` |
| Setting | `contextIsolation: true` |
| Status | **PASS** |

Renderer cannot access Node.js/Electron APIs directly. Confirmed via: no `require('electron')` found in any `src/` file.

---

## 2. sandbox — ❌ FAIL

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:75-81` |
| Setting | **Not present** — defaults to `false` |
| Status | **FAIL** |

The `sandbox` property is absent from `webPreferences`. Without `sandbox: true`, the renderer lacks OS-level process isolation. `contextIsolation` and `nodeIntegration: false` provide app-level protection, but OS sandbox is a critical defense-in-depth layer.

**Risk**: Renderer compromise has broader process access than defense-in-depth requires.

**Fix**: Add `sandbox: true` to `webPreferences` at `electron/main.ts:75`.

---

## 3. nodeIntegration — ✅ PASS

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:76` |
| Setting | `nodeIntegration: false` |
| Status | **PASS** |

No `require()` or Node.js modules accessible in the renderer. Confirmed by codebase audit.

---

## 4. CSP (Content Security Policy) — ✅ PASS (with note)

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:85-96` |
| Delivery | `webRequest.onHeadersReceived` callback |
| Policy | `default-src 'self' 'unsafe-inline' 'unsafe-eval' https: file:; img-src 'self' https: file: data:; media-src 'self' https: blob:;` |
| Status | **PASS** (with note) |

**Strengths**:
- Delivered via `webRequest` header injection — robust against DOM manipulation
- Restricts `default-src` to `'self'`
- Explicit `img-src` and `media-src` directives

**Warnings**:
- `'unsafe-inline'` — required by Vue's runtime template compiler; should be removable with pre-compilation
- `'unsafe-eval'` — 4 files reference `eval`/`Function()` in search module; needs audit

---

## 5. Permission Boundaries — ⚠️ WARN

| Attribute | Value |
|-----------|-------|
| Types file | `src/plugin-marketplace/permissions/types.ts:5-13` |
| Manager file | `src/plugin-marketplace/permissions/PermissionManager.ts` |
| Permission types | 7: PROVIDER, DOWNLOAD, LIBRARY, SETTINGS, NETWORK, STORAGE, NOTIFICATION |
| Runtime enforcement | **NOT FOUND** |
| Status | **WARN** |

**Finding**: Permission infrastructure exists (7 types, full CRUD manager, subscriber notifications) but **zero enforcement calls** exist in the plugin lifecycle. `PluginLifecycleManager.enable()` does not call `permissionManager.checkAll()`. `PluginSandboxManager.isolate()` does not verify permissions.

**Risk**: Permission grants are stored but never enforced — any plugin can exercise any capability.

**Fix**: Integrate `permissionManager.checkAll()` into `PluginLifecycleManager.enable()` and API-gating layer.

---

## 6. Provider Isolation — ⚠️ WARN

| Attribute | Value |
|-----------|-------|
| Module | `src/core/provider-sandbox/` |
| Isolation modes | Web Worker (`isolated: true`) or Main Thread (`isolated: false`) |
| Default | **Main thread** (not isolated) |
| Status | **WARN** |

**Finding**: The `WorkerPool` supports genuine Web Worker isolation via `new Worker(url)` with `{ type: 'module' }`. However, `ProviderHost.register()` (line 42-44) explicitly defaults to main-thread mode: `this.pool.registerInThread(provider)`. Comment: "默认使用主线程隔离（兼容 window.app.* 依赖）".

Zero providers currently use Worker isolation because built-in providers (`AppleCMSProvider`, `AnimeCrawlerProvider`) depend on `window.app.*` APIs.

**Risk**: Providers run in the same JS context as the host with full `window.app.*` access (~50 IPC channels).

---

## 7. Plugin Isolation — ⚠️ WARN

| Attribute | Value |
|-----------|-------|
| File | `src/plugin-marketplace/runtime/PluginSandboxManager.ts` |
| Config | `isolated: true`, `maxCpu: 0.5`, `maxMemory: 128MB`, `timeout: 10000ms` |
| Actual isolation | **Logical only** (no Worker/iframe/ShadowRealm) |
| Status | **WARN** |

**Finding**: `PluginSandboxManager.isolate()` only calls `pluginLifecycleManager.getOrCreate(pluginId)` — it registers the plugin in a runtime map. No Web Worker, no iframe, no process boundary is created. Resource metrics in `checkResourceLimits()` are never measured — they're initialized to zero and never updated.

**Risk**: Plugins run in the same JS context as the host application. A buggy or malicious plugin can access the entire renderer state.

**Fix**: Mirror `ProviderSandbox.WorkerPool` pattern — implement actual Web Worker isolation for plugins.

---

## 8. Preload Script — ✅ PASS (with note)

| Attribute | Value |
|-----------|-------|
| File | `electron/preload.ts:41` |
| API | `contextBridge.exposeInMainWorld('app', { ... })` |
| Exposed methods | ~50 named + 1 generic `invoke` pass-through |
| Rate limiting | 3 req/s on search/detail |
| Status | **PASS** (with note) |

**Strengths**:
- Uses `contextBridge.exposeInMainWorld` correctly
- Event listeners return unsubscribe functions
- Rate limiting on search endpoints

**Warning** — Generic `invoke` pass-through (line 43-45):
```typescript
invoke<T>(channel, ...args): Promise<T> {
  return ipcRenderer.invoke(channel, ...args)
}
```
This allows the renderer to call **any** IPC channel, bypassing the whitelist intent of the preload API. An XSS could invoke `SECRETS_DECRYPT`, `STORAGE_EXPORT`, or `DOWNLOAD_EPISODE`.

**Fix**: Remove the generic `invoke` pass-through. Add `event.sender` origin validation in `ipcMain.handle()` handlers.

---

## 9. webSecurity — ❌ FAIL

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:79` |
| Setting | `webSecurity: false` |
| Status | **FAIL** |

Disables Chromium's same-origin policy. This has been documented as a known issue since RC2 (`docs/certification/ELECTRON_SECURITY_REPORT.md:32`, `RELEASE_NOTES.md:138`).

**Rationale**: Video source CORS issues (Bilibili, iQiyi embeds). CSP headers provide partial mitigation.

**Fix path**: Set `webSecurity: true` and use `webRequest.onHeadersReceived` (already in place) to add permissive CORS headers only for specific video source domains.

---

## 10. Remote Module — ✅ PASS

| Attribute | Value |
|-----------|-------|
| `require('electron').remote` | **Not found** |
| `@electron/remote` | **Not found** |
| `enableRemoteModule` | **Not found** |
| Status | **PASS** |

Fully disabled. Confirmed by exhaustive codebase grep.

---

## Additional Security Checks

| Check | File:Line | Status |
|-------|-----------|--------|
| Single instance lock | `main.ts:193` | ✅ PASS |
| Default menu removed | `main.ts:206` | ✅ PASS |
| uncaughtException handler | `main.ts:36-53` | ✅ PASS |
| unhandledRejection handler | `main.ts:60-62` | ✅ PASS |
| No renderer-side Electron imports | `src/**` | ✅ PASS |
| webviewTag enabled | `main.ts:78` | ⚠️ INFO (intentional) |
| Code signing disabled | `package.json:71` | ⚠️ INFO |
| No publish config for auto-update | `package.json` | ⚠️ INFO |

---

## Summary Scorecard

| # | Area | Status | Severity | Deduction |
|---|------|--------|----------|-----------|
| 1 | contextIsolation | ✅ PASS | — | 0 |
| 2 | sandbox | ❌ FAIL | Medium | -5 |
| 3 | nodeIntegration | ✅ PASS | — | 0 |
| 4 | CSP | ✅ PASS (note) | Low | 0 |
| 5 | Permission Boundaries | ⚠️ WARN | Medium | -5 |
| 6 | Provider Isolation | ⚠️ WARN | Medium | -5 |
| 7 | Plugin Isolation | ⚠️ WARN | Medium | -5 |
| 8 | Preload script | ✅ PASS (note) | Medium | -5 |
| 9 | webSecurity | ❌ FAIL | **High** | -10 |
| 10 | Remote module | ✅ PASS | — | 0 |
| **Total** | | | | **70/100** |

---

## RC3 Security Blockers

1. **[HIGH] webSecurity: false** — Must either fix or document as accepted risk with CSP mitigation
2. **[MEDIUM] sandbox not set** — Add `sandbox: true` to webPreferences
3. **[MEDIUM] Preload `invoke` pass-through** — Remove generic channel passthrough
4. **[MEDIUM] Permission enforcement** — Integrate permission checks into plugin lifecycle
5. **[MEDIUM] Provider/Plugin isolation** — Both are logical-only; implement actual Worker boundaries

---

## Certification

```
RC3-B SECURITY AUDIT
Status:   PASS WITH FINDINGS ⚠️
Score:    70/100
Blocker:  1 HIGH (webSecurity) + 4 MEDIUM
Verdict:  CONDITIONAL PASS — webSecurity must be addressed;
          remaining items accepted with documented risk
```
