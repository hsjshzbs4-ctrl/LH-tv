# Dependency Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN
**Circular Dependencies**: 0 ✅

---

## Module Dependency Map

```
                              ┌──────────────┐
                              │   Views (12)  │
                              └──────┬───────┘
                                     │ uses
                              ┌──────▼───────┐
                              │  Facades (14) │
                              └──────┬───────┘
                                     │ uses
                              ┌──────▼───────┐
                              │ Managers (14) │
                              └──────┬───────┘
                                     │ uses
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐
              │  Shared    │  │  Provider    │  │  Storage   │
              │  Types (8) │  │  Contracts(4)│  │  Service   │
              └───────────┘  └──────────────┘  └───────────┘
```

---

## Architecture Boundaries

### Boundary 1: Core ↔ Provider Layer
```
src/core/providers/ ──→ src/provider-contracts/  (allowed)
src/provider-sdk/   ──→ src/provider-contracts/  (allowed, post-P5.0)
src/provider-host/  ──→ src/provider-contracts/  (allowed)
src/provider-sdk/   ──→ src/core/providers/      (FORBIDDEN, broken in P5.0)
```

### Boundary 2: Application ↔ Core
```
src/views/          ──→ src/core/*/facade/       (allowed)
src/stores/         ──→ src/core/*/facade/       (allowed)
src/views/          ──→ src/core/*/manager/      (FORBIDDEN, must use Facade)
src/views/          ──→ window.app.xxx           (FORBIDDEN)
```

### Boundary 3: Marketplace ↔ Plugin Core
```
src/features/marketplace/ ──→ src/plugin-marketplace/  (allowed, via services)
src/plugin-marketplace/    ──→ src/provider-contracts/ (allowed)
```

### Boundary 4: Developer Platform ↔ Marketplace
```
developer-platform/ ──→ src/plugin-marketplace/  (allowed, repository)
developer-platform/ ──→ src/core/                (FORBIDDEN, decoupled)
```

### Boundary 5: Electron ↔ Renderer
```
electron/ ──→ src/shared/ipc/                    (allowed, IPC channel defs)
electron/ ──→ src/shared/types/                  (allowed)
Renderer  ──→ electron/                          (FORBIDDEN, only via preload)
```

---

## Dependency Validation

| Check | Result |
|-------|--------|
| `npx madge --circular src` | ✅ 0 cycles |
| P5.0 Gate (no exceptions) | ✅ PASS |
| P5.2 UI Gate | ✅ PASS |
| P5.3 Developer Platform Gate | ✅ PASS |
| Architecture boundary test | ✅ PASS |

---

## Key Dependency Rules

1. **Facade Pattern**: All Views/Stores access core modules ONLY through Facades
2. **DI Pattern**: ProviderFacade receives providers via `initialize()` injection (not static import)
3. **Contracts Layer**: Shared types extracted to `provider-contracts/` to break provider↔sdk cycles
4. **No Direct localStorage**: All persistence goes through `StorageService`
5. **No window.app**: No renderer code accesses Electron main directly
6. **Plugin Isolation**: Third-party providers run in Worker sandbox

---

## External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| electron | ^34.3.0 | Application runtime |
| vue | ^3.5.13 | UI framework |
| vue-router | ^4.5.0 | Client-side routing |
| pinia | ^3.0.2 | State management |
| pinia-plugin-persistedstate | ^4.7.1 | State persistence |
| hls.js | ^1.5.17 | HLS video playback |
| electron-updater | ^6.3.9 | Auto-update |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.7.3 | Type checking |
| electron-vite | ^3.0.0 | Build tooling |
| @vitejs/plugin-vue | ^5.2.1 | Vue SFC compilation |
| vitest | ^4.1.8 | Test runner |
| @vitest/coverage-v8 | ^4.1.8 | Code coverage |
| @vue/test-utils | ^2.4.11 | Vue component testing |
| jsdom | ^29.1.1 | DOM environment for tests |
| happy-dom | ^20.10.3 | Lightweight DOM environment |
| madge | ^8.0.0 | Circular dependency detection |
| electron-builder | ^25.1.8 | Application packaging |
| @playwright/test | ^1.50.1 | E2E testing |
| vue-tsc | ^2.2.0 | Vue type checking |
