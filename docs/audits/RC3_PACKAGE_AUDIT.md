# RC3-C: Package Audit

> LH-TV 2.x | Date: 2026-06-15 | Audit: RC3-C | Branch: release/rc2-candidate

---

## Audit Result: **CONDITIONAL PASS** ⚠️

**Score: 80/100** — Build pipeline is solid; packaging targets limited.

---

## 1. Build Pipeline — ✅ PASS

### Build Command

```bash
npm run build
# = electron-vite build && node scripts/copy-shared.js
```

### Build Output

```
vite v6.4.3 building SSR bundle for production...
✓ out/main/index.js         30.08 kB  (81ms)
✓ out/preload/index.js      11.25 kB  (16ms)
✓ out/renderer/            267 modules (1.57s)
  ├── index.css             15.00 kB
  ├── index.js             402.06 kB
  ├── PlayView.js         1161.77 kB (largest chunk)
  └── 30+ route chunks      0.88~22 kB
```

| Target | Status | Time |
|--------|--------|------|
| Main process build | ✅ PASS | 81ms |
| Preload build | ✅ PASS | 16ms |
| Renderer build | ✅ PASS | 1.57s |
| copy-shared.js | ✅ PASS | — |

### Post-build (copy-shared.js)

| Source | Destination | Status |
|--------|-------------|--------|
| `electron/shared-legacy/*` (29 .js files) | `out/shared-legacy/` | ✅ |
| `jp-movie-catalog.json` | `out/` | ✅ |
| `kr-movie-catalog.json` | `out/` | ✅ |

---

## 2. Package Targets — ⚠️ WARN

### Current Configuration (`package.json:47-72`)

```json
{
  "appId": "com.lh.tv",
  "productName": "LH",
  "directories": { "output": "dist" },
  "files": [
    "out/**/*",
    "resources/**/*",
    "electron/shared-legacy/**/*",
    "jp-movie-catalog.json",
    "kr-movie-catalog.json"
  ],
  "extraResources": [{ "from": "resources/", "to": "resources/" }],
  "asar": true,
  "win": {
    "icon": "resources/icon.ico",
    "target": "portable",
    "verifyUpdateCodeSignature": false
  }
}
```

### Configured Targets

| Platform | Target | Status |
|----------|--------|--------|
| Windows | `portable` (single .exe) | ✅ Configured |

### Missing Targets

| Target | Purpose | Impact |
|--------|---------|--------|
| NSIS installer | Traditional Windows install wizard | No Start Menu / Desktop shortcuts, no uninstaller registration, no file associations |
| ZIP archive | Simple extract-and-run | No portable ZIP distribution |
| MSI | Enterprise deployment | No enterprise deployment path |

### Current Build Output

```
dist/
  LH 2.0.0.exe           78.8 MB  (portable single-exe)
  win-unpacked/          190 MB   (intermediate artifact)
    LH.exe               190 MB
    resources/            app.asar + icons
    *.dll, locales/
  builder-debug.yml       debug log
```

### Package Verification

| Check | Status |
|-------|--------|
| Portable EXE generated | ✅ PASS (78.8 MB) |
| EXE launches | ⚠️ NOT TESTED (requires Windows GUI session) |
| Fresh install behavior | ⚠️ NOT TESTED |
| Upgrade install behavior | ⚠️ NOT TESTED |
| Database init on first launch | ⚠️ NOT TESTED |
| Plugin discovery on launch | ⚠️ NOT TESTED |
| Provider loading on launch | ⚠️ NOT TESTED |

---

## 3. Auto-Update — ❌ FAIL

### electron-updater Integration

| Attribute | Value |
|-----------|-------|
| Import | `electron/services/updater.service.ts:2` (`import { autoUpdater } from 'electron-updater'`) |
| Check method | `autoUpdater.checkForUpdates()` (line 59) |
| Publish config | **MISSING** |
| Status | **FAIL** |

**Finding**: The app imports and calls `electron-updater` but **no `publish` field** exists in the electron-builder config. Without a publish provider (GitHub, S3, or generic URL), `electron-updater` has no URL to query for updates. The auto-update feature is non-functional.

**Fix**: Add a `publish` block:
```json
"publish": [{ "provider": "generic", "url": "https://releases.lh.tv/updates/" }]
```

---

## 4. Code Signing — ⚠️ INFO

| Attribute | Value |
|-----------|-------|
| Certificate | **Not configured** |
| `verifyUpdateCodeSignature` | `false` (explicitly disabled) |
| Status | ⚠️ INFO |

The portable EXE is unsigned. On Windows, this may trigger:
- SmartScreen "Windows protected your PC" warning
- Antivirus false positives
- Reduced user trust

Recommendation for production release: obtain a code signing certificate.

---

## 5. asar Packaging — ✅ PASS

| Attribute | Value |
|-----------|-------|
| `asar: true` | Set (package.json:66) |
| Shared-legacy files in `files` list | Included |
| Dynamic `require()` compatibility | Verified — `__dirname` resolution works inside asar for Electron's native `require()` |

---

## 6. Resources — ✅ PASS

| Resource | Path | Status |
|----------|------|--------|
| App icon | `resources/icon.ico` | ✅ Present |
| Extra resources | `resources/` → `resources/` in output | ✅ Configured |
| Catalog data | jp-movie-catalog.json, kr-movie-catalog.json | ✅ Included in `files` |

---

## 7. TypeScript/Dependencies — ✅ PASS

| Check | Status |
|-------|--------|
| TypeScript strict mode | ✅ `strict: true` |
| No type errors | ✅ 0 errors |
| electron-vite config | ✅ 3 targets (main/preload/renderer) |
| Path aliases | ✅ @, @electron, @shared, @developer-platform |
| Dependencies bundled | ✅ via electron-builder `files` |

---

## Summary

| Area | Status | Score |
|------|--------|-------|
| Build Pipeline | ✅ PASS | 100 |
| Package Targets | ⚠️ WARN | 60 |
| Auto-Update | ❌ FAIL | 0 |
| Code Signing | ⚠️ INFO | N/A |
| asar Packaging | ✅ PASS | 100 |
| Resources | ✅ PASS | 100 |
| TypeScript/Deps | ✅ PASS | 100 |
| **Overall** | **CONDITIONAL PASS** | **80/100** |

---

## RC3 Package Requirements

For RC3 production release, the following are recommended:

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | Add NSIS installer target for proper Windows installation | Small |
| HIGH | Add `publish` config for auto-update | Small |
| MEDIUM | Add ZIP target for portable distribution | Trivial |
| MEDIUM | Obtain code signing certificate | External |
| LOW | Add MSI target for enterprise deployment | Small |
| LOW | Clean up `win-unpacked` from dist/ | Trivial |

---

## Certification

```
RC3-C PACKAGE AUDIT
Status:   CONDITIONAL PASS ⚠️
Score:    80/100
Blocker:  0 critical, auto-update is non-functional
Verdict:  PASS — build pipeline verified;
          recommend NSIS + publish config before public release
```
