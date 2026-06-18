# Security Remediation — Sprint #2

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`

---

## Remediation Applied

| Package | Vulnerability | Severity | Action | Status |
|---------|-------------|----------|--------|--------|
| `form-data` (transitive) | GHSA-hmw2-7cc7-3qxx — CRLF injection | HIGH | `npm audit fix` | ✅ FIXED |
| `glob` (transitive) | GHSA-5j98-mcp5-4vw2 — Command injection | HIGH | `npm audit fix` | ✅ FIXED |

### Before
```
12 high severity vulnerabilities
```

### After
```
10 high severity vulnerabilities
```

**2 HIGH vulnerabilities resolved via non-breaking patch updates.**

---

## Remaining Vulnerabilities

### Electron (34.3.0) — 8 HIGH CVEs (consolidated 18 advisories)
- Fix version: electron@42.4.1 (Major)
- **Blocked**: LTS policy prohibits Major upgrades
- **Impact**: Runtime — affects the Electron shell
- **Mitigation**: LH-TV loads content from controlled sources (TMDB, Jellyfin, Plex, Emby); browser-facing CVEs have limited attack surface

### tar (transitive, via electron-builder) — 7 HIGH CVEs
- Fix version: electron-builder@26.15.3 (Major)
- **Blocked**: LTS policy prohibits Major upgrades
- **Impact**: Build-time only — does NOT affect end users
- **Mitigation**: Build environment is controlled; only affects `npm run dist`

---

## Vulnerability Trend

| Sprint | HIGH CVEs | Notes |
|--------|-----------|-------|
| Sprint #1 | 12 | Initial audit |
| Sprint #2 | 10 | form-data + glob fixed |

---

## npm audit fix Log

```
changed 4 packages, and audited 814 packages in 4m
→ form-data: vulnerable glob dependency updated
→ glob: updated to non-vulnerable version
→ Remaining: electron (Major) + tar/electron-builder (Major)
```

---

## Action Items for Sprint #3+

- [ ] Monitor Electron 34.x line for security backports
- [ ] Evaluate electron@35.x (Minor upgrade) for partial CVE mitigation
- [ ] Plan electron-builder 25→26 upgrade path for v4.0
