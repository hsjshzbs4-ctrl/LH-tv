# Repository Baseline — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: BASELINE — Pre-Performance Testing

---

## Repository Performance Targets

### Query Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Search by name (exact) | < 10ms | TBD |
| Search by name (fuzzy) | < 50ms | TBD |
| Filter by category | < 20ms | TBD |
| Sort by downloads | < 30ms | TBD |
| Sort by rating | < 30ms | TBD |
| Pagination (50/page) | < 20ms | TBD |

---

### Registry Scale

| Metric | Current | Target Max |
|--------|---------|------------|
| Registered Plugins | 0 (pre-launch) | 10,000 |
| Versions Per Plugin | N/A | 50 |
| Total Package Size | 0 MB | 500 MB |
| Metadata Index Size | 0 KB | 10 MB |

---

### Write Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Register Plugin | < 100ms | TBD |
| Add Version | < 50ms | TBD |
| Update Metadata | < 30ms | TBD |
| Increment Download Count | < 10ms | TBD |

---

### Metadata

| Field | Type | Indexed |
|-------|------|---------|
| Plugin ID | string | ✅ (primary) |
| Name | string | ✅ |
| Category | enum | ✅ |
| Version | semver | ✅ |
| Author | string | ✅ |
| Downloads | number | ✅ (sort) |
| Rating | number | ✅ (sort) |
| Permissions | array | ❌ |
| SDK Version | semver | ❌ |

---

## Current State

- Repository: `developer-platform/repository-server/PluginRegistry.ts`
- Implementation: In-memory registry (singleton)
- Persistence: Via StorageService
- Search: Linear scan with string matching
- Index: Plugin ID (Map-based)

---

## Notes

- Repository is currently in-memory; production will need persistent DB
- Search optimization needed for 1000+ plugins (trie or inverted index)
- Download count uses atomic increment pattern
- Repository load test scripts: `tests/performance/repository/`
