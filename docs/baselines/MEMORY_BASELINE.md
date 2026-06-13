# Memory Baseline — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: BASELINE — Pre-Performance Testing
**Measurement Method**: Manual observation (automated benchmarks in RC2 Performance phase)

---

## Heap Memory

| Metric | Target | Measured |
|--------|--------|----------|
| Initial Heap | < 50 MB | TBD |
| Heap After 5min Idle | < 80 MB | TBD |
| Heap After 30min Usage | < 150 MB | TBD |
| Heap After Marketplace Browse | < 120 MB | TBD |
| Heap After Developer Portal Navigation | < 120 MB | TBD |

---

## Garbage Collection

| Metric | Target | Measured |
|--------|--------|----------|
| Minor GC Frequency | < 10/min | TBD |
| Major GC Frequency | < 2/min | TBD |
| GC Pause Time (avg) | < 5ms | TBD |
| GC Pause Time (max) | < 50ms | TBD |

---

## Event Listeners

| Metric | Target | Measured |
|--------|--------|----------|
| Total Listeners (idle) | < 500 | TBD |
| Listener Leaks (after nav) | 0 | TBD |
| DOM Nodes (idle) | < 2000 | TBD |
| DOM Node Leaks (after nav) | 0 | TBD |

---

## Handles & Resources

| Metric | Target | Measured |
|--------|--------|----------|
| Open File Handles | < 50 | TBD |
| Network Connections | < 10 | TBD |
| Worker Threads | < 5 | TBD |
| Timers (active) | < 20 | TBD |

---

## Resident Memory

| Metric | Target | Measured |
|--------|--------|----------|
| RSS (idle) | < 100 MB | TBD |
| RSS (active use) | < 250 MB | TBD |
| RSS (peak) | < 400 MB | TBD |
| Shared Memory | < 50 MB | TBD |

---

## Key Memory Consumers

| Component | Estimated Memory |
|-----------|-----------------|
| Vue App + Pinia Stores | ~10-20 MB |
| hls.js Player (active) | ~10-30 MB |
| Provider Sandbox Workers | ~10 MB/worker |
| Plugin Marketplace Cache | ~5-10 MB |
| Electron Chromium Runtime | ~30-50 MB |

---

## Notes

- All measurements are PLACEHOLDER values
- Actual measurements to be captured during RC2 Memory Certification
- Memory test scripts to be developed in `tests/performance/memory/`
- Chromium DevTools Memory profiler recommended for heap analysis
- Electron's `process.memoryUsage()` for RSS/heap tracking
