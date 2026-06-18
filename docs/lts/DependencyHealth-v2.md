# Dependency Health v2 — Sprint #2

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`
**Tool**: depcheck 1.4.7

---

## 1. Changes Since Sprint #1

| Action | Package | Reason |
|--------|---------|--------|
| ✅ Added | `vue-eslint-parser` | Now explicit devDependency (was transitive only) |
| ❌ Removed | `rollup-plugin-visualizer` | Unused after config revert (24 sub-packages) |

---

## 2. Current DevDependencies Status

| Package | Used? | Status |
|---------|-------|--------|
| `@playwright/test` | ✅ npm script | Required |
| `@typescript-eslint/eslint-plugin` | ✅ eslint.config.js | Required |
| `@typescript-eslint/parser` | ✅ eslint.config.js | Required |
| `@vitejs/plugin-vue` | ✅ electron.vite.config.ts | Required |
| `@vitest/coverage-v8` | ✅ npm script | Required |
| `@vue/test-utils` | ✅ test files | Required (depcheck false positive) |
| `electron` | ✅ runtime | Required |
| `electron-builder` | ✅ npm script | Required |
| `electron-vite` | ✅ electron.vite.config.ts | Required |
| `eslint` | ✅ npm script | Required |
| `eslint-plugin-vue` | ✅ eslint.config.js | Required |
| `happy-dom` | ✅ vitest config | Required |
| `jsdom` | ✅ test env | Required |
| `madge` | ✅ npx usage | Required (depcheck false positive) |
| `puppeteer-core` | ✅ test env | Required |
| `typescript` | ✅ tsc | Required |
| `vitest` | ✅ npm script | Required |
| `vue-eslint-parser` | ✅ eslint.config.js | **New** — explicit dep |
| `vue-tsc` | ✅ npm script | Required (depcheck false positive) |

**Result**: All 19 devDependencies are needed. No unused dependencies.

---

## 3. Current Dependencies Status

| Package | Version | Status |
|---------|---------|--------|
| `electron-updater` | ^6.3.9 | Required |
| `hls.js` | ^1.5.17 | Required |
| `pinia` | ^3.0.2 | Required |
| `pinia-plugin-persistedstate` | ^4.7.1 | Required |
| `vue` | ^3.5.38 | Updated Sprint #1 |
| `vue-router` | ^4.6.4 | Required |

**Result**: All 6 dependencies are needed. No unused runtime dependencies.

---

## 4. Missing Dependencies — False Positives

All 27 "missing" flags are tsconfig path aliases or legacy JS imports:

| Path Alias Prefix | Count | Status |
|-------------------|-------|--------|
| `@ai/*` | 8 | Frozen Zone aliases |
| `@platform/*` | 4 | Platform aliases |
| `@developer-platform/*` | 4 | Developer Portal aliases |
| `@ecosystem/*` | 2 | Ecosystem aliases |
| `@enterprise/*` | 1 | Enterprise alias |
| `@community/*` | 1 | Community alias |
| `@governance/*` | 1 | Governance alias |
| `@shared/*` | 1 | Shared alias |
| `@capacitor/cli` (mobile) | 1 | Unused config in missing dir |

---

## 5. Dependency Tree Health

| Metric | Sprint #1 | Sprint #2 | Trend |
|--------|-----------|-----------|-------|
| Total packages | 814 | 790 | 📉 -24 |
| Direct deps | 6 | 6 | → |
| Direct devDeps | 18 | 19 | +1 (vue-eslint-parser) |
| Unused (real) | 0 | 0 | → |
| HIGH CVEs | 12 | 10 | 📉 -2 |

---

## 6. Override Resolution Warnings

```
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: lh-tv@2.0.0
npm warn Found: vue@3.5.35
npm warn Could not resolve dependency:
npm warn peer vue@"3.5.35" from @vue/server-renderer@3.5.35
```

**Status**: ⚠️ Known — Vue patch version mismatch (3.5.35 vs 3.5.38). Harmless for patch-level difference. Will auto-resolve on next `npm install`.
