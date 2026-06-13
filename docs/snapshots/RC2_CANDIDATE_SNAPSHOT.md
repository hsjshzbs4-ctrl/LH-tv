# RC2 Candidate Platform Snapshot

**Date**: 2026-06-14
**Version**: LH-TV 2.0 Enterprise Edition
**Status**: FROZEN — RC2 Candidate

---

## Project State

| Metric | Value |
|--------|-------|
| Version | 2.0.0 |
| Phase | RC2 Candidate Freeze |
| Test Files | 66 |
| Test Cases | 488 |
| Pass Rate | 100% |
| Circular Dependencies | 0 |
| TypeCheck | PASS (0 errors) |
| Build | PASS |
| Routes | 24 |

---

## Architecture State

```
应用层 (Application):
  src/features/marketplace/    → Marketplace UI (6 pages + 6 components + 2 services + 3 stores)
  src/views/                   → 12 Views (Home, TV, Movies, Anime, Search, Play, Download, Library, Favorites, History, Settings, User)
  src/stores/                  → 3 Pinia Stores (app, catalog, user)
  src/components/              → 15 Shared Components (layout, cards, common, search, player)
  src/composables/             → 5 Composables (useKeyboard, useScroll, usePlayer, useSearchIndex, useStorageSync)

生态系统层 (Ecosystem):
  developer-platform/          → Developer Portal (6 pages + 7 services + routes)
  src/plugin-marketplace/      → Marketplace Core (7 modules, 18 files)

核心运行时层 (Core Runtime):
  src/core/                    → 14 Core Modules (aggregation, cache, continue-watching, download, favorites, history, monitoring, offline, playback, player, provider-sandbox, provider-sdk, providers, search)
  src/provider-contracts/      → Shared Provider Types (4 files)
  src/provider-host/           → Provider SDK Bridge (2 files)
  src/provider-sdk/            → Provider SDK + Package Format (2 files)
  src/provider-sandbox/        → Worker Isolation (6 files)

共享层 (Shared):
  src/shared/                  → Storage, IPC, Types (14 files)

Electron 层:
  electron/                    → Main Process (38 files: 6 TS + 27 legacy JS + 5 IPC)
```

---

## Metrics

| Category | Count |
|----------|-------|
| Total TypeScript/Vue Files | 202 |
| Build Artifacts | 83 files (2.9 MB) |
| Core Modules | 14 |
| Marketplace Modules | 7 |
| Developer Platform Services | 7 (accounts, publishing, repository, review, analytics, notifications, routes) |
| Views | 12 |
| Components | 15 |
| Pinia Stores | 3 |
| Composables | 5 |
| Shared Types Files | 14 |
| Provider Contracts | 4 |
| Electron Main Files | 38 |

---

## Feature Inventory

See: [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md)

## Route Map

See: [ROUTES_SNAPSHOT.md](./ROUTES_SNAPSHOT.md)

## Architecture Detail

See: [ARCHITECTURE_SNAPSHOT.md](./ARCHITECTURE_SNAPSHOT.md)

## Dependencies

See: [DEPENDENCY_SNAPSHOT.md](./DEPENDENCY_SNAPSHOT.md)

## Test Coverage

See: [TEST_SNAPSHOT.md](./TEST_SNAPSHOT.md)

## Build Metrics

See: [BUILD_SNAPSHOT.md](./BUILD_SNAPSHOT.md)

## Marketplace State

See: [MARKETPLACE_SNAPSHOT.md](./MARKETPLACE_SNAPSHOT.md)

## Developer Platform State

See: [DEVELOPER_PLATFORM_SNAPSHOT.md](./DEVELOPER_PLATFORM_SNAPSHOT.md)

---

## Validation Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ PASS (0 errors) |
| `npm run build` | ✅ PASS |
| `npx vitest run` | ✅ 66/66 files, 488/488 tests |
| `npx madge --circular src` | ✅ 0 circular dependencies |

---

## RC2 Freeze Rules

See: [RC2_FREEZE.md](../architecture/RC2_FREEZE.md)

No feature work. No refactors. No architecture changes.
Only benchmarking, testing, and certification allowed.
