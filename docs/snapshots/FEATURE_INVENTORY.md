# Feature Inventory — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN

---

## 1. Core Platform (P0 Foundation)

| Feature | Module | Status |
|---------|--------|--------|
| App Layout (TitleBar + Sidebar + Content) | `src/components/layout/` | ✅ |
| Global Keyboard Shortcuts | `src/composables/useKeyboard.ts` | ✅ |
| Scroll Management | `src/composables/useScroll.ts` | ✅ |
| Pinia State Management | `src/stores/` (app, catalog, user) | ✅ |
| Pinia Persistence Plugin | `pinia-plugin-persistedstate` | ✅ |
| Vue Router (Memory History) | `src/router/` | ✅ |
| CSS Design System (variables + reset + transitions + utilities) | `src/styles/` | ✅ |
| Shared Types (common, video, catalog, search, player, cache, ipc, user) | `src/shared/types/` | ✅ |
| Shared Storage Service | `src/shared/storage/` | ✅ |
| Shared IPC Channels | `src/shared/ipc/` | ✅ |
| Toast Notifications | `src/components/common/Toast.vue` | ✅ |
| Loading Spinner | `src/components/common/LoadingSpinner.vue` | ✅ |
| Error State | `src/components/common/ErrorState.vue` | ✅ |
| Empty State | `src/components/common/EmptyState.vue` | ✅ |
| Scroll Row Component | `src/components/common/ScrollRow.vue` | ✅ |
| Poster Card | `src/components/cards/PosterCard.vue` | ✅ |
| Show Card | `src/components/cards/ShowCard.vue` | ✅ |
| Skeleton Card | `src/components/cards/SkeletonCard.vue` | ✅ |
| Search Panel (overlay) | `src/components/search/SearchPanel.vue` | ✅ |
| Video Player | `src/components/player/VideoPlayer.vue` | ✅ |
| Episode Grid | `src/components/player/EpisodeGrid.vue` | ✅ |
| Source Switcher | `src/components/player/SourceSwitcher.vue` | ✅ |

---

## 2. Provider Hub (P1)

| Feature | Module | Status |
|---------|--------|--------|
| Base Provider Class | `src/core/providers/base/BaseProvider.ts` | ✅ |
| Apple CMS Provider | `src/core/providers/providers/AppleCMSProvider.ts` | ✅ |
| Anime Crawler Provider | `src/core/providers/providers/AnimeCrawlerProvider.ts` | ✅ |
| Provider Registry | `src/core/providers/registry/` | ✅ |
| Provider Types | `src/core/providers/types/` | ✅ |
| Provider Contracts (shared) | `src/provider-contracts/` (4 files) | ✅ |
| Provider Host (SDK Bridge) | `src/provider-host/` (2 files) | ✅ |

---

## 3. Download System (P2)

| Feature | Module | Status |
|---------|--------|--------|
| Download Manager | `src/core/download/manager/DownloadManager.ts` | ✅ |
| Download Facade | `src/core/download/facade/DownloadFacade.ts` | ✅ |
| Download Queue | `src/core/download/queue/DownloadQueue.ts` | ✅ |
| Task Scheduler | `src/core/download/queue/TaskScheduler.ts` | ✅ |
| Persistence Manager | `src/core/download/persistence/DownloadPersistenceManager.ts` | ✅ |
| Recovery Manager | `src/core/download/recovery/RecoveryManager.ts` | ✅ |
| Download Types | `src/core/download/types/download.types.ts` | ✅ |
| Download View | `src/views/DownloadView.vue` | ✅ |

---

## 4. User Layer (P3)

| Feature | Module | Status |
|---------|--------|--------|
| Favorites Manager | `src/core/favorites/manager/FavoritesManager.ts` | ✅ |
| Favorites Facade | `src/core/favorites/facade/FavoritesFacade.ts` | ✅ |
| History Manager | `src/core/history/manager/HistoryManager.ts` | ✅ |
| History Facade | `src/core/history/facade/HistoryFacade.ts` | ✅ |
| Continue Watching Manager | `src/core/continue-watching/manager/ContinueWatchingManager.ts` | ✅ |
| Continue Watching Facade | `src/core/continue-watching/facade/ContinueWatchingFacade.ts` | ✅ |
| Offline Library Manager | `src/core/offline/manager/OfflineLibraryManager.ts` | ✅ |
| Offline Library Facade | `src/core/offline/facade/OfflineLibraryFacade.ts` | ✅ |
| Cache Manager | `src/core/cache/CacheManager.ts` | ✅ |
| Memory Store | `src/core/cache/stores/MemoryStore.ts` | ✅ |
| Disk Store | `src/core/cache/stores/DiskStore.ts` | ✅ |
| TTL Strategy | `src/core/cache/strategies/TTLStrategy.ts` | ✅ |
| User View | `src/views/UserView.vue` | ✅ |
| Favorites View | `src/views/FavoritesView.vue` | ✅ |
| History View | `src/views/HistoryView.vue` | ✅ |
| Library View | `src/views/LibraryView.vue` | ✅ |

