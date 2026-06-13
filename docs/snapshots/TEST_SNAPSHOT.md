# Test Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN
**Result**: 66 files / 488 tests / 100% PASS

---

## Test Suite Summary

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Architecture | 8 | ~50 | ✅ 100% |
| Unit (Core) | ~15 | ~250 | ✅ 100% |
| Persistence | 7 | 42 | ✅ 100% |
| Integration | 13 | ~60 | ✅ 100% |
| Stress | 8 | 40 | ✅ 100% |
| Plugin Marketplace | 7 | ~30 | ✅ 100% |
| Marketplace UI | 2 | ~10 | ✅ 100% |
| Developer Platform | 3 | ~9 | ✅ 100% |
| **TOTAL** | **66** | **488** | **✅ 100%** |

---

## Architecture Tests (8 files)

| File | Focus |
|------|-------|
| `layer-import.spec.ts` | Layer dependency direction validation |
| `provider-decoupling.spec.ts` | P5.0 provider decoupling verification |
| `plugin-ready.spec.ts` | Plugin system readiness |
| `p5-gate.spec.ts` | P5.0 final acceptance gate |
| `p5-marketplace-gate.spec.ts` | P5.1 marketplace core gate |
| `p5-ui-marketplace-gate.spec.ts` | P5.2 marketplace UI gate |
| `p5-developer-platform-gate.spec.ts` | P5.3 developer platform gate |
| `architecture-boundary.spec.ts` | Cross-boundary access checks |

---

## Unit Tests

### Core Modules

| Module | Test File | Tests |
|--------|-----------|-------|
| Cache | `memory-store.spec.ts` | Memory store operations |
| Cache | `cache-manager.spec.ts` | Cache manager orchestration |
| Search | `search-cache.spec.ts` | Search cache layer |
| Providers | `registry.spec.ts` | Provider registry CRUD |
| Providers | `provider-facade.spec.ts` | Provider facade DI |
| Player | `player-engine.spec.ts` | Player engine + adapters |
| Shared | `storage.service.spec.ts` | Storage service |
| Download | `download-queue.spec.ts` | Download queue operations |
| Download | `task-scheduler.spec.ts` | Task scheduling |
| Download | `recovery-manager.spec.ts` | Download recovery |
| Offline | `offline-library-manager.spec.ts` | Offline library |
| Favorites | `favorites-manager.spec.ts` | Favorites CRUD |
| Continue Watching | `continue-watching-manager.spec.ts` | Watch progress |
| Aggregation | `provider-health-manager.spec.ts` | Provider health checks |
| Provider SDK | `manifest-parser.spec.ts` | Manifest parsing |
| Monitoring | `metrics-collector.spec.ts` | Metrics collection |
| History | `history-manager.spec.ts` | History tracking |
| Playback | `source-switch-manager.spec.ts` | Source switching |

---

## Persistence Tests (7 files)

| File | Focus |
|------|-------|
| `continue-watching.persistence.spec.ts` | Watch progress persistence |
| `favorites.persistence.spec.ts` | Favorites persistence |
| `history.persistence.spec.ts` | History persistence |
| `downloads.persistence.spec.ts` | Download state persistence |
| `offline-library.persistence.spec.ts` | Offline library persistence |
| `persistence-recovery.spec.ts` | Restart recovery |
| `corruption-recovery.spec.ts` | Data corruption recovery |

---

## Integration Tests (13 files)

| File | Focus |
|------|-------|
| `playback-flow.integration.spec.ts` | Playback end-to-end |
| `download-flow.integration.spec.ts` | Download lifecycle |
| `history-flow.integration.spec.ts` | History tracking flow |
| `offline-library.integration.spec.ts` | Offline library flow |
| `monitoring.integration.spec.ts` | Monitoring pipeline |
| `full-user-flow.integration.spec.ts` | Complete user journey |
| `plugin-sdk.integration.spec.ts` | Plugin SDK flow |
| `source-switch.integration.spec.ts` | Source switching |
| `provider-flow.integration.spec.ts` | Provider pipeline |
| `aggregation-flow.integration.spec.ts` | Aggregation pipeline |
| `provider-abi-compatibility.spec.ts` | Provider ABI compat |
| `provider-reload.integration.spec.ts` | Provider hot reload |
| `provider-isolation.integration.spec.ts` | Provider isolation |

---

## Stress Tests (8 files)

| File | Focus |
|------|-------|
| `provider.stress.spec.ts` | Provider under load |
| `aggregation.stress.spec.ts` | Aggregation under load |
| `playback.stress.spec.ts` | Playback stress |
| `download.stress.spec.ts` | Download stress |
| `memory-leak.spec.ts` | Memory leak detection |
| `restart.stress.spec.ts` | Repeated restart |
| `concurrency.stress.spec.ts` | Concurrent operations |
| `rc-acceptance.spec.ts` | RC acceptance gate |

---

## Plugin Marketplace Tests (7 files)

| File | Focus |
|------|-------|
| `permission-manager.spec.ts` | 7 permission types |
| `plugin-verifier.spec.ts` | Signature verification |
| `plugin-installer.spec.ts` | Install + rollback |
| `plugin-lifecycle.spec.ts` | State machine transitions |
| `plugin-update.spec.ts` | Update pipeline |
| `plugin-storage.spec.ts` | Local persistence |
| `marketplace-integration.spec.ts` | End-to-end marketplace |

---

## Marketplace UI Tests (2 files)

| File | Focus |
|------|-------|
| `marketplace-services.spec.ts` | MarketplaceService + InstalledPluginService |
| `marketplace-stores.spec.ts` | Pinia store integration |

---

## Developer Platform Tests (3 files)

| File | Focus |
|------|-------|
| `publishing.spec.ts` | Submit → Validate → Publish |
| `repository.spec.ts` | Registry CRUD + search |
| `review.spec.ts` | Review workflow + security scan |

---

## Test Infrastructure

| Component | Technology |
|-----------|-----------|
| Runner | Vitest 4.1.8 |
| DOM Environment | jsdom + happy-dom |
| Vue Testing | @vue/test-utils 2.4 |
| Mock System | IpcMock, StorageMock, ProviderMock, WorkerMock |
| Fixtures | 8 data factory functions |
| Persistence Helper | simulateRestart / simulateCrashRestart |
| Coverage | @vitest/coverage-v8 |

---

## RC1 Acceptance

See: `tests/reports/RC1_ACCEPTANCE_REPORT.md` (398 tests)
See: `tests/reports/P5_PROVIDER_DECOUPLING_REPORT.md`
See: `tests/reports/P5_PLUGIN_MARKETPLACE_CORE_REPORT.md`
See: `tests/reports/P5_MARKETPLACE_UI_REPORT.md`
See: `tests/reports/P5_DEVELOPER_PORTAL_REPORT.md`
