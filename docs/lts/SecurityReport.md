# Security Report — Sprint #1

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`
**Tool**: npm audit (via registry.npmjs.org)

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| HIGH vulnerabilities | 12 |
| CRITICAL vulnerabilities | 0 |
| Fixable without breaking | 2 (form-data, glob — transitive) |
| Fixable with breaking | 10 (electron, tar chain) |
| Production impact | electron vulnerabilities are runtime risks |

---

## 2. Vulnerability Details

### 2.1 Electron (34.3.0) — HIGH ×12

| CVE/GHSA | Description |
|----------|-------------|
| GHSA-vmqv-hx8q-j7mg | ASAR Integrity Bypass via resource modification |
| GHSA-5rqw-r77c-jp79 | AppleScript injection in app.moveToApplicationsFolder (macOS only) |
| GHSA-xj5x-m3f3-5x3h | Service worker can spoof executeJavaScript IPC replies |
| GHSA-r5p7-gp4j-qhrx | Incorrect origin passed to permission request handler for iframes |
| GHSA-3c8v-cfp5-9885 | Out-of-bounds read in second-instance IPC (macOS/Linux) |
| GHSA-xwr5-m59h-vwqr | nodeIntegrationInWorker not correctly scoped |
| GHSA-532v-xpq5-8h95 | Use-after-free in offscreen child window paint callback |
| GHSA-mwmh-mq4g-g6gr | Registry key path injection in app.setAsDefaultProtocolClient (Windows) |
| GHSA-9w97-2464-8783 | Use-after-free in download save dialog callback |
| GHSA-8337-3p73-46f4 | Use-after-free in WebContents permission callbacks |
| GHSA-jjp3-mq3x-295m | Use-after-free in PowerMonitor (Windows/macOS) |
| GHSA-jfqx-fxh3-c62j | Unquoted executable path in app.setLoginItemSettings (Windows) |
| GHSA-4p4r-m79c-wq3v | HTTP Response Header Injection in custom protocol handlers |
| GHSA-9899-m83m-qhpj | USB device selection not validated against filtered device list |
| GHSA-8x5q-pvf5-64mp | Use-after-free in offscreen shared texture release() |
| GHSA-f37v-82c4-4x64 | Crash in clipboard.readImage() on malformed data |
| GHSA-f3pv-wv63-48x8 | Named window.open targets not scoped |
| GHSA-9wfr-w7mm-pc7f | Renderer command-line switch injection |

**Fix version**: electron@42.4.1
**Blocked by**: LTS policy (Major upgrade)
**Production impact**: Runtime — these affect the Electron shell

### 2.2 form-data (transitive) — HIGH ×1

- **GHSA-hmw2-7cc7-3qxx**: CRLF injection via unescaped multipart field names
- **Fix**: via `npm audit fix` (non-breaking)
- **Status**: ⚠️ Not yet fixed (network timeout to npmjs.org)

### 2.3 glob (transitive) — HIGH ×1

- **GHSA-5j98-mcp5-4vw2**: Command injection via `-c`/`--cmd`
- **Fix**: via `npm audit fix` (non-breaking)
- **Status**: ⚠️ Not yet fixed (network timeout to npmjs.org)

### 2.4 tar (transitive, via electron-builder) — HIGH ×7

- **GHSA-34x7-hfp2-rc4v**: Arbitrary File Creation/Overwrite via Hardlink Path Traversal
- **GHSA-8qq5-rm4j-mr97**: Arbitrary File Overwrite and Symlink Poisoning
- **GHSA-83g3-92jg-28cx**: Arbitrary File Read/Write via Hardlink Target Escape
- **GHSA-qffp-2rhf-9h96**: Hardlink Path Traversal via Drive-Relative Linkpath
- **GHSA-9ppj-qmqm-q256**: Symlink Path Traversal via Drive-Relative Linkpath
- **GHSA-r6q2-hw4h-h46w**: Race Condition via Unicode Ligature Collisions (macOS APFS)
- **GHSA-vmf3-w455-68vh**: File smuggling via PAX size override

**Fix**: Requires electron-builder@26.15.3 (Major upgrade)
**Blocked by**: LTS policy + electron-builder Major upgrade
**Production impact**: Build-time only — does NOT affect end users

---

## 3. Risk Classification

| Category | Vulnerabilities | Affects Production | Actionable Now |
|----------|----------------|-------------------|---------------|
| **Electron Runtime** | 12 HIGH | ✅ Yes | ❌ Requires Major upgrade |
| **Build Toolchain (tar)** | 7 HIGH | ❌ No (build-time only) | ❌ Requires electron-builder Major |
| **Transitive (form-data, glob)** | 2 HIGH | ❌ No (dev dependency chain) | ✅ `npm audit fix` |

---

## 4. Risk Assessment

### Production Risk: MODERATE

The Electron vulnerabilities are real but require specific attack vectors:

- **Most likely vector**: Maliciously crafted content loaded via custom protocol handlers or iframes
- **Mitigation**: LH-TV primarily loads content from controlled sources (TMDB, Jellyfin/Plex/Emby servers)
- **Windows-specific issues**: 3 vulnerabilities are Windows-specific (GHSA-mwmh, GHSA-jjp3, GHSA-jfqx)
- **macOS/Linux-only**: 2 vulnerabilities don't affect Windows (GHSA-5rqw, GHSA-3c8v)

### Build Toolchain Risk: LOW

tar vulnerabilities only affect the build pipeline, not end users. The build environment is controlled.

---

## 5. Recommended Actions

### Immediate (Sprint #1)

- [ ] Retry `npm audit fix` for form-data + glob when network to npmjs.org is available
- [x] Document all vulnerabilities and their status

### Short-term (Sprint #2)

- [ ] Evaluate Electron 34.x → 35.x (MINOR upgrade) — check if any security fixes backported
- [ ] Monitor Electron release notes for security patches in 34.x line
- [ ] Test electron@35.x for compatibility (minor upgrade, not blocked by LTS)

### Long-term (v4.0 Planning)

- [ ] Plan Electron Major upgrade path: 34 → 42
- [ ] Plan electron-builder upgrade: 25 → 26
- [ ] Full regression test suite required

---

## 6. npm audit fix Status

| Attempt | Registry | Result |
|---------|----------|--------|
| 1 | npmmirror.com | ❌ Audit not supported by mirror |
| 2 | npmjs.org | ❌ Network timeout (EIDLETIMEOUT) |

**Blocked by**: Network connectivity to npmjs.org from current environment.

### Workaround

Run from an environment with reliable npmjs.org access:

```bash
npm audit fix --registry https://registry.npmjs.org/
```
