# Developer Portal Baseline — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: BASELINE — Pre-Performance Testing

---

## Portal Performance Targets

### Dashboard Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Dashboard Load | < 500ms | TBD |
| Submissions Count | < 50ms | TBD |
| Approval Rate Calc | < 30ms | TBD |
| Download Total Calc | < 50ms | TBD |
| Recent Submissions List | < 100ms | TBD |

---

### Publishing Workflow

| Operation | Target | Measured |
|-----------|--------|----------|
| Form Validation | < 20ms | TBD |
| Manifest Generation | < 50ms | TBD |
| Submit for Review | < 500ms | TBD |
| Security Scan | < 2s | TBD |
| Full Publish Pipeline | < 10s | TBD |

---

### Review Workflow

| Operation | Target | Measured |
|-----------|--------|----------|
| Load Review Queue (50 items) | < 200ms | TBD |
| Filter by State | < 50ms | TBD |
| Approve Action | < 200ms | TBD |
| Reject Action | < 200ms | TBD |
| Security Scan Report | < 200ms | TBD |

---

### Analytics Performance

| Operation | Target | Measured |
|-----------|--------|----------|
| Page Load | < 500ms | TBD |
| Load Stats (100 plugins) | < 300ms | TBD |
| Sort by Column | < 50ms | TBD |
| Refresh Data | < 300ms | TBD |

---

### Repository Operations

| Operation | Target | Measured |
|-----------|--------|----------|
| Plugin Search | < 50ms | TBD |
| Version Lookup | < 20ms | TBD |
| Download Count Update | < 10ms | TBD |
| Register New Plugin | < 100ms | TBD |

---

## UI Responsiveness

| Page | Load Target | Measured |
|------|-------------|----------|
| DeveloperDashboard (`/developer`) | < 500ms | TBD |
| PublishPluginPage (`/developer/publish`) | < 400ms | TBD |
| MyPluginsPage (`/developer/plugins`) | < 400ms | TBD |
| AnalyticsPage (`/developer/analytics`) | < 500ms | TBD |
| ReviewStatusPage (`/developer/review`) | < 400ms | TBD |
| AccountSettingsPage (`/developer/account`) | < 300ms | TBD |

---

## Current Architecture

- All pages: Lazy-loaded via Vue Router dynamic imports
- Services: Singleton instances (no cold start after first access)
- Repository: In-memory `PluginRegistry` singleton
- Analytics: In-memory counters
- Notifications: Event-based pub/sub

---

## Notes

- Developer portal performance scripts: `tests/performance/analytics/`
- Publishing pipeline test scripts: `tests/performance/repository/`
- Review workflow currently in-memory; DB needed for production
- Analytics data currently mock; real metrics pipeline TBD
