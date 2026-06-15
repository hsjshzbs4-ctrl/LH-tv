# PB1 Release Baseline

> LH-TV 2.x | Date: 2026-06-15 | Commit: `9b34c8c` | Status: **BETA FREEZE** 🔒

---

## Architecture Overview

```
UI (Vue 3.5) → IPC (contextBridge) → Application → Runtime → Infrastructure → Domain
                     │
              Telemetry Pipeline:  crash → session → startup → service
              Diagnostics Pipeline: exporter → bug report
              Feedback Pipeline:   service → snapshot → storage
              Release Pipeline:    version → install → update → health
```

## Module Inventory

### Core Runtime (frozen)

| Layer | Module | Files | Tests |
|-------|--------|-------|-------|
| Domain | CE9-A recommendation | 22 | 126 |
| Application | CE9-B recommendation | 24 | 71 |
| Runtime | CE9-C recommendation | 24 | 57 |
| Infrastructure | CE9-D recommendation | 32 | 27 |
| IPC | CE9-E recommendation | 16 | 20 |
| UI | CE9-F recommendation | 16 | 22 |
| Core | providers/cache/player/download/etc. | ~150 | ~400 |
| Search | CE7-8 unified search | 95 | 266 |

### Ecosystem (frozen)

| Module | Files |
|--------|-------|
| Plugin Marketplace (P5.1) | 18 |
| Marketplace UI (P5.2) | 17 |
| Developer Portal (P5.3) | 16 |
| Content Ecosystem (P6) | ~50 |
| Provider SDK / Contracts / Sandbox | 12 |
| Electron Runtime (RC3.1) | 5 |

### PB1 Telemetry (frozen)

| Sprint | Modules | Files | Tests |
|--------|---------|-------|-------|
| S1 (P0) | Crash + Session + Startup + Service | 5 | 73 |
| S2 (P1) | Diagnostics + BugReport + Feedback + Snapshot | 6 | 47 |
| S3 (P2) | Release + Install + Update + Health | 5 | 47 |
| **Total** | **12 modules** | **16** | **167** |

---

## Storage Inventory

| Path | Format | Retention |
|------|--------|-----------|
| `userData/telemetry/crashes.json` | JSON append | 30 days |
| `userData/telemetry/sessions.json` | JSON append | 30 days |
| `userData/telemetry/startup.json` | JSON append | 30 days |
| `userData/telemetry/metrics.json` | JSON append | 30 days |
| `userData/feedback/feedback.json` | JSON | Permanent |
| `userData/feedback/drafts.json` | JSON | Until deleted |
| `userData/release/release.json` | JSON | 90 days |
| `userData/release/installations.json` | JSON | 90 days |
| `userData/release/updates.json` | JSON | 90 days |
| `userData/release/health.json` | JSON | 90 days |

## Test Inventory

| Category | Files | Tests |
|----------|-------|-------|
| Architecture | 9 | — |
| Unit (core) | ~50 | ~400 |
| Unit (recommendation) | 22 | 323 |
| Unit (telemetry S1) | 4 | 73 |
| Unit (diagnostics S2) | 2 | 21 |
| Unit (feedback S2) | 2 | 26 |
| Unit (release S3) | 4 | 47 |
| Unit (search) | ~20 | ~150 |
| Unit (electron) | 4 | 38 |
| Integration | ~33 | ~80 |
| Integration (electron recovery) | 3 | 21 |
| Stress | 8 | 40 |
| Performance | 14 | 200+ |
| Persistence | 7 | 42 |
| Marketplace | ~10 | ~50 |
| Developer Platform | ~5 | ~30 |
| E2E | 2 | — |
| **Total** | **171** | **1518** |

---

## Performance Baseline

| Metric | Value | Target |
|--------|-------|--------|
| Cold Start (16 modules) | 320ms | <3000ms |
| Warm Start | 0.05ms | <1000ms |
| Route Registration (24 routes) | 53ms | <500ms |
| Store Init | 43ms | <800ms |
| Plugin Discovery | 8ms | <200ms |
| Memory Baseline | 67.6MB | — |
| Search (100K records) | 26.5ms | <300ms |
| Build Time | 1.56s | — |

---

## Dependency Inventory

| Dependency | Version | Purpose |
|------------|---------|---------|
| electron | 34.x | Runtime |
| vue | 3.5 | UI |
| pinia | 3 | State |
| vite | 6.4.3 | Build |
| vitest | 4.1.8 | Test |
| typescript | 5.7 | Type check |
| electron-vite | latest | Build |
| electron-updater | latest | Auto-update |
| electron-builder | latest | Package |
| hls.js | latest | Video |
| madge | latest | Cycle check |

---

## Known Limitations

| # | Issue | Severity | Phase |
|---|-------|----------|-------|
| 1 | webSecurity=false (CORS exception) | Medium | RC4 |
| 2 | sandbox not set | Medium | RC4 |
| 3 | Permission enforcement not wired | Medium | RC4 |
| 4 | Provider isolation (Worker unused) | Medium | RC4 |
| 5 | Plugin isolation (logical only) | Medium | RC4 |
| 6 | Code signing disabled | Low | RC4 |
| 7 | Embedding similarity (placeholder) | Low | CE10 |

---

## Verdict

```
PB1 RELEASE BASELINE: FROZEN 🔒
1518 tests | 171 files | 491 source files
0 type errors | 0 cycles | Build PASS
```
