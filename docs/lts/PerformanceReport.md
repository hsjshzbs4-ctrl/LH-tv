# Performance Report — Sprint #1

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`

---

## 1. Build Output Analysis

### Bundle Sizes (raw, uncompressed)

| Target | Size |
|--------|------|
| **Main** (SSR) | 39.52 kB |
| **Preload** (SSR) | 11.25 kB |
| **Renderer Total** | ~1.94 MB |

### Renderer — Top 10 Largest Chunks

| Chunk | Size | % of Total |
|-------|------|-----------|
| PlaybackFacade | 1,138.09 kB | 58.6% |
| index (vendor) | 465.09 kB | 23.9% |
| PlayerPage | 41.99 kB | 2.2% |
| SettingsView | 36.76 kB | 1.9% |
| PlayView | 26.27 kB | 1.4% |
| LibraryView | 16.98 kB | 0.9% |
| DownloadFacade | 14.38 kB | 0.7% |
| DownloadView | 12.30 kB | 0.6% |
| InstalledPluginService | 11.85 kB | 0.6% |
| MonitoringFacade | 11.67 kB | 0.6% |

### Renderer — CSS

| Total CSS | 17.59 kB (index) + ~55 kB (page chunks) |
|-----------|------------------------------------------|

---

## 2. Key Observations

### PlaybackFacade (1,138 kB = 58.6%)

This is the single largest chunk, likely containing:
- HLS.js (hls.js ^1.5.17 → ~300 kB gzipped)
- Video player logic
- Playback state management

**Optimization potential**: Already lazy-loaded (separate chunk). No action required.

### Vendor Bundle (465.09 kB)

Contains shared dependencies:
- Vue 3.5.x (~130 kB)
- Vue Router (~40 kB)
- Pinia (~20 kB)
- electron-updater
- Other shared utilities

**Optimization potential**: Consider tree-shaking review for unused vendor exports.

### Good Patterns Observed

- ✅ **Lazy Loading**: Each page is a separate chunk (HomePage, SearchPage, DetailPage, etc.)
- ✅ **Code Splitting**: Facades and services are split into dedicated chunks
- ✅ **CSS Code Splitting**: Each page has its own CSS file
- ✅ **No massive monolithic bundle**: Largest single page chunk (PlayerPage) is only 42 kB

---

## 3. Startup Analysis

### Main Process (39.52 kB)

- Bootstrap, IPC bridge, runtime recovery
- Tiny footprint → fast startup

### Preload (11.25 kB)

- Minimal API surface exposed to renderer
- Very lean

### Renderer Entry (5.35 kB index.js)

- Small entry point
- Lazy-loads pages on demand

---

## 4. Lazy Import Audit

### Dynamic Imports Detected

| File | Dynamically Imported By |
|------|------------------------|
| `electron/ipc/bridge.ts` | `electron/services/updater.service.ts` |

**Note**: bridge.ts is also statically imported by `main.ts` and `shutdownManager.ts`. The build warning indicates this module does NOT get split into a separate chunk. This is expected behavior — the static imports take precedence.

### Current Lazy/Dynamic Split Strategy

The frontend already uses Vue Router lazy loading (all pages are separate chunks), which is the recommended pattern.

---

## 5. Memory Footprint (Estimated)

| Component | Estimated Memory |
|-----------|-----------------|
| Electron Shell | ~50-80 MB |
| Renderer (Vue app) | ~30-50 MB |
| HLS.js player | ~10-20 MB (active playback) |
| **Idle Total** | ~80-130 MB |
| **Playback Total** | ~90-150 MB |

> Note: These are estimates based on typical Electron + Vue + HLS.js stacks. Actual measurement requires runtime profiling.

---

## 6. Recommendations

### P2 — Medium Priority
- [ ] Review vendor bundle (465 kB) for unused dependencies via bundle analyzer
- [ ] Verify HLS.js tree-shaking — ensure unused features (e.g., subtitle rendering if unused) are excluded

### P3 — Low Priority
- [ ] Add runtime performance instrumentation (startup timing, FCP, TTI)
- [ ] Profile memory during long playback sessions (>2 hours)
- [ ] Evaluate `electron-vite` 3.x → 4.x (minor upgrade path)

---

## 7. No-Change Items

Per LTS policy, the following are NOT touched:

- ❌ No architecture changes
- ❌ No lazy loading strategy changes (already optimal)
- ❌ No build system migration
- ❌ No renderer framework changes