---

## 5. Unified Search (P3.4)

| Feature | Module | Status |
|---------|--------|--------|
| Search Facade | `src/core/search/facade/SearchFacade.ts` | ✅ |
| Search Cache | `src/core/search/cache/SearchCache.ts` | ✅ |
| Search Index (composable) | `src/composables/useSearchIndex.ts` | ✅ |
| Search Types | `src/shared/types/search.types.ts` | ✅ |

---

## 6. Multi-Source Platform (P4)

### 6.1 Aggregation Engine

| Feature | Module | Status |
|---------|--------|--------|
| Aggregation Engine | `src/core/aggregation/engine/` | ✅ |
| Aggregation Facade | `src/core/aggregation/facade/` | ✅ |
| Aggregation Types | `src/core/aggregation/types/` | ✅ |
| Provider Ranker | `src/core/aggregation/ranking/ProviderRanker.ts` | ✅ |
| Provider Health Manager | `src/core/aggregation/health/` | ✅ |

### 6.2 Intelligent Source Switching (P4.2)

| Feature | Module | Status |
|---------|--------|--------|
| Source Switch Manager | `src/core/playback/manager/` | ✅ |
| Playback Facade | `src/core/playback/facade/` | ✅ |
| Playback Types | `src/core/playback/types/` | ✅ |

### 6.3 Provider SDK (P4.3)

| Feature | Module | Status |
|---------|--------|--------|
| SDK Facade | `src/core/provider-sdk/facade/` | ✅ |
| SDK Loader | `src/core/provider-sdk/loader/` | ✅ |
| SDK Manifest | `src/core/provider-sdk/manifest/` | ✅ |
| SDK Validator | `src/core/provider-sdk/validator/` | ✅ |
| SDK Types | `src/core/provider-sdk/types/` | ✅ |

### 6.4 Provider Sandbox (P4.4)

| Feature | Module | Status |
|---------|--------|--------|
| Sandbox Facade | `src/core/provider-sandbox/facade/` | ✅ |
| Sandbox Host | `src/core/provider-sandbox/host/` | ✅ |
| Sandbox Pool | `src/core/provider-sandbox/pool/` | ✅ |
| Sandbox Worker | `src/core/provider-sandbox/worker/` | ✅ |
| Sandbox Types | `src/core/provider-sandbox/types/` | ✅ |

### 6.5 Monitoring Center (P4.5)

| Feature | Module | Status |
|---------|--------|--------|
| Monitoring Facade | `src/core/monitoring/facade/` | ✅ |
| Metrics Collector | `src/core/monitoring/metrics/` | ✅ |
| Provider Monitoring | `src/core/monitoring/providers/` | ✅ |
| Playback Monitoring | `src/core/monitoring/playback/` | ✅ |
| Download Monitoring | `src/core/monitoring/downloads/` | ✅ |
| Monitoring Dashboard | `src/core/monitoring/dashboard/` | ✅ |
| Monitoring Types | `src/core/monitoring/types/` | ✅ |

### 6.6 Player Engine

| Feature | Module | Status |
|---------|--------|--------|
| Player Engine | `src/core/player/PlayerEngine.ts` | ✅ |
| Base Adapter | `src/core/player/adapters/BaseAdapter.ts` | ✅ |
| MP4 Adapter | `src/core/player/adapters/MP4Adapter.ts` | ✅ |
| HLS Adapter | `src/core/player/adapters/HLSAdapter.ts` | ✅ |
| Player Types | `src/core/player/types/` | ✅ |
| Video Player (UI) | `src/components/player/VideoPlayer.vue` | ✅ |

---

## 7. Marketplace (P5.1 + P5.2)

### 7.1 Marketplace Core (P5.1)

| Feature | Module | Status |
|---------|--------|--------|
| Plugin Repository | `src/plugin-marketplace/repository/` | ✅ |
| Plugin Installer | `src/plugin-marketplace/installer/` | ✅ |
| Plugin Lifecycle Manager | `src/plugin-marketplace/runtime/` | ✅ |
| Permission Manager (7 types) | `src/plugin-marketplace/permissions/` | ✅ |
| Plugin Verifier (signatures) | `src/plugin-marketplace/signatures/` | ✅ |
| Plugin Update Manager | `src/plugin-marketplace/updates/` | ✅ |
| Plugin Storage | `src/plugin-marketplace/storage/` | ✅ |

### 7.2 Marketplace UI (P5.2)

