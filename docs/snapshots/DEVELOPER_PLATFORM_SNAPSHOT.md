# Developer Platform Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN

---

## Developer Platform Overview

The LH-TV Developer Platform enables third-party developers to create, publish, and manage plugins. It provides a complete publishing pipeline, official repository, review system, and analytics.

---

## Platform Services (7 modules)

### 1. Accounts (`accounts/DeveloperAccount.ts`)

| Feature | Description |
|---------|-------------|
| Account Manager | Singleton managing developer accounts |
| Roles | DEVELOPER, VERIFIED_DEVELOPER, REVIEWER, ADMIN |
| Profile | username, email, role, verified status, plugin count, total downloads |

### 2. Publishing (`publishing/PluginSubmissionService.ts`)

| Feature | Description |
|---------|-------------|
| Submission Service | Plugin upload and submission management |
| Pipeline | Upload → Validate → Scan → Review → Approve → Publish |

**Submission Fields**:
- Plugin ID, Name, Version
- Description, SDK Version
- Entry point, Permissions
- Manifest metadata

### 3. Repository (`repository-server/PluginRegistry.ts`)

| Feature | Description |
|---------|-------------|
| Plugin Registry | Official plugin repository |
| Search | Plugin search with metadata filtering |
| Versioning | Multiple version support per plugin |
| Stats | Download counter tracking |

### 4. Review (`review/PluginReviewService.ts`)

| Feature | Description |
|---------|-------------|
| Review Service | Plugin review and approval workflow |
| Security Scanner | Dangerous permission detection (STORAGE_ACCESS, SETTINGS_ACCESS) |

**Review States**:
```
SUBMITTED → SCANNING → UNDER_REVIEW
                    → APPROVED
                    → REJECTED
                    → CHANGES_REQUESTED
```

### 5. Analytics (`analytics/PluginAnalyticsService.ts`)

| Feature | Description |
|---------|-------------|
| Analytics Service | Plugin usage statistics |

**Tracked Metrics**:
- Downloads
- Installs
- Uninstalls
- Crash Rate
- Active Users

### 6. Notifications (`notifications/NotificationService.ts`)

| Feature | Description |
|---------|-------------|
| Notification Service | Developer notification delivery |

**Notification Types**:
- `review` — Review status updates
- `publish` — Publication confirmations
- `warning` — Security/performance warnings

### 7. Shared Types (`shared/types.ts`)

Types shared across all developer platform modules:
- `DeveloperAccount`, `DeveloperProfile`, `DeveloperRole`
- `PluginSubmission`, `PluginManifest`
- `PluginAnalytics`, `PluginRating`
- `ReviewState`, `DeveloperNotification`

---

## Portal Pages (6)

| Page | Route | Description |
|------|-------|-------------|
| DeveloperDashboard | `/developer` | Overview: submissions, approvals, downloads, pending reviews |
| PublishPluginPage | `/developer/publish` | Plugin submission form (ID, name, version, description, permissions) |
| MyPluginsPage | `/developer/plugins` | List of submitted plugins with status badges |
| AnalyticsPage | `/developer/analytics` | Downloads/installs/active users/crash rate table |
| ReviewStatusPage | `/developer/review` | Review queue with approve/reject actions |
| AccountSettingsPage | `/developer/account` | Profile: username, email, role, verified, plugins, downloads |

---

## Publishing Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Upload  │ →  │ Validate │ →  │   Scan   │ →  │  Review  │ →  │ Publish  │
│  Plugin  │    │ Manifest │    │ Security │    │  Manual  │    │   To     │
│  Package │    │ & Perms  │    │  Scanner │    │  Review  │    │ Registry │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                          ┌───────────┼───────────┐
                                          │           │           │
                                    ┌─────▼────┐ ┌───▼────┐ ┌───▼──────────┐
                                    │ APPROVED │ │REJECTED│ │CHANGES       │
                                    │ →Publish │ │        │ │REQUESTED     │
                                    └──────────┘ └────────┘ │→Resubmit     │
                                                            └──────────────┘
```

---

## Security Scanning

| Check | Description |
|-------|-------------|
| Permission Analysis | Detects dangerous permission combinations |
| STORAGE_ACCESS flag | High-risk: plugin can read/write files |
| SETTINGS_ACCESS flag | High-risk: plugin can modify app settings |
| Manifest Validation | Ensures required fields and valid SDK version |

---

## Developer Platform Test Coverage

| Test Area | Files | Status |
|-----------|-------|--------|
| Publishing | 1 file | ✅ 100% |
| Repository | 1 file | ✅ 100% |
| Review | 1 file | ✅ 100% |
| Architecture Gate | 1 file | ✅ 100% |

---

## Route Integration (P5.4)

All 6 Developer Portal routes are integrated into the main `src/router/index.ts` via `developerPortalRoutes` import from `@developer-platform/routes`.

Sidebar entry: 🛠️ 开发者 → `/developer`
