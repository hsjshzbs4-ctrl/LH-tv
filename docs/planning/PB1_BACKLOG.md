# PB1 Public Beta — Priority Backlog

> LH-TV 2.x | Date: 2026-06-15 | Phase: PB0 Planning | Target: PB1 Sprint 1

---

## Priority Classification

### P0 — Critical Path (Sprint 1)

| ID | Feature | Business Value | Risk | Dependencies | Effort |
|----|---------|---------------|------|--------------|--------|
| PB1-001 | Crash Reporter | Crash-free session tracking — core beta metric | Low (standalone module) | None | S |
| PB1-002 | Session Metrics | Session count, duration, active users — beta adoption | Low | PB1-001 | S |
| PB1-003 | Startup Metrics | Cold/warm start timing, startup success rate | Low | None | S |
| PB1-004 | Telemetry Service | Unified telemetry pipeline (collect → buffer → flush) | Low | PB1-001, PB1-002, PB1-003 | M |

**Sprint 1 total**: ~2 days (S + S + S + M)

---

### P1 — High Priority (Sprint 2)

| ID | Feature | Business Value | Risk | Dependencies | Effort |
|----|---------|---------------|------|--------------|--------|
| PB1-011 | Diagnostics Export | User-facing diagnostics for bug reports | Low | PB1-004 | S |
| PB1-012 | Feedback Pipeline | In-app feedback collection → structured reports | Low | PB1-011 | M |
| PB1-013 | Performance Monitoring | Real-time memory/CPU tracking dashboard | Med (instrumentation overhead) | PB1-004 | M |
| PB1-014 | Provider Timing | Per-provider latency metrics for quality scoring | Low | PB1-013 | S |

**Sprint 2 total**: ~3 days

---

### P2 — Medium Priority (Sprint 3)

| ID | Feature | Business Value | Risk | Dependencies | Effort |
|----|---------|---------------|------|--------------|--------|
| PB1-021 | Release Monitoring | Update success/failure tracking | Low | PB1-004 | S |
| PB1-022 | Update Analytics | Version adoption rate, rollback rate | Low | PB1-021 | S |
| PB1-023 | Install Metrics | Fresh install vs upgrade tracking | Low | None | S |

**Sprint 3 total**: ~1.5 days

---

## Sprint Schedule

```
Sprint 1 (Days 1-2):  P0 — Crash Reporter + Session + Startup + Telemetry Service
Sprint 2 (Days 3-5):  P1 — Diagnostics + Feedback + Performance + Provider Timing
Sprint 3 (Days 6-7):  P2 — Release Monitoring + Update Analytics + Install Metrics
```

---

## Architecture: Telemetry Pipeline

```
Renderer                  Main Process              Storage
───────                   ────────────              ───────

CrashReporter ──────────→ TelemetryService ──────→ JSON log
SessionMetrics ─────────→      │                   (rotating)
StartupMetrics ─────────→      │
ProviderTiming ─────────→      ├─ Buffer (10s)
PerformanceData ────────→      │
                               └─ Flush on: buffer full / app quit / crash

No network upload in PB1 — local collection only.
PB2 will add opt-in cloud sync.
```

## Data Schema

```typescript
interface TelemetryEvent {
  sessionId: string
  timestamp: number
  appVersion: string
  eventType: 'crash' | 'session' | 'startup' | 'performance' | 'provider'
  payload: Record<string, unknown>
}
```

## Privacy

- All telemetry is **local-only** in PB1
- No PII collected
- Users can view/export/delete their telemetry data
- Opt-in cloud sync planned for PB2 (with explicit consent)
