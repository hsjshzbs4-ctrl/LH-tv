# Route Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Total Routes**: 24
**Status**: FROZEN

---

## Core Routes (12)

| # | Path | Name | View | Title | KeepAlive |
|---|------|------|------|-------|-----------|
| 1 | `/` | `home` | HomeView | 首页 | ✅ |
| 2 | `/tv` | `tv` | TVView | 电视剧 | ✅ |
| 3 | `/movies` | `movies` | MoviesView | 电影 | ✅ |
| 4 | `/anime` | `anime` | AnimeView | 动漫 | ✅ |
| 5 | `/search` | `search` | SearchView | 搜索 | - |
| 6 | `/play` | `play` | PlayView | 播放 | - |
| 7 | `/downloads` | `downloads` | DownloadView | 下载管理 | - |
| 8 | `/library` | `library` | LibraryView | 本地库 | - |
| 9 | `/favorites` | `favorites` | FavoritesView | 收藏 | - |
| 10 | `/history` | `history` | HistoryView | 历史 | - |
| 11 | `/settings` | `settings` | SettingsView | 设置 | - |
| 12 | `/user` | `user` | UserView | 我的 | - |

---

## Marketplace Routes (6)

| # | Path | Name | Page | Title |
|---|------|------|------|-------|
| 13 | `/marketplace` | `marketplace` | MarketplaceHomePage | Plugin Marketplace |
| 14 | `/marketplace/plugin/:id` | `marketplace-detail` | MarketplaceDetailPage | Plugin Detail |
| 15 | `/plugins/installed` | `installed-plugins` | InstalledPluginsPage | Installed Plugins |
| 16 | `/plugins/updates` | `plugin-updates` | PluginUpdatesPage | Plugin Updates |
| 17 | `/plugins/permissions` | `plugin-permissions` | PluginPermissionsPage | Plugin Permissions |
| 18 | `/plugins/developer` | `developer-tools` | DeveloperToolsPage | Developer Tools |

---

## Developer Portal Routes (6)

| # | Path | Name | Page | Title |
|---|------|------|------|-------|
| 19 | `/developer` | `developer-dashboard` | DeveloperDashboard | Developer Dashboard |
| 20 | `/developer/publish` | `developer-publish` | PublishPluginPage | Publish Plugin |
| 21 | `/developer/plugins` | `developer-my-plugins` | MyPluginsPage | My Plugins |
| 22 | `/developer/analytics` | `developer-analytics` | AnalyticsPage | Plugin Analytics |
| 23 | `/developer/review` | `developer-review` | ReviewStatusPage | Review Status |
| 24 | `/developer/account` | `developer-account` | AccountSettingsPage | Account Settings |

---

## Navigation Structure

```
LH-TV Sidebar
├── 🏠 首页          → /
├── 📺 电视剧        → /tv
├── 🎬 电影          → /movies
├── 🎌 动漫          → /anime
├── 🔍 搜索          → /search
├── ⬇️ 下载管理      → /downloads
├── 📥 本地库        → /library
├── ❤️ 收藏          → /favorites
├── 🕐 历史          → /history
├── 🧩 插件市场      → /marketplace
│   ├── Plugin Detail      → /marketplace/plugin/:id
│   ├── Installed Plugins  → /plugins/installed
│   ├── Plugin Updates     → /plugins/updates
│   ├── Plugin Permissions → /plugins/permissions
│   └── Developer Tools    → /plugins/developer
├── 🛠️ 开发者        → /developer
│   ├── Publish Plugin    → /developer/publish
│   ├── My Plugins        → /developer/plugins
│   ├── Analytics         → /developer/analytics
│   ├── Review Status     → /developer/review
│   └── Account Settings  → /developer/account
└── ⚙️ 设置          → /settings
```

---

## Router Configuration

- **History Mode**: `createMemoryHistory()` (Electron-compatible)
- **Scroll Behavior**: Default
- **Fallback**: `/:pathMatch(.*)*` → redirect to `/`
- **Title**: `document.title = "LH - {title}"`

## Route Features

- 4 KeepAlive routes (home, tv, movies, anime)
- 18 Lazy-loaded routes (dynamic imports)
- Global Search Panel (Ctrl+K) — teleported overlay, not a route
- Sidebar collapsible — persisted in app store
