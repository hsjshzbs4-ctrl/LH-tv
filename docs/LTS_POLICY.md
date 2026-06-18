# LH-TV v3.0 LTS Maintenance Plan

Version: v3.0.0
Branch: `release/v3.0.x`
Status: **Production / LTS**
Policy: **Stable First**

---

# 1. Project Status

PB7 Foundation 已全部完成并冻结。

当前项目进入 **Long Term Support（LTS）** 阶段。

当前目标：

* 保持稳定
* 修复 Bug
* 优化性能
* 提高可维护性
* 完善测试
* 完善文档

暂停：

* PB8 Cloud
* 新功能开发
* 新架构设计
* Breaking Change

---

# 2. Current Branch

唯一维护分支：

```
release/v3.0.x
```

禁止：

```
develop/*
feature/*
pb8-cloud
```

PB8 保留，但不开发。

---

# 3. Frozen Zone

以下目录全部冻结：

```
src/ai/**
src/ecosystem/**
src/community/**
src/enterprise/**
src/governance/**
```

禁止：

* API 修改
* 架构修改
* Registry 修改
* Governance Pipeline 修改
* Event Flow 修改
* TrustChain 修改
* Feature Flag 修改

仅允许：

* Bug Fix
* Security Fix
* Performance Optimization
* Refactor（行为一致）
* Comment
* Documentation
* Test

---

# 4. Allowed Work

允许：

## Bug Fix

修复：

* 空指针
* 边界条件
* Race Condition
* Exception
* Crash

---

## Security

允许：

* Dependency Update
* Security Patch
* Vulnerability Fix

禁止：

API Breaking

---

## Performance

允许：

* Cache Optimization
* Memory Optimization
* Startup Optimization
* Render Optimization
* Build Optimization

禁止：

改变业务逻辑。

---

## Code Cleanup

允许：

* 删除 Dead Code
* 删除 Unused Import
* 删除 Unused Export
* 删除 Duplicate Code
* Rename Local Variable

禁止：

修改 Public API。

---

## Tests

允许：

新增：

* Unit Test
* Integration Test
* Edge Case Test
* Regression Test

目标：

Coverage 持续提高。

---

## Documentation

允许：

更新：

* README
* CHANGELOG
* Architecture
* Release Notes
* API Docs
* Known Issues

---

# 5. Forbidden

禁止：

新增：

* Cloud
* Cluster
* Sync
* Telemetry
* Analytics

禁止：

* PB8 Feature
* Plugin Architecture
* Registry Rewrite
* Pipeline Rewrite
* Event Rewrite
* Governance Rewrite
* API Change
* Breaking Change

---

# 6. Maintenance Priority

Priority 1

Security

Bug

Crash

Regression

Priority 2

Performance

Memory

Startup

Bundle

Priority 3

Test

Coverage

Edge Cases

Priority 4

Documentation

Comment

Cleanup

---

# 7. Release Workflow

所有维护版本必须执行：

```
npm run lint

npm run typecheck

npm run build

npm test

npx dpdm --circular src

npm audit

npm outdated
```

必须全部通过：

```
TypeScript = 0

Build = PASS

Tests = PASS

Circular = 0
```

否则禁止发布。

---

# 8. BugFix Workflow

```
git checkout release/v3.0.x

fix

lint

typecheck

build

test

commit

tag

push
```

Tag：

```
v3.0.1

v3.0.2

v3.0.3
```

禁止：

```
v4.x
```

---

# 9. Commit Convention

Bug：

```
fix(governance): resolve registry lookup bug
```

Performance：

```
perf(runtime): reduce startup cost
```

Security：

```
security(deps): update vulnerable package
```

Docs：

```
docs: update release notes
```

Refactor：

```
refactor(enterprise): simplify internal implementation
```

---

# 10. Testing Requirements

新增 Bug 必须：

新增 Test。

Regression 必须：

永久保留。

禁止：

修 Bug 不写 Test。

---

# 11. Code Quality

推荐执行：

```
eslint --fix

ts-prune

depcheck

npm audit

npm outdated
```

建议：

定期：

```
Bundle Analyze

Startup Profile

Memory Leak Check

CPU Profile
```

---

# 12. Documentation

维护：

```
CHANGELOG.md

KNOWN_ISSUES.md

SECURITY.md

PERFORMANCE.md

README.md
```

保持同步更新。

---

# 13. Future Policy

PB8：

暂停。

未来如恢复：

必须：

```
feature/pb8-cloud
```

开发。

禁止：

修改：

```
release/v3.0.x
```

