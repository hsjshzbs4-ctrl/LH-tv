# Architecture Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  Views (12) │ Components (15) │ Stores (3) │ Composables (5) │
│  Marketplace UI (17 files) │ Developer Portal Pages (6)       │
├─────────────────────────────────────────────────────────────┤
│                     ECOSYSTEM LAYER                          │
│  Plugin Marketplace Core (18 files)                          │
│  Developer Platform Services (7 modules)                     │
├─────────────────────────────────────────────────────────────┤
│                     CORE RUNTIME LAYER                       │
│  Core Modules (14): aggregation, cache, continue-watching,   │
│  download, favorites, history, monitoring, offline,          │
│  playback, player, provider-sandbox, provider-sdk,           │
│  providers, search                                           │
├─────────────────────────────────────────────────────────────┤
│                     PROVIDER LAYER                           │
│  Provider Contracts (4) │ Provider Host (2) │ Provider SDK (2)│
│  Provider Sandbox (6)                                       │
├─────────────────────────────────────────────────────────────┤
│                     SHARED LAYER                             │
│  Storage (3) │ IPC (2) │ Types (8)                           │
├─────────────────────────────────────────────────────────────┤
│                     ELECTRON LAYER                           │
│  Main Process (6 TS) │ Preload │ IPC Bridge │ Legacy (27 JS) │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Layer Detail

```
src/provider-contracts/     (4 files)
├── index.ts                — Re-exports
├── provider.interface.ts   — IProvider interface
├── media.types.ts          — MediaItem, MediaSource, Episode types
└── manifest.types.ts       — ProviderManifest type

src/provider-host/          (2 files)
├── index.ts
└── ProviderHostFacade.ts   — SDK → Registry bridge

src/provider-sdk/           (2 files, in src/core/provider-sdk/)
├── package/
│   ├── package-format.ts   — .lhtv-plugin format definition
│   └── package-builder.ts  — Package builder utility
```

---

## Core Runtime Layer Detail

### src/core/ (14 modules, 80 files)

| Module | Files | Description |
|--------|-------|-------------|
| `aggregation/` | 6 | Multi-source aggregation engine, ranking, health |
| `cache/` | 6 | Cache manager, memory/disk stores, TTL strategy |
| `continue-watching/` | 4 | Continue watching tracking (Facade pattern) |
| `download/` | 8 | Download manager, queue, persistence, recovery |
| `favorites/` | 4 | Favorites management (Facade pattern) |
| `history/` | 4 | Watch history tracking (Facade pattern) |
| `monitoring/` | 8 | Metrics, provider/playback/download dashboards |
| `offline/` | 4 | Offline library management (Facade pattern) |
| `playback/` | 4 | Source switching, playback orchestration |
| `player/` | 7 | Player engine + MP4/HLS adapters |
| `provider-sandbox/` | 6 | Worker isolation for third-party providers |
| `provider-sdk/` | 6 | Provider SDK facade, loader, manifest, validator |
| `providers/` | 8 | Base provider, AppleCMS, AnimeCrawler, registry |
| `search/` | 5 | Search facade, cache, manager |

### Architecture Pattern

All user-facing modules follow:
```
View → Facade → Manager → StorageService
```

---

## Marketplace Layer Detail

### src/plugin-marketplace/ (7 modules, 18 files)

| Module | Files | Description |
|--------|-------|-------------|
| `repository/` | 3 | PluginRepository, RepositoryClient, types |
| `installer/` | 2 | PluginInstaller (install+rollback), PluginUninstaller |
| `runtime/` | 3 | PluginLifecycleManager (state machine), PluginSandboxManager |
| `permissions/` | 2 | PermissionManager (7 permission types) |
| `signatures/` | 3 | PluginVerifier, SignatureStore |
| `updates/` | 2 | PluginUpdateManager |
| `storage/` | 2 | PluginStorage (local persistence) |

### src/features/marketplace/ (17 files)

| Category | Files | Description |
|----------|-------|-------------|
| Pages | 6 | Home, Detail, Installed, Updates, Permissions, Developer Tools |
| Components | 6 | PluginCard, PluginGrid, PermissionBadge, RiskBadge, UpdateProgress, RuntimeStatus |
| Stores | 3 | marketplace, installed-plugins, permissions (Pinia) |
| Services | 2 | MarketplaceService, InstalledPluginService |
| Routes | 1 | 6 route definitions |

---

## Developer Platform Layer Detail

### developer-platform/ (8 modules, 15 files)

| Module | Files | Description |
|--------|-------|-------------|
| `accounts/` | 1 | DeveloperAccountManager (4 roles) |
| `publishing/` | 1 | PluginSubmissionService |
| `repository-server/` | 1 | PluginRegistry |
| `review/` | 1 | PluginReviewService (security scanning) |
| `analytics/` | 1 | PluginAnalyticsService |
| `notifications/` | 1 | NotificationService |
| `shared/` | 1 | Shared types |
| `portal/pages/` | 6 | Dashboard, Publish, My Plugins, Analytics, Review, Account |
| `routes/` | 1 | 6 route definitions |

---

## Dependency Direction

```
Views/Pages
    ↓
Facades / Services
    ↓
Managers / Core Modules
    ↓
Shared (Types, Storage, IPC)
```

**Key Rules**:
- Views NEVER call `window.app.xxx()` directly
- Views NEVER access `localStorage` directly
- Provider communication via DI-injected ProviderFacade
- All plugins loaded through Plugin Marketplace lifecycle
- 0 circular dependencies enforced by madge gate

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 34 |
| UI Framework | Vue 3.5 + Composition API |
| State | Pinia 3 + persistedstate plugin |
| Router | Vue Router 4.5 (Memory History) |
| Language | TypeScript 5.7 |
| Build | electron-vite (Vite 5) |
| Testing | Vitest 4.1 + jsdom + @vue/test-utils |
| Package | electron-builder 25 |
| Player | hls.js 1.5 |
| Updates | electron-updater 6.3 |
