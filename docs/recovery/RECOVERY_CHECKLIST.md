# Recovery Checklist — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN

---

## 1. Repository Recovery

- [ ] Git branch `release/rc2-candidate` exists OR can be created from snapshot
- [ ] Git tag `v2.0-rc2-candidate` exists OR can be created
- [ ] Git tag `pre-performance-certification` exists OR can be created
- [ ] All source files present (202 TypeScript/Vue files)
- [ ] All snapshot documents present (9 files in `docs/snapshots/`)
- [ ] All baseline documents present (5 files in `docs/baselines/`)

---

## 2. Build Recovery

- [ ] `npm install` / `npm ci` completes without errors
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run build` completes successfully
- [ ] Build output in `out/` directory (83 files)
- [ ] `package.json` scripts intact
- [ ] `tsconfig.json` path aliases intact
- [ ] `electron.vite.config.ts` intact

---

## 3. Test Recovery

- [ ] `npx vitest run` passes (66 files, 488 tests)
- [ ] Architecture tests pass (8 files)
- [ ] Unit tests pass (~15 files)
- [ ] Integration tests pass (13 files)
- [ ] Persistence tests pass (7 files)
- [ ] Stress tests pass (8 files)
- [ ] Plugin marketplace tests pass (7 files)
- [ ] Marketplace UI tests pass (2 files)
- [ ] Developer platform tests pass (3 files)

---

## 4. Architecture Recovery

- [ ] `npx madge --circular src` reports 0 cycles
- [ ] Layer dependency direction validated (Views → Facades → Managers → Shared)
- [ ] Provider contracts layer isolated (no cycles)
- [ ] No Views directly importing Managers (Facade pattern enforced)
- [ ] No `window.app.xxx()` calls in renderer
- [ ] No direct `localStorage` access in renderer

---

## 5. Marketplace Recovery

- [ ] Marketplace Core modules present (7 modules, 18 files)
- [ ] Marketplace UI present (6 pages, 6 components, 3 stores, 2 services)
- [ ] Plugin lifecycle state machine intact
- [ ] 7 permission types registered
- [ ] Signature verification (SHA256/SHA512) intact
- [ ] Plugin update pipeline intact
- [ ] Marketplace routes functional (6 routes)

---

## 6. Developer Portal Recovery

- [ ] Developer Platform services present (7 modules)
- [ ] Portal pages present (6 pages)
- [ ] Publishing pipeline intact (Upload → Validate → Scan → Review → Publish)
- [ ] Review workflow intact (SUBMITTED → APPROVED/REJECTED/CHANGES_REQUESTED)
- [ ] Repository registry functional
- [ ] Analytics service functional
- [ ] Notification service functional
- [ ] Developer Portal routes functional (6 routes)

---

## 7. Route Recovery

- [ ] All 24 routes defined in `src/router/index.ts`
- [ ] Core routes (12): `/`, `/tv`, `/movies`, `/anime`, `/search`, `/play`, `/downloads`, `/library`, `/favorites`, `/history`, `/settings`, `/user`
- [ ] Marketplace routes (6): `/marketplace`, `/marketplace/plugin/:id`, `/plugins/installed`, `/plugins/updates`, `/plugins/permissions`, `/plugins/developer`
- [ ] Developer Portal routes (6): `/developer`, `/developer/publish`, `/developer/plugins`, `/developer/analytics`, `/developer/review`, `/developer/account`
- [ ] Sidebar navigation items include marketplace and developer entries
- [ ] Fallback route `/:pathMatch(.*)*` redirects to `/`

---

## 8. Analytics Recovery

- [ ] Plugin analytics service present (`developer-platform/analytics/`)
- [ ] Metrics tracked: downloads, installs, uninstalls, crash rate, active users
- [ ] Analytics page loads without errors

---

## 9. Documentation Recovery

- [ ] `docs/snapshots/RC2_CANDIDATE_SNAPSHOT.md` — Master snapshot
- [ ] `docs/snapshots/FEATURE_INVENTORY.md` — 146 features
- [ ] `docs/snapshots/ROUTES_SNAPSHOT.md` — 24 routes
- [ ] `docs/snapshots/ARCHITECTURE_SNAPSHOT.md` — Layer architecture
- [ ] `docs/snapshots/DEPENDENCY_SNAPSHOT.md` — Module relationships
- [ ] `docs/snapshots/TEST_SNAPSHOT.md` — 488 tests
- [ ] `docs/snapshots/BUILD_SNAPSHOT.md` — Build config
- [ ] `docs/snapshots/MARKETPLACE_SNAPSHOT.md` — Marketplace state
- [ ] `docs/snapshots/DEVELOPER_PLATFORM_SNAPSHOT.md` — Developer platform state
- [ ] `docs/baselines/STARTUP_BASELINE.md`
- [ ] `docs/baselines/MEMORY_BASELINE.md`
- [ ] `docs/baselines/REPOSITORY_BASELINE.md`
- [ ] `docs/baselines/MARKETPLACE_BASELINE.md`
- [ ] `docs/baselines/DEVELOPER_BASELINE.md`
- [ ] `docs/recovery/ROLLBACK_PLAN.md`
- [ ] `docs/recovery/RECOVERY_CHECKLIST.md`
- [ ] `docs/architecture/RC2_FREEZE.md`

---

## Recovery Validation Command

```bash
npm run typecheck && npm run build && npx vitest run && npx madge --circular src && echo "RC2 RECOVERY VALIDATED"
```

All four checks must pass.
