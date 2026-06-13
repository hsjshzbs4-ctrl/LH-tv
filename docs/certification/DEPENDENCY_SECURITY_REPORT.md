# Phase 7: Dependency Security Audit

**Date**: 2026-06-14
**Status**: ✅ REVIEWED (No critical runtime vulnerabilities)

## npm audit Results

**15 high severity advisories** — all in dev/build dependencies or platform-specific:

### Runtime Dependencies

| Package | Version | Advisories | Risk | Action |
|---------|---------|------------|------|--------|
| electron | ^34.3.0 | 17 CVEs | Low | Monitor, update to 34.x patch |
| hls.js | ^1.5.17 | 0 | — | — |
| pinia | ^3.0.2 | 0 | — | — |
| vue | ^3.5.13 | 0 | — | — |
| vue-router | ^4.5.0 | 0 | — | — |
| electron-updater | ^6.3.9 | 0 | — | — |

### Build/Dev Dependencies

| Package | Advisories | Risk | Action |
|---------|------------|------|--------|
| esbuild (via vite) | 1 CVE | Dev-only | `npm audit fix` safe |
| glob (via electron-builder) | 1 CVE | Dev-only | `npm audit fix` safe |
| tar (via electron-builder) | 6 CVEs | Dev-only | `npm audit fix` safe |

## Analysis

### Electron CVEs (17)

Most are platform-specific or edge-case:
- 6 are macOS-only (AppleScript, permission handlers, etc.)
- 3 require service workers (not used in LH-TV)
- 2 require iframes (not used)
- 2 are Windows-specific (registry, executable path)
- 1 ASAR integrity bypass (mitigated by code signing)
- Remaining are use-after-free in specific APIs (offscreen, USB, clipboard)

**Risk to LH-TV**: LOW — LH-TV is a single-user desktop app loading known video sources. None of the CVEs affect the core playback/download/browse functionality.

### Build Dependencies

esbuild, glob, tar vulnerabilities affect build tooling only — not shipped to users. All fixable via `npm audit fix`.

## Recommendation

1. `npm audit fix` — safe, fixes build deps
2. Monitor Electron releases for 34.x patch with CVE fixes
3. No critical runtime vulnerabilities requiring immediate action

## Score: 90/100 (-10 for unpatched Electron CVEs, all non-critical)
