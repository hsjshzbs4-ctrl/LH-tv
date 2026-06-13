# Startup Baseline — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: BASELINE — Pre-Performance Testing
**Measurement Method**: Manual observation (automated benchmarks in RC2 Performance phase)

---

## Startup Metrics

| Scenario | Target | Measured |
|----------|--------|----------|
| Cold Start (first launch) | < 3s | TBD — RC2 Performance |
| Warm Start (cached) | < 1.5s | TBD — RC2 Performance |
| Renderer Ready | < 2s | TBD — RC2 Performance |
| Main Process Init | < 500ms | TBD — RC2 Performance |

---

## Page Load Metrics

| Page | Lazy Load | Target |
|------|-----------|--------|
| HomeView (`/`) | No (KeepAlive) | < 200ms |
| TVView (`/tv`) | No (KeepAlive) | < 200ms |
| MoviesView (`/movies`) | No (KeepAlive) | < 200ms |
| AnimeView (`/anime`) | No (KeepAlive) | < 200ms |
| SearchView (`/search`) | Yes | < 500ms |
| PlayView (`/play`) | Yes | < 500ms |
| DownloadView (`/downloads`) | Yes | < 500ms |
| LibraryView (`/library`) | Yes | < 500ms |
| MarketplaceHomePage (`/marketplace`) | Yes | < 800ms |
| MarketplaceDetailPage (`/marketplace/plugin/:id`) | Yes | < 500ms |
| DeveloperDashboard (`/developer`) | Yes | < 800ms |

---

## Initialization Sequence

```
1. Electron Main Process Start
2. Window Creation
3. Preload Script Execution
4. Vue App Mount
5. Pinia Store Initialization
6. Router Ready
7. App Config Load (appStore.loadAppConfig)
8. User Data Load (userStore.loadFromStorage)
9. First Render Complete
```

---

## Dependencies Loaded at Startup

| Module | Load Time Contribution |
|--------|----------------------|
| Vue 3.5 + Composition API | Core framework |
| Pinia 3 + Persisted State | State management |
| Vue Router 4.5 | Routing |
| electron-updater | Auto-update check (async) |
| hls.js | Player (lazy) |

---

## Notes

- All baseline measurements are PLACEHOLDER values
- Actual measurements to be captured during RC2 Performance Certification
- Performance test scripts to be developed in `tests/performance/startup/`
- Memory history router (not HTML5 history) — faster for Electron
- 4 routes use KeepAlive caching (home, tv, movies, anime)
