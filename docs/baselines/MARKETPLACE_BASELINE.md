# Marketplace Baseline — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: BASELINE — Pre-Performance Testing

---

## Marketplace Performance Targets

### Search Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Search by keyword (empty) | < 50ms | TBD |
| Search by keyword (20 chars) | < 100ms | TBD |
| Filter by category | < 30ms | TBD |
| Debounce delay | 200ms | 200ms ✅ |

---

### Browse Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Load Popular (50 plugins) | < 200ms | TBD |
| Load Featured (20 plugins) | < 150ms | TBD |
| Category switch | < 100ms | TBD |
| Infinite scroll (next page) | < 150ms | TBD |

---

### Install Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Download (1MB plugin) | < 3s | TBD |
| Validate Signature | < 100ms | TBD |
| Extract Package | < 500ms | TBD |
| Register Plugin | < 100ms | TBD |
| Full Install Pipeline | < 5s | TBD |
| Rollback (on failure) | < 2s | TBD |

---

### Update Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Check Updates (10 plugins) | < 500ms | TBD |
| Download Update (1MB) | < 3s | TBD |
| Backup Current | < 500ms | TBD |
| Install Update | < 5s | TBD |
| Migrate Data | < 2s | TBD |
| Rollback (on failure) | < 3s | TBD |

---

### Plugin Lifecycle

| Operation | Target | Measured |
|-----------|--------|----------|
| Enable Plugin | < 200ms | TBD |
| Disable Plugin | < 100ms | TBD |
| Start Plugin | < 500ms | TBD |
| Stop Plugin | < 200ms | TBD |

---

### UI Responsiveness

| Metric | Target | Measured |
|--------|--------|----------|
| Page Load (MarketplaceHome) | < 800ms | TBD |
| Page Load (PluginDetail) | < 500ms | TBD |
| Plugin Card Render (50 cards) | < 100ms | TBD |
| Grid Virtual Scroll | 60fps | TBD |
| Permission Toggle | < 50ms | TBD |

---

## Current Architecture

- Marketplace Service: `src/features/marketplace/services/MarketplaceService.ts`
- Search: Debounced input (200ms) → store.search()
- Catalog: In-memory with Pinia store
- Install: Async pipeline with progress tracking
- Components: Lazy-loaded via Vue Router

---

## Notes

- Marketplace performance test scripts: `tests/performance/marketplace/`
- Plugin runtime performance: `tests/performance/plugin-runtime/`
- Grid rendering uses CSS Grid (not virtual scroll yet)
- Search uses simple string matching (Trie recommended for scale)
