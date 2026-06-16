# PB1.5 Content Layer — Android Migration Preparation

> Date: 2026-06-16 | Target: Capacitor (Android)

## Status: READY FOR MIGRATION

PB1.5 已将所有 UI 页面与底层数据获取解耦。前端可无障碍迁移到 Capacitor。

## Migration Architecture

```
Before (Electron):                  After (Capacitor):
┌──────────────┐                   ┌──────────────┐
│ Vue 3 Pages  │                   │ Vue 3 Pages  │  ← UNCHANGED
├──────────────┤                   ├──────────────┤
│ contentStore │                   │ contentStore │  ← UNCHANGED
├──────────────┤                   ├──────────────┤
│ content/     │                   │ content/     │  ← UNCHANGED
│ services     │                   │ services     │
├──────────────┤                   ├──────────────┤
│ core/facades │── IPC ──► main   │ core/facades │── Plugin ──► Android
├──────────────┤                   ├──────────────┤
│ Electron     │                   │ Capacitor    │
│ main process │                   │ Plugins      │
└──────────────┘                   └──────────────┘
```

## Isolation Analysis

| Layer | Electron Dependency | Migration Action |
|-------|-------------------|-----------------|
| `src/renderer/pages/` | None (uses contentStore) | No change needed |
| `src/stores/contentStore.ts` | None (uses content/ services) | No change needed |
| `src/content/` services | None (uses core/ facades) | No change needed |
| `src/core/` facades | Uses `window.app.invoke()` through managers | Replace IPC calls with Capacitor Plugin calls |
| `src/shared/storage/` | Uses `window.app.storageLoad/Save()` | Replace with `@capacitor/preferences` or SQLite |
| `electron/` | Electron-only | Remove entirely |

## What Survives Without Change

- All 6 PB1.5 UI pages (HomePage, SearchPage, CategoryPage, DetailPage, FavoritesPage, HistoryPage)
- `src/content/` — 8 files, all pure TypeScript
- `src/stores/contentStore.ts`
- `src/router/index.ts`
- Design system (`src/styles/`)
- Shared components (`src/components/`)

## What Needs Adaptation

1. **Storage** (`src/shared/storage/storage.service.ts`)
   - Replace `window.app.storageLoad/Save` → Capacitor Preferences API
   - OR migrate to SQLite via `@capacitor-community/sqlite`

2. **Network** (provider HTTP calls in core facades)
   - Electron `net` module → Capacitor HTTP plugin
   - OR native `fetch` with CORS handling

3. **File System** (local media, downloads)
   - Electron `app.getPath` → `@capacitor/filesystem`

## Capacitor Config

See `mobile/capacitor.config.ts` for the skeleton configuration.

## Installation Commands (when ready)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/preferences @capacitor/filesystem
npx cap add android
npx cap sync
npx cap open android
```

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| IPC replacement scope | Medium | Core facades isolate IPC; only storage/provider layers need change |
| Native player gap | High | Need ExoPlayer integration for Android |
| Download manager gap | Medium | Android DownloadManager API available |
| Performance regression | Low | Capacitor WebView performance comparable to Electron |