| Feature | Module | Status |
|---------|--------|--------|
| Marketplace Home Page | `src/features/marketplace/pages/MarketplaceHomePage.vue` | ✅ |
| Plugin Detail Page | `src/features/marketplace/pages/MarketplaceDetailPage.vue` | ✅ |
| Installed Plugins Page | `src/features/marketplace/pages/InstalledPluginsPage.vue` | ✅ |
| Plugin Updates Page | `src/features/marketplace/pages/PluginUpdatesPage.vue` | ✅ |
| Plugin Permissions Page | `src/features/marketplace/pages/PluginPermissionsPage.vue` | ✅ |
| Developer Tools Page | `src/features/marketplace/pages/DeveloperToolsPage.vue` | ✅ |
| Plugin Card | `src/features/marketplace/components/PluginCard.vue` | ✅ |
| Plugin Grid | `src/features/marketplace/components/PluginGrid.vue` | ✅ |
| Permission Badge | `src/features/marketplace/components/PermissionBadge.vue` | ✅ |
| Risk Badge | `src/features/marketplace/components/RiskBadge.vue` | ✅ |
| Update Progress | `src/features/marketplace/components/UpdateProgress.vue` | ✅ |
| Runtime Status | `src/features/marketplace/components/RuntimeStatus.vue` | ✅ |
| Marketplace Store (Pinia) | `src/features/marketplace/stores/marketplace.store.ts` | ✅ |
| Installed Plugins Store (Pinia) | `src/features/marketplace/stores/installed-plugins.store.ts` | ✅ |
| Permissions Store (Pinia) | `src/features/marketplace/stores/permissions.store.ts` | ✅ |
| Marketplace Service | `src/features/marketplace/services/MarketplaceService.ts` | ✅ |
| Installed Plugin Service | `src/features/marketplace/services/InstalledPluginService.ts` | ✅ |

---

## 8. Developer Portal (P5.3)

| Feature | Module | Status |
|---------|--------|--------|
| Developer Account Manager | `developer-platform/accounts/DeveloperAccount.ts` | ✅ |
| Plugin Submission Service | `developer-platform/publishing/PluginSubmissionService.ts` | ✅ |
| Plugin Registry | `developer-platform/repository-server/PluginRegistry.ts` | ✅ |
| Plugin Review Service | `developer-platform/review/PluginReviewService.ts` | ✅ |
| Plugin Analytics Service | `developer-platform/analytics/PluginAnalyticsService.ts` | ✅ |
| Notification Service | `developer-platform/notifications/NotificationService.ts` | ✅ |
| Developer Dashboard | `developer-platform/portal/pages/DeveloperDashboard.vue` | ✅ |
| Publish Plugin Page | `developer-platform/portal/pages/PublishPluginPage.vue` | ✅ |
| My Plugins Page | `developer-platform/portal/pages/MyPluginsPage.vue` | ✅ |
| Analytics Page | `developer-platform/portal/pages/AnalyticsPage.vue` | ✅ |
| Review Status Page | `developer-platform/portal/pages/ReviewStatusPage.vue` | ✅ |
| Account Settings Page | `developer-platform/portal/pages/AccountSettingsPage.vue` | ✅ |
| Developer Portal Routes | `developer-platform/routes/index.ts` (6 routes) | ✅ |

---

## 9. Route Integration (P5.4)

| Feature | Module | Status |
|---------|--------|--------|
| Marketplace Routes (6) | Integrated in `src/router/index.ts` | ✅ |
| Developer Portal Routes (6) | Integrated in `src/router/index.ts` | ✅ |
| Sidebar Marketplace Entry | `src/components/layout/AppSidebar.vue` | ✅ |
| Sidebar Developer Entry | `src/components/layout/AppSidebar.vue` | ✅ |

---

## 10. Electron Main Process

| Feature | Module | Status |
|---------|--------|--------|
| Main Entry | `electron/main.ts` | ✅ |
| Preload Script | `electron/preload.ts` | ✅ |
| IPC Bridge | `electron/ipc/bridge.ts` | ✅ |
| Config Utility | `electron/utils/config.ts` | ✅ |
| Logger Utility | `electron/utils/logger.ts` | ✅ |
| Secrets Utility | `electron/utils/secrets.ts` | ✅ |
| HTTP Client | `electron/utils/http-client.ts` | ✅ |
| Storage Service | `electron/services/storage.service.ts` | ✅ |
| Updater Service | `electron/services/updater.service.ts` | ✅ |
| Legacy Shared (27 JS files) | `electron/shared-legacy/` | ✅ |

---

## 11. Views

| Route | View | KeepAlive |
|-------|------|-----------|
| `/` | HomeView | ✅ |
| `/tv` | TVView | ✅ |
| `/movies` | MoviesView | ✅ |
| `/anime` | AnimeView | ✅ |
| `/search` | SearchView | - |
| `/play` | PlayView | - |
| `/downloads` | DownloadView | - |
| `/library` | LibraryView | - |
| `/favorites` | FavoritesView | - |
| `/history` | HistoryView | - |
| `/settings` | SettingsView | - |
| `/user` | UserView | - |

---

## Total Feature Count: 146 features across 11 categories
