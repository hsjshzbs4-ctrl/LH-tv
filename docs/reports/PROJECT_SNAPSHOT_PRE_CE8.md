# Project Snapshot — Pre-CE8

**Date**: 2026-06-14
**Version**: LH-TV 2.1
**Baseline**: `PRE-CE8-STABLE`

---

## Codebase Metrics

| Metric | Value |
|--------|-------|
| Source Files (TS/Vue) | 242 |
| Test Files | 102 |
| Source LOC (TS/Vue) | 22,137 |
| Test LOC | 11,193 |
| Test Cases | ~684 |
| Routes | ~13 (from router grep) |
| Circular Dependencies | 0 |

---

## Module Inventory

| Module | Path | Files | Status |
|--------|------|-------|--------|
| Core Runtime | `src/core/` | ~100 | Stable |
| Content Ecosystem | `src/core/content-ecosystem/` | 62 | Stable |
| Metadata | `src/core/content-ecosystem/metadata/` | 8 | Stable |
| Local Media | `src/core/content-ecosystem/local-media/` | 15 | Stable |
| Media Servers | `src/core/content-ecosystem/media-servers/` | 14 | Stable |
| Search Index (CE7) | `src/core/content-ecosystem/search/` | 20 | Stable |
| Provider Contracts | `src/provider-contracts/` | 4 | Stable |
| Provider SDK | `src/core/provider-sdk/` | 5 | Stable |
| Provider Sandbox | `src/core/provider-sandbox/` | 5 | Stable |
| Marketplace | (in src + plugins) | ~17 | Stable |
| Developer Platform | `developer-platform/` | ~7 | Stable |
| Views | `src/views/` | 12 | Stable |
| Components | `src/components/` | 15 | Stable |
| Electron | `electron/` | ~10 | Stable |

---

## Dependency Graph

```
UI (Views) → Facades → Managers → Engines/Repositories → Providers/Services
                           ↓
                    Contracts (interfaces)
```

---

## Key Architecture Decisions

1. **Facade Pattern**: All module access through Facade singletons
2. **DI Pattern**: Managers receive dependencies via constructor
3. **Interface Segregation**: ISearchDataSource, ISearchStorage decouple CE7 from CE8
4. **Inverted Index**: O(k) search via 4 secondary indexes
5. **Provider Isolation**: Worker threads + sandbox for third-party providers
6. **Zero Cycles**: Enforced by madge CI

---

## CE7 Added (vs CE6 Baseline)

| Metric | Pre-CE7 | Post-CE7 | Delta |
|--------|---------|----------|-------|
| Source Files | 222 | 242 | +20 |
| Test Files | 72 | 102 | +30* |
| Test Cases | 516 | ~684 | +168 |
| Source LOC | ~20,000 | 22,137 | +2,137 |
| Test LOC | ~8,000 | 11,193 | +3,193 |
| Circular Deps | 0 | 0 | 0 |

\* Some test files existed before CE7 unit tests; 8 new CE7-specific test files
