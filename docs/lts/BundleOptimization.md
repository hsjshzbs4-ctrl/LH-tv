# Bundle Optimization — Sprint #2

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`

---

## 1. Current Bundle Profile

| Bundle | Size | Status |
|--------|------|--------|
| Main (SSR) | 39.52 kB | ✅ Optimal |
| Preload (SSR) | 11.25 kB | ✅ Optimal |
| Renderer Total | ~1.94 MB | ✅ Good |

### Renderer Top 5 Chunks

| Chunk | Size | Share | Load |
|-------|------|-------|------|
| PlaybackFacade | 1,138 kB | 58.6% | Lazy (only on play) |
| index (vendor) | 465 kB | 23.9% | Initial |
| PlayerPage | 42 kB | 2.2% | Lazy |
| SettingsView | 37 kB | 1.9% | Lazy |
| PlayView | 26 kB | 1.4% | Lazy |

---

## 2. Already Optimal Patterns

### ✅ Route-Level Code Splitting
All 16+ routes use dynamic `() => import(...)`. Each page is a separate chunk.

### ✅ Facade Pattern
PlaybackFacade isolates the heavy HLS.js dependency. Only loaded when user navigates to `/play` or `/player/:id`.

### ✅ CSS Code Splitting
Each page has its own CSS file. No monolithic stylesheet.

### ✅ Small Entry Point
`index.js` (entry) is only 5.35 kB. The heavy vendor dependencies are in a separate chunk (465 kB).

---

## 3. Sprint #2 Optimizations Applied

### Dead Import Cleanup
- Removed `fetchJson`, `fetchText` from `electron/utils/http-client.ts`
- Removed 10 unused config constants from `electron/utils/config.ts`
- Removed `rollup-plugin-visualizer` from devDependencies (was unused after config revert)

### Config File Slimming
`electron/utils/config.ts`: ~117 lines → ~49 lines (58% reduction)

---

## 4. No-Change Items

### AI Module (Frozen)
AI components (`AIAssistantButton`, `AIChatPanel`) are statically imported in `App.vue`. They could be lazy-loaded behind the `pb5.ai` feature flag, but this would require changing the initialization timing in `onMounted`. Per LTS policy, no Frozen Zone behavior changes are allowed.

### SearchPanel
Statically imported in `App.vue` for instant response to `Ctrl+K`. Converting to lazy would add 50-100ms latency to first open — poor UX for a keyboard shortcut feature.

### Toast
Already small (~1 kB). Static import is correct.

---

## 5. Vendor Bundle Composition (Estimated)

| Library | Approx Size | Notes |
|---------|------------|-------|
| Vue 3.5 | ~130 kB | Core framework |
| Vue Router | ~40 kB | Routing |
| Pinia + Plugin | ~20 kB | State management |
| electron-updater | ~30 kB | Auto-update |
| Shared utilities | ~50 kB | IPC, storage, etc. |
| Other (styles, etc.) | ~195 kB | CSS, platform shims |
| **Total** | **~465 kB** | |

---

## 6. Recommendations

### P3 — Future Sprint
- [ ] Audit vendor chunk for tree-shaking opportunities
- [ ] Evaluate if `electron-updater` can be lazy-loaded (only needed during update check)
- [ ] Check for duplicate dependencies between chunks via bundle analyzer

### No Action
- PlaybackFacade (HLS.js) — already optimally lazy-loaded
- AI module imports — Frozen Zone, no changes allowed
- Route splitting — already optimal
