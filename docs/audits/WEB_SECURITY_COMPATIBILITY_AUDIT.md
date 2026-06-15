# Web Security Compatibility Audit

> LH-TV 2.x | Date: 2026-06-15 | Audit: webSecurity=true Compatibility | Branch: release/rc2-candidate

---

## Audit Result: **webSecurity=true is NOT SAFE** ❌

**Blocked by**: HLS video playback (PATH 8)

---

## Current State

| Attribute | Value |
|-----------|-------|
| File | `electron/main.ts:79` |
| Current | `webSecurity: false` |
| Reason | CORS for cross-origin video CDN requests |
| CSP mitigation | Active (`webRequest.onHeadersReceived` at lines 85-96) |

---

## Architecture: Network Access Tiers

| Tier | Process | webSecurity Impact |
|------|---------|-------------------|
| Main process (Node.js `http`/`https`) | `electron/shared-legacy/*.js` | **NOT affected** |
| Main process (Puppeteer) | `poster-fetcher.js`, `video-scraper.js` | **NOT affected** |
| Renderer (Chromium `fetch`/XHR/`<video>`) | `src/`, `player-core.js` | **AFFECTED** |

---

## Path-by-Path Analysis

### 1. AppleCMS API Calls — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/http-client.js`, `api-client.js`, `search-ipc.js`, `catalog-ipc.js` |
| Domains | `guangsuapi.com`, `360zy.com`, `lziapi.com`, `feisuzyapi.com` |
| Transport | Node.js `https` module (main process) |
| webSecurity Impact | **None** — main process only |

### 2. Bilibili API Calls — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/bilibili-scraper.js` |
| Domains | `api.bilibili.com` |
| Transport | Node.js `https` (main process) |
| webSecurity Impact | **None** |

### 3. Poster Image Fetching — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/poster-fetcher.js` |
| Paths | Puppeteer → Bing/Douban/TencentVideo → `downloadToLocal()` (Node.js `https`) |
| Poster display | `<img src="file:///...">` (local files) or `<img>` (CORS-exempt) |
| webSecurity Impact | **None** |

### 4. Anime Scrapers — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/anime-scraper.js`, `tiantian-scraper.js` |
| Domains | `yinghuadongman.com.cn`, `tiantiandongman.com` |
| Transport | Node.js `https` via `http-client.js` (main process) |
| webSecurity Impact | **None** |

### 5. Video Scraper (DuckDuckGo) — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/video-scraper.js` |
| Transport | Puppeteer with `--disable-web-security` flag |
| webSecurity Impact | **None** — separate browser instance |

### 6. Downloader — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/downloader.js` |
| Transport | Node.js `https`/`http` streaming (main process) |
| webSecurity Impact | **None** |

### 7. Catalog Auto-Update — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `shared-legacy/show-catalog.js` |
| Transport | Node.js `https` via `api.httpGet()` (main process) |
| webSecurity Impact | **None** |

### 8. HLS Video Playback — ❌ FAIL

| Attribute | Value |
|-----------|-------|
| Files | `src/core/player/PlayerEngine.ts`, `src/core/player/adapters/HLSAdapter.ts`, `src/views/PlayView.vue` |
| Library | hls.js (`enableWorker: true`) |
| Transport | `XMLHttpRequest` from **renderer process** |
| Domains | **Arbitrary** — m3u8 URLs from AppleCMS CDNs (e.g., `gsyun.com`, third-party streaming CDNs) |
| CORS | hls.js XHRs require `Access-Control-Allow-Origin` response headers |
| webSecurity Impact | **BLOCKS PLAYBACK** — CDNs may not return CORS headers |

**This is the PRIMARY BLOCKER.** Low-cost Chinese video CDNs used by AppleCMS providers often do not return CORS headers. With `webSecurity: true`, hls.js cannot load m3u8 manifests and TS segments.

### 9. Direct Video Playback — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `src/components/player/VideoPlayer.vue` |
| Transport | `<video src="...">` — "no-cors" mode by default |
| webSecurity Impact | **Minimal** — playback works; canvas access would be blocked |

### 10. Poster Image Display — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `src/components/cards/PosterCard.vue` |
| Transport | `<img src="...">` — CORS-exempt |
| webSecurity Impact | **None** |

### 11. Iframe Embeds — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `FALLBACK_SOURCES` in config, bilibili-scraper.js |
| Sources | `player.bilibili.com`, `v.qq.com`, `youku.com`, `dailymotion.com`, `youtube.com` |
| Transport | `<iframe src="...">` — separate security context |
| webSecurity Impact | **None** — not subject to parent webSecurity |

### 12. Webview Embeds — NEUTRAL ✅

| Attribute | Value |
|-----------|-------|
| Files | `electron/utils/config.ts` (FALLBACK_SOURCES `type: 'webview'`) |
| Sources | `search.bilibili.com`, `so.iqiyi.com`, `v.qq.com` |
| Transport | `<webview src="...">` — separate renderer process |
| webSecurity Impact | **None** — separate BrowserWindow, own webSecurity |

### 13-15. Content Ecosystem / Providers — NEUTRAL ✅

| Path | Status |
|------|--------|
| Metadata providers (TMDB/Bangumi/TVMaze) | Dormant code — would work with webSecurity=true (these APIs return CORS headers) |
| Media server integrations | Dormant code — not wired into running app |
| Core providers (AppleCMS/AnimeCrawler) | Go through IPC → main process, not affected |

---

## Verdict: CANNOT SWITCH TO webSecurity=true

| # | Path | Verdict |
|---|------|---------|
| 1-7 | Main process HTTP | Not affected |
| **8** | **HLS video playback** | **FAIL — BLOCKER** |
| 9-12 | Direct video / images / iframes / webviews | Not affected |
| 13-15 | Content ecosystem / providers | Not affected |

**Primary blocker**: hls.js makes cross-origin XHR requests from the renderer to arbitrary CDN domains that may not return CORS headers.

### Mitigation Options (future work)

1. **Local proxy server** — Main process runs a local HTTP proxy; renderer rewrites m3u8 URLs to `http://127.0.0.1:<port>/proxy?url=...`; proxy forwards requests adding CORS headers
2. **Custom protocol handler** — `protocol.handle('lh-media', ...)` to proxy media requests through the main process
3. **Service worker** — Register a service worker that intercepts media requests and proxies them

All options require significant engineering and are out of scope for RC3.1.

---

## Decision

```
webSecurity=true:  NOT SAFE for RC3.1
Reason:            HLS video playback blocked by CORS
Mitigation:        CSP via webRequest.onHeadersReceived (already in place)
Status:            webSecurity=false temporarily retained
Exception:         Formally documented — see WEB_SECURITY_EXCEPTION.md
```
