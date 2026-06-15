# PB1 Known Issues Register

> LH-TV 2.x | Date: 2026-06-15 | Status: **PUBLISHED**

---

## Critical (0)

None.

---

## High (0)

None.

---

## Medium (5 — Deferred to RC4/CE10)

| ID | Issue | Status | Resolution |
|----|-------|--------|------------|
| KI-001 | `webSecurity=false` — CORS exception for HLS/m3u8 CDNs | **DEFERRED** | Local proxy in RC4 |
| KI-002 | `sandbox` not set in webPreferences | **DEFERRED** | Add in RC4 |
| KI-003 | Permission enforcement not wired to plugin lifecycle | **DEFERRED** | Integrate in RC4 |
| KI-004 | Provider Worker isolation unused (window.app dependency) | **DEFERRED** | Refactor in RC4 |
| KI-005 | Plugin isolation is logical-only (no Worker boundary) | **DEFERRED** | Mirror WorkerPool in RC4 |

---

## Low (2 — Deferred to RC4)

| ID | Issue | Status | Resolution |
|----|-------|--------|------------|
| KI-006 | Code signing not configured | **DEFERRED** | EV cert for GA |
| KI-007 | EmbeddingSimilarityService placeholder (CE9-D) | **DEFERRED** | Implement in CE10 |

---

## Resolved (6 — RC3.1)

| ID | Issue | Status |
|----|-------|--------|
| KI-R01 | render-process-gone handler | ✅ RESOLVED RC3.1 |
| KI-R02 | unresponsive handler | ✅ RESOLVED RC3.1 |
| KI-R03 | process.exit(1) child process leak | ✅ RESOLVED RC3.1 |
| KI-R04 | did-fail-load handler | ✅ RESOLVED RC3.1 |
| KI-R05 | webSecurity exception documented | ✅ RESOLVED RC3.1 |
| KI-R06 | auto-update env-driven config | ✅ RESOLVED RC3.1 |

---

## Summary

| Severity | Open | Resolved | Deferred |
|----------|------|----------|----------|
| Critical | 0 | 0 | 0 |
| High | 0 | 4 | 0 |
| Medium | 0 | 1 | 5 |
| Low | 0 | 1 | 2 |
| **Total** | **0** | **6** | **7** |

**No open issues. 7 deferred to future milestones.**
