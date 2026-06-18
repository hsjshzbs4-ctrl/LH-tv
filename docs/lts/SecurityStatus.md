# Security Status — Sprint #2

**Date**: 2026-06-18
**Branch**: `release/v3.0.x`

---

## 1. Overall Status

| Metric | Value |
|--------|-------|
| HIGH CVEs (resolved) | 2 ✅ |
| HIGH CVEs (remaining) | 10 |
| CRITICAL CVEs | 0 |
| Production Impact CVEs | 8 (Electron only) |
| Toolchain Only CVEs | 7 (tar/electron-builder) |
| Security Score | **Improved** (12→10) |

---

## 2. Classification

### P0 — Critical (Action Required)
None.

### P1 — Production Impact (Monitor)

| CVE Group | Count | Vector | Exploitability |
|-----------|-------|--------|---------------|
| Electron ASAR bypass | 1 | Local file modification | Low (signed builds) |
| Electron IPC spoofing | 1 | Service worker | Low (no service workers) |
| Electron permission bypass | 1 | iframe origin | Low (controlled sources) |
| Electron Use-after-free ×5 | 5 | Various callbacks | Low-Medium |
| Electron injection ×3 | 3 | Windows-specific (Registry, exe path, command-line) | Low (controlled environment) |

**Overall Production Risk: LOW-MEDIUM**

LH-TV's threat model:
- Loads video content from user-configured media servers (Jellyfin/Plex/Emby)
- Loads metadata from TMDB/Bangumi/TVMaze APIs
- Does NOT load arbitrary web content
- Does NOT use service workers
- Does NOT use custom protocol handlers for untrusted content

### P2 — Toolchain Only (No Urgency)

| CVE Group | Count | Affects |
|-----------|-------|---------|
| node-tar path traversal ×5 | 5 | Build pipeline |
| node-tar file smuggling ×2 | 2 | Build pipeline |

**Toolchain Risk: LOW** — Build environment is controlled.

---

## 3. Dependency Security

| Dependency | Version | Known CVEs | Upgrade Path |
|-----------|---------|-----------|-------------|
| electron | 34.3.0 | 18 CVEs | 42.4.1 (Major) |
| electron-builder | 25.1.8 | 0 direct, 7 transitive | 26.15.3 (Major) |
| electron-vite | 3.1.0 | 0 | 5.0.0 (Major) |
| vue | 3.5.38 | 0 | ✅ Current |
| typescript | 5.9.3 | 0 | 6.0.3 (Major) |
| All other deps | Latest wanted | 0 | ✅ Current |

---

## 4. npm audit Status

```
10 high severity vulnerabilities

→ 8: electron (requires Major → BLOCKED by LTS)
→ 7: tar/electron-builder (requires Major → BLOCKED by LTS)

To address all issues (including breaking changes), run:
  npm audit fix --force
```

---

## 5. Recommendations

### Immediate
- ✅ form-data + glob vulnerabilities resolved

### Short-term
- [ ] Monitor [Electron Security Releases](https://www.electronjs.org/releases/stable) for 34.x patches
- [ ] If electron@34.x receives a security backport, upgrade immediately

### Long-term (v4.0)
- [ ] Upgrade electron to 42.x
- [ ] Upgrade electron-builder to 26.x
- [ ] Full regression test suite
- [ ] Security penetration test on new Electron version
