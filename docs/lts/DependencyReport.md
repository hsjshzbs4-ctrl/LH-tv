# Dependency Report — Sprint #1

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`
**Tool**: depcheck 1.4.7

---

## 1. Unused devDependencies

| Package | Status | Recommendation |
|---------|--------|---------------|
| `@vue/test-utils` | Unused | ✅ KEEP — used in tests, depcheck false positive |
| `madge` | Unused | ✅ KEEP — used via npx for circular dep check |
| `vue-tsc` | Unused | ✅ KEEP — used via npm run typecheck |

> All three are false positives. `@vue/test-utils` is imported in test files; `madge` is a CLI tool; `vue-tsc` is a CLI tool.

---

## 2. Missing Dependencies (False Positives)

All "Missing" flagged by depcheck are **tsconfig path aliases**:

| Alias | Maps To | Actual File |
|-------|---------|-------------|
| `@ai/*` | `src/ai/*` | ✅ Exists |
| `@platform/*` | `src/platform/*` | ✅ Exists |
| `@ecosystem/*` | `src/ecosystem/*` | ✅ Exists |
| `@community/*` | `src/community/*` | ✅ Exists |
| `@enterprise/*` | `src/enterprise/*` | ✅ Exists |
| `@governance/*` | `src/governance/*` | ✅ Exists |
| `@developer-platform/*` | `developer-platform/*` | ✅ Exists |
| `@shared/*` | `src/shared/*` | ✅ Exists |
| `@capacitor/cli` | — | ⚠️ `mobile/capacitor.config.ts` 不存在于当前工作区 |

> **Note**: `@capacitor/cli` is referenced in `mobile/capacitor.config.ts` but the `mobile/` directory does not exist in the current source tree. This is likely a leftover configuration file or a planned but unimplemented mobile feature.

---

## 3. Dependency Health Summary

| Metric | Value |
|--------|-------|
| Total Dependencies | 12 (3 prod + 9 dev before sprint) |
| Direct Dependencies | 6 |
| Dev Dependencies | 18 (after sprint additions) |
| Unused (real) | 0 |
| Missing (real) | 0 |
| False Positives | 3 unused + 27 missing |

---

## 4. Sprint #1 Additions

| Package | Type | Purpose |
|---------|------|---------|
| `eslint` ^10.5.0 | devDependency | Lint checking (Task 4) |
| `@typescript-eslint/parser` | devDependency | TypeScript ESLint parser |
| `@typescript-eslint/eslint-plugin` | devDependency | TypeScript ESLint rules |
| `eslint-plugin-vue` ^10.9.2 | devDependency | Vue ESLint rules |
| `rollup-plugin-visualizer` ^7.0.1 | devDependency | Bundle analysis (Task 7) |

---

## 5. Upgraded (Wanted Versions)

| Package | From | To | Type |
|---------|------|----|------|
| `@playwright/test` | 1.60.0 | 1.61.0 | Patch |
| `@vitest/coverage-v8` | 4.1.8 | 4.1.9 | Patch |
| `happy-dom` | 20.10.3 | 20.10.6 | Patch |
| `vitest` | 4.1.8 | 4.1.9 | Patch |
| `vue` | 3.5.35 | 3.5.38 | Patch |

---

## 6. Held Back (LTS Policy)

| Package | Current | Latest | Reason |
|---------|---------|--------|--------|
| `electron` | 34.3.0 | 42.4.1 | Major — Breaking Change |
| `electron-builder` | 25.1.8 | 26.15.3 | Major — Breaking Change |
| `electron-vite` | 3.1.0 | 5.0.0 | Major — Breaking Change |
| `@vitejs/plugin-vue` | 5.2.4 | 6.0.7 | Major — Breaking Change |
| `typescript` | 5.9.3 | 6.0.3 | Major — Breaking Change |
| `vue-router` | 4.6.4 | 5.1.0 | Major — Breaking Change |
| `vue-tsc` | 2.2.12 | 3.3.5 | Major — Breaking Change (see MigrationReport) |
| `puppeteer-core` | 24.43.1 | 25.1.0 | Major — Breaking Change |