---

# 14. Core Principle

始终遵守：

```
Stability

>

Maintainability

>

Performance

>

Extensibility
```

绝不为了新功能影响线上稳定。

---

# 15. Claude Execution Rules

Claude 在 release/v3.0.x 上工作时必须遵守：

✓ 优先修 Bug

✓ 优先补测试

✓ 优先性能优化

✓ 优先文档完善

✓ 保持 API 完全兼容

✓ 保持 Governance 行为一致

✓ 保持 Event Flow 不变

✓ 保持 Registry SSOT 不变

✓ 保持 Frozen Zone 完整

禁止：

✗ 引入新架构

✗ 引入 PB8

✗ 修改 Public API

✗ Breaking Change

✗ 修改 Governance Pipeline

✗ 修改 Registry Design

✗ 修改 TrustChain

✗ 修改 EventBus Architecture

如遇涉及以上内容，必须停止执行并等待人工确认。

---

# LTS Declaration

LH-TV v3.0 已进入长期维护阶段。

Current Branch:

```
release/v3.0.x
```

Maintenance Mode:

```
LTS
```

Core Policy:

```
Stable First
```

Breaking Change:

```
NOT ALLOWED
```

PB8 Development:

```
SUSPENDED
```

This document has the highest priority for all future maintenance work.

---

# 16. Maintenance History

## Sprint #1 — 2026-06-18

**Status**: Complete
**Target**: v3.0.1 preparation

### Completed
- ✅ Quality baseline established (TypeScript 0, Build PASS, Tests 2134, Circular 0)
- ✅ ESLint + TypeScript/Vue linting configuration
- ✅ Patch upgrades: vitest 4.1.9, playwright 1.61.0, happy-dom 20.10.6, vue 3.5.38
- ✅ Bundle analysis (3 reports: Main/Preload/Renderer)
- ✅ Dependency audit (depcheck)
- ✅ Dead code analysis (ts-prune, report only)

### Blocked
- ⚠️ vue-tsc 3.x (Major — Breaking: Hybrid Mode Always On, settings renamed)
- ⚠️ npm audit fix (network timeout to npmjs.org)

### Artifacts
- `docs/lts/SecurityReport.md`
- `docs/lts/DeadCodeReport.md`
- `docs/lts/DependencyReport.md`
- `docs/lts/PerformanceReport.md`
- `docs/lts/vue-tsc-MigrationReport.md`
- `docs/lts/BundleReport-*.html` (3 files)
- `eslint.config.js`

---

## Sprint #2 — 2026-06-18

**Status**: Complete
**Target**: v3.0.1 LTS Patch Release candidate

### Completed
- ✅ **Security Remediation**: form-data + glob CVEs fixed (12→10 HIGH)
- ✅ **Dead Code Cleanup**: 66 lines removed from config.ts + http-client.ts
- ✅ **Dependency Cleanup**: rollup-plugin-visualizer removed (24 sub-packages)
- ✅ **Explicit Deps**: vue-eslint-parser added as direct devDependency
- ✅ **Security Classification**: P0/P1/P2 categorization complete
- ✅ **Bundle Audit**: Confirmed optimal lazy-loading pattern
- ✅ **Performance Baseline**: Startup ~1.6s cold, code size reduced

### Security Status
- HIGH CVEs: 10 (8 Electron runtime + 7 tar toolchain)
- All remaining require Major upgrades (blocked by LTS policy)
- Production risk: Low-Medium (controlled content sources)
- Toolchain risk: Low (controlled build environment)

### Cleanup Summary
- `electron/utils/config.ts`: 117→49 lines (58% reduction)
- `electron/utils/http-client.ts`: 67→52 lines (22% reduction)
- `node_modules`: 814→790 packages (-24)

### Artifacts
- `docs/lts/SecurityRemediation.md`
- `docs/lts/SecurityStatus.md`
- `docs/lts/DeadCodeReport-v2.md`
- `docs/lts/BundleOptimization.md`
- `docs/lts/PerformanceOptimization.md`
- `docs/lts/DependencyHealth-v2.md`

### v3.0.1 Release Assessment
- ✅ TypeScript: 0 errors
- ✅ Build: PASS
- ✅ Tests: 242 files / 2134 tests
- ✅ Circular: 0
- ✅ Lint: PASS (warnings only)
- ✅ Frozen Zone: Unchanged
- ✅ Public API: Unchanged
- ✅ Security: Improved (12→10 HIGH)
- ✅ Performance: Improved (dead code removed, deps reduced)
- ✅ No Breaking Changes

