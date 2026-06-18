# vue-tsc 2.x → 3.x Migration Report

**Date**: 2026-06-18
**Status**: ⛔ UPGRADE BLOCKED

---

## Version Gap

| | Version |
|--|---------|
| Current | 2.2.12 |
| Target | 3.3.5 |
| Type | **Major** |

---

## Breaking Changes in 3.x

Source: https://github.com/vuejs/language-tools/releases/tag/v3.0.0

### 1. Settings Renamed

| Old | New |
|-----|-----|
| `vue.complete.casing.props` | `vue.suggest.propNameCasing` |
| `vue.complete.casing.tags` | `vue.suggest.componentNameCasing` |
| `vue.complete.defineAssignment` | `vue.suggest.defineAssignment` |

### 2. Hybrid Mode Always On

Hybrid Mode can no longer be disabled. This changes internal type-checking behavior and may surface new type errors that were previously suppressed.

### 3. Version Matching Enforced

The Vue language server now requires specific Volar versions. Mismatched versions between editor extensions and CLI tools may break.

### 4. Vue 2 Support Dropped (v3.1+)

Not applicable to LH-TV (uses Vue 3).

---

## Impact Assessment for LH-TV

| Breaking Change | Impact | Risk |
|----------------|--------|------|
| Settings renamed | Project does not configure these settings | ✅ None |
| Hybrid Mode Always On | Could reveal previously hidden type errors | ⚠️ Medium |
| Version Matching | May require coordinated upgrade of VSCode extension | ⚠️ Low |

---

## Decision: BLOCKED

**Reason**: This is a **Major** version upgrade.

Per LTS Policy Section 5:
> 禁止：API Change / Breaking Change

Although the direct impact on LH-TV is likely low (no custom vue.complete settings), the Hybrid Mode change **may surface new type errors** that would require code changes to fix — violating the LTS principle of "no behavior change."

### Recommendation

- **Hold at 2.2.12** for the lifetime of v3.0.x LTS
- Re-evaluate for v4.0 (future major release)
- Monitor upstream for critical security fixes in the 2.x line

---

## Fallback

If a critical security fix requires upgrading past 2.x:

1. Create a dedicated branch from `release/v3.0.x`
2. Upgrade vue-tsc in isolation
3. Run `npm run typecheck` and fix all new errors
4. Run full test suite
5. Submit as a dedicated maintenance PR with the tag `security(deps): upgrade vue-tsc to 3.x`
