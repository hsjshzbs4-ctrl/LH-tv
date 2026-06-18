# Performance Optimization — Sprint #2

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`

---

## 1. Startup Performance

### Main Process (39.52 kB)
- Bootstrap, IPC bridge, runtime recovery
- Startup path: `main.ts` → config → IPC → window creation
- **Estimated startup**: ~200-400ms (cold), ~100-200ms (warm)

### Preload (11.25 kB)
- Minimal API surface
- **Estimated load**: <50ms

### Renderer (5.35 kB entry + 465 kB vendor)
- Vue app mount
- Pinia store initialization
- Provider host initialization
- **Estimated time-to-interactive**: ~500-800ms

### Overall Cold Startup
```
Electron boot:    ~500ms
Main process:     ~300ms
Renderer load:    ~800ms
Total (cold):     ~1.6s
Total (warm):     ~0.5s (cached binaries)
```

---

## 2. Sprint #2 Optimizations

### Code Size Reduction
| File | Before | After | Savings |
|------|--------|-------|---------|
| `electron/utils/config.ts` | ~117 lines | ~49 lines | 58% |
| `electron/utils/http-client.ts` | ~67 lines | ~52 lines | 22% |

### Dependency Cleanup
| Action | Packages Removed |
|--------|-----------------|
| `npm uninstall rollup-plugin-visualizer` | 24 packages |
| `npm audit fix` (form-data, glob) | Updated 4 packages |

### Runtime Impact
- **Main process**: Smaller config file = marginally faster parse (negligible in practice)
- **Renderer**: Unchanged (config.ts is main-process only)
- **node_modules**: 24 fewer packages = slightly faster `npm install`

---

## 3. Already Optimal Patterns

### ✅ Lazy Loading
All 16+ routes use dynamic imports. Heavy chunks (PlaybackFacade at 1.1 MB) are loaded only on playback.

### ✅ Memory History
`createMemoryHistory()` is used instead of web history — avoids unnecessary URL processing in Electron.

### ✅ Keep-Alive
Frequently visited routes (home, TV, movies, anime) use `keepAlive: true` to avoid re-mounting.

### ✅ Async Initialization
App startup uses `Promise.all()` for parallel initialization of config, user data, and providers.

---

## 4. Performance Anti-Patterns (Not Found)

- ❌ No synchronous file I/O in renderer
- ❌ No blocking operations in main process during startup
- ❌ No monolithic bundle (all routes split)
- ❌ No duplicate large dependencies across chunks

---

## 5. Recommendations

### P2 — Medium Priority
- [ ] Add startup timing instrumentation (`performance.mark` / `performance.measure`)
- [ ] Measure and document actual TTI (Time to Interactive) on target hardware
- [ ] Profile memory during 2+ hour playback sessions

### P3 — Low Priority
- [ ] Evaluate `electron-updater` lazy loading (saves ~30 kB from main chunk)
- [ ] Consider `vite-plugin-compression` for gzip/brotli pre-compression
- [ ] Tree-shaking audit on vendor bundle

### No Action
- Architecture changes (Frozen Zone)
- Build system migration (electron-vite 5.x is Major → blocked)
- Framework-level optimizations (risk of breaking change)
