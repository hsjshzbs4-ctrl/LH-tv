# Marketplace Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN

---

## Marketplace Overview

The LH-TV Plugin Marketplace enables users to discover, install, manage, and update plugins that extend the application's functionality.

---

## Marketplace Core (P5.1 — `src/plugin-marketplace/`)

### 1. Repository (`repository/` — 3 files)

| Component | Description |
|-----------|-------------|
| `PluginRepository` | Local plugin catalog with search and category filtering |
| `RepositoryClient` | Remote repository API client |
| Types | Repository data types |

### 2. Installer (`installer/` — 2 files)

| Component | Description |
|-----------|-------------|
| `PluginInstaller` | Download → Validate → Extract → Register → Enable pipeline |
| `PluginUninstaller` | Clean removal with optional data preservation |

**Install Flow**:
```
Download Package → Validate Signature → Extract Files
→ Register Plugin → Enable Plugin → Report Success
                                    ↘ Failure → Rollback
```

### 3. Runtime (`runtime/` — 3 files)

| Component | Description |
|-----------|-------------|
| `PluginLifecycleManager` | State machine managing plugin lifecycle |
| `PluginSandboxManager` | Isolated execution environment |

**Lifecycle States**:
```
INSTALLED → ENABLED → STARTING → RUNNING
                                  → STOPPING → STOPPED
                                  → FAILED
DISABLED → ENABLED (re-enable)
```

### 4. Permissions (`permissions/` — 2 files)

| Component | Description |
|-----------|-------------|
| `PermissionManager` | Grant/revoke/check permissions |

**7 Permission Types**:
| Permission | Description |
|------------|-------------|
| `PROVIDER` | Access provider APIs |
| `DOWNLOAD` | Download content |
| `LIBRARY` | Access local library |
| `SETTINGS` | Read/write settings |
| `NETWORK` | Network access |
| `STORAGE` | File system access |
| `NOTIFICATION` | Send notifications |

### 5. Signatures (`signatures/` — 3 files)

| Component | Description |
|-----------|-------------|
| `PluginVerifier` | SHA256/SHA512 signature validation |
| `SignatureStore` | Trusted publisher key store |

### 6. Updates (`updates/` — 2 files)

| Component | Description |
|-----------|-------------|
| `PluginUpdateManager` | Check → Download → Validate → Backup → Install → Migrate pipeline |

**Update Flow**:
```
Check Version → Download Update → Validate Signature
→ Backup Current → Install New → Run Migration
→ Verify → Report Success
         ↘ Failure → Restore Backup
```

### 7. Storage (`storage/` — 2 files)

| Component | Description |
|-----------|-------------|
| `PluginStorage` | Plugin metadata and state persistence |

---

## Marketplace UI (P5.2 — `src/features/marketplace/`)

### Pages (6)

| Page | Route | Description |
|------|-------|-------------|
| MarketplaceHomePage | `/marketplace` | Search + categories + featured/popular grid |
| MarketplaceDetailPage | `/marketplace/plugin/:id` | Plugin details + install/uninstall + permissions + risk |
| InstalledPluginsPage | `/plugins/installed` | Installed plugin list + enable/disable/remove |
| PluginUpdatesPage | `/plugins/updates` | Available updates + update all |
| PluginPermissionsPage | `/plugins/permissions` | Permission matrix + grant/revoke |
| DeveloperToolsPage | `/plugins/developer` | Runtime diagnostics + error logs + sandbox status |

### Components (6)

| Component | Description |
|-----------|-------------|
| `PluginCard` | Individual plugin card (name, version, author, rating) |
| `PluginGrid` | Responsive grid of PluginCards |
| `PermissionBadge` | Visual badge for permission type |
| `RiskBadge` | Risk level indicator (low/medium/high) |
| `UpdateProgress` | Update download/install progress bar |
| `RuntimeStatus` | Plugin runtime state indicator |

### Stores (3 Pinia)

| Store | Purpose |
|-------|---------|
| `useMarketplaceStore` | Marketplace catalog, search, categories |
| `useInstalledPluginsStore` | Installed plugin list, enable/disable |
| `usePermissionsStore` | Permission grants for each plugin |

### Services (2)

| Service | Purpose |
|---------|---------|
| `MarketplaceService` | Search, browse, featured, popular plugins |
| `InstalledPluginService` | Install, uninstall, enable, disable, update |

---

## Marketplace Test Coverage

| Test Area | Files | Status |
|-----------|-------|--------|
| Core (P5.1) | 7 files | ✅ 100% |
| UI (P5.2) | 2 files | ✅ 100% |
| Integration | 1 file | ✅ 100% |
| Architecture Gate | 2 files | ✅ 100% |
