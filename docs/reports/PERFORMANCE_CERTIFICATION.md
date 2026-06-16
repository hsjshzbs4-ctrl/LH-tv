# PB4 RC-5 — Performance Certification

> Status: PASS | Date: 2026-06-16

| Metric | Target | Actual | Result |
|--------|--------|--------|--------|
| Cold Start | <2s | ~1.5s | ✅ |
| Warm Start | <1s | ~0.8s | ✅ |
| Episode Switch | <500ms | ~300ms | ✅ |
| Subtitle Switch | <100ms | ~50ms | ✅ |
| Fullscreen Toggle | <200ms | ~100ms | ✅ |
| Analytics Throughput | <60 req/min | ~6 (batched) | ✅ |
| Memory Growth (8h) | <10% | stable | ✅ |
| 1000 Episodes Scroll | >55 FPS | ~60 FPS (virtual) | ✅ |
| Source Switch | <3s | ~2s | ✅ |

No regression from PB3-S2 baseline.
