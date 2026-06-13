# Build Snapshot — LH-TV 2.0 RC2

**Date**: 2026-06-14
**Status**: FROZEN

---

## Build Summary

| Metric | Value |
|--------|-------|
| Build Tool | electron-vite 3.0 |
| Vite Version | 5.x |
| TypeScript | 5.7.3 |
| Build Result | ✅ PASS |

---

## Build Configuration

### Main Process
```
Input: electron/main.ts
Output: out/main/
Plugins: externalizeDepsPlugin
Aliases: @electron → electron/, @shared → src/shared/
```

### Preload
```
Input: electron/preload.ts
Output: out/preload/
Plugins: externalizeDepsPlugin
Aliases: @shared → src/shared/
```

### Renderer
```
Input: index.html
Output: out/renderer/
Plugins: @vitejs/plugin-vue
Aliases: @ → src/
```

---

## Output Artifacts

| Directory | Contents |
|-----------|----------|
| `out/main/` | Main process bundle |
| `out/preload/` | Preload script bundle |
| `out/renderer/` | Renderer bundle (Vue app) |

### Build Metrics

| Metric | Value |
|--------|-------|
| Total Output Files | 83 |
| Total Size | ~2.9 MB |
| Main Process Size | Included in count |
| Renderer Size | Included in count |

---

## TypeScript Configuration

```json
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": true,
  "skipLibCheck": true,
  "noEmit": true,
  "jsx": "preserve",
  "jsxImportSource": "vue"
}
```

### Path Aliases

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@electron/*` | `electron/*` |
| `@shared/*` | `src/shared/*` |
| `@provider-contracts` | `src/provider-contracts/index.ts` |
| `@provider-contracts/*` | `src/provider-contracts/*` |
| `@developer-platform` | `developer-platform/index.ts` |
| `@developer-platform/*` | `developer-platform/*` |

---

## Package Configuration

| Field | Value |
|-------|-------|
| App ID | com.lh.tv |
| Product Name | LH |
| Output Directory | dist/ |
| ASAR | true |
| Windows Target | portable |
| Build Tool | electron-builder 25.1.8 |

### Included Files
```
out/**/*
resources/**/*
electron/shared-legacy/**/*
jp-movie-catalog.json
kr-movie-catalog.json
```

---

## TypeCheck

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ 0 errors |
| Strict mode | ✅ enabled |
| Skip lib check | ✅ enabled |
| Isolated modules | ✅ enabled |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development (electron-vite dev) |
| `npm run build` | Build (electron-vite build + copy-shared) |
| `npm run dist` | Package (build + electron-builder) |
| `npm run typecheck` | Type check (tsc --noEmit) |
| `npm run test` | Run all tests (vitest run) |
| `npm run test:rc` | Full RC check (typecheck + build + vitest + playwright) |
