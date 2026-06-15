# Web Security Exception — RC3 Approved Exception

> LH-TV 2.x | Date: 2026-06-15 | Status: APPROVED EXCEPTION | RC3-B Item #9

---

## Exception

`webSecurity: false` is retained for RC3. This is an approved exception with documented justification and mitigation.

---

## Justification

### Root Cause

The primary video playback mechanism (AppleCMS → m3u8 CDN → hls.js) requires cross-origin XHR from the renderer process. The m3u8 manifest and TS segment URLs returned by AppleCMS providers point to arbitrary third-party Chinese CDNs (e.g., `gsyun.com`) that do NOT return CORS headers (`Access-Control-Allow-Origin`).

Full compatibility audit: `docs/audits/WEB_SECURITY_COMPATIBILITY_AUDIT.md`

### Impact of switching to webSecurity=true

- **HLS video playback (PATH 8)**: BROKEN — hls.js cannot load manifests/segments
- **All other paths (1-7, 9-15)**: NOT affected — either main process Node.js, Puppeteer, or CORS-exempt browser APIs

### Why the fix is non-trivial

All three mitigation strategies require a local proxy architecture:
1. Local HTTP proxy server in main process
2. Custom Electron protocol handler for media requests  
3. Service worker interception

Each requires: URL rewriting in the renderer, proxy logic in main process, CORS header injection, error handling for CDN failures, and full regression testing of video playback across all AppleCMS providers. Estimated effort: 3-5 days of engineering. Out of scope for RC3.1 stabilization sprint.

---

## Mitigation (Already Active)

### 1. Content Security Policy

File: `electron/main.ts:85-96`

```
default-src 'self' 'unsafe-inline' 'unsafe-eval' https: file:;
img-src 'self' https: file: data:;
media-src 'self' https: blob:;
```

Delivered via `webRequest.onHeadersReceived` callback — robust against DOM manipulation. Restricts resource loading to `'self'`, HTTPS, and `file:` origins.

### 2. contextIsolation + nodeIntegration:false

File: `electron/main.ts:76-77`

Renderer has no direct access to Node.js or Electron APIs. All privileged operations go through `contextBridge` whitelist.

### 3. Preload API Whitelist

File: `electron/preload.ts:41`

~50 named methods exposed via `contextBridge` (not raw `ipcRenderer`). Rate limiting on search/detail (3 req/s).

### 4. HTTP Link Validation

File: `electron/main.ts:127-129`

`OPEN_EXTERNAL` validates URLs with `/^https?:\/\//i` regex before `shell.openExternal()`.

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Cross-origin data access by renderer | Medium | CSP + contextIsolation + whitelisted preload |
| XSS via compromised content source | Low | CSP `default-src 'self'` restricts script sources |
| Malicious iframe/webview content | Low | Separate renderer processes, isolated from main window |

---

## Resolution Plan

| Phase | Action |
|-------|--------|
| RC3.1 | Retain `webSecurity: false` with documented exception |
| RC4 / CE10 | Implement local proxy architecture for media requests |
| RC4 / CE10 | Switch to `webSecurity: true` after proxy validation |
| RC4 / CE10 | Tighten CSP to remove `'unsafe-eval'` |

---

## Sign-off

```
Exception:    webSecurity=false
Audit:        RC3-B Security Audit Item #9
Status:       APPROVED EXCEPTION
Justification: HLS video playback blocked by CORS on third-party CDNs
Mitigation:   CSP + contextIsolation + nodeIntegration:false + preload whitelist
Resolution:   Local proxy architecture planned for RC4/CE10
```
