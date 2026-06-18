# LH-TV v3.0.x LTS

# Claude Execution Specification

## PB7 Foundation Long-Term Maintenance Edition

Version: v3.0.1 LTS
Branch: release/v3.0.x
Status: Production Stable
Effective: Immediately

---

# 1. Project Status

LH-TV 已完成 PB7 全部开发阶段。

PB7 Foundation 已正式冻结。

当前项目生命周期进入：

> **Long Term Support（LTS）维护阶段**

项目目标：

* 保持长期稳定运行
* 修复 Bug
* 修复安全漏洞
* 提高代码质量
* 提高性能
* 增强测试覆盖率
* 完善文档

除此之外，不进行任何功能扩展。

---

# 2. Current Branch

唯一维护分支：

release/v3.0.x

当前版本：

v3.0.1

所有维护工作必须基于：

release/v3.0.x

进行。

禁止切换开发主线。

---

# 3. PB7 Foundation Status

PB7 已全部完成：

* PB7-S3 Runtime Foundation
* PB7-S4 Community Platform
* PB7-S5 Enterprise Integration
* PB7-S5.1 Governance Enhancement
* PB7-S6 Governance Policy

状态：

CERTIFIED

Production Ready

Foundation Complete

任何 PB7 架构默认视为稳定设计。

不得重新设计。

---

# 4. PB8 Policy

PB8：

永久暂停。

Claude 必须默认：

PB8 不存在。

禁止：

Cloud

Cluster

Sync

Telemetry

Analytics

Multi-node

Distributed

Cloud Runtime

Cloud Governance

Cloud Adapter

Cloud Registry

Cloud Pipeline

Cloud Feature

Cloud API

Cloud Architecture

任何 PB8 提议：

直接拒绝。

---

# 5. LTS Goal

LTS 唯一目标：

稳定

兼容

维护

修复

优化

绝不增加复杂度。

---

# 6. Priority

稳定性

>

安全性

>

兼容性

>

性能

>

代码质量

>

可维护性

>

可扩展性

禁止为了未来扩展修改当前稳定代码。

---

# 7. Allowed Work

Claude 可以执行：

Bug Fix

Security Fix

Crash Fix

Null Check

Boundary Check

Exception Fix

Memory Leak

Performance Optimization

Type Optimization

Code Cleanup

Documentation Update

Comment Update

Unit Test

Integration Test

Regression Test

Internal Refactor

Dead Code Analysis

Bundle Analysis

Build Optimization

Patch Dependency Upgrade

Minor Dependency Evaluation

Security Audit

Dependency Audit

Lint Configuration

CI Improvement

Release Report

Maintenance Report

LTS Sprint Report

---

# 8. Forbidden Work

Claude 禁止：

新增功能

新增模块

新增业务

新增 Feature Flag

新增 Runtime

新增 Governance Layer

新增 Pipeline

新增 Registry

新增 EventBus

新增 Adapter

新增 Cloud

新增 Sync

新增 Cluster

新增 Telemetry

新增 Analytics

新增 Enterprise Feature

新增 Community Feature

新增 Marketplace Feature

新增 API

修改 API

删除 API

修改 Contract

修改 Pipeline

修改 Runtime Flow

修改 Registry Flow

Breaking Change

Architecture Rewrite

PB8 Development

任何涉及上述内容：

立即停止。

---

# 9. Frozen Zone

以下目录永久冻结：

src/ai/**

src/ecosystem/**

src/community/**

src/enterprise/**

src/governance/**

禁止修改。

例外：

真实 Bug

真实 Security

真实 Crash

真实 Memory Leak

并且：

行为保持一致

Public API 保持一致

否则禁止修改。

---

# 10. Public API Rule

Public Export：

永久兼容。

禁止：

Rename

Delete

Move

Replace

Behavior Change

Contract Change

Signature Change

Parameter Change

Return Type Change

---

# 11. Internal Refactor Rule

允许：

Extract Function

Split Function

Rename Private Variable

Rename Local Variable

Extract Helper

Inline Helper

Reduce Duplication

Improve Type

Improve Readability

要求：

Before == After

行为一致。

---

# 12. Dead Code Rule

允许：

删除 private unused

删除 unreachable code

删除 duplicate code

删除 internal helper

禁止：

删除 public export

删除 barrel export

删除 compatibility API

删除 Frozen Zone export

如果工具报告 unused：

必须人工确认。

不得自动删除。

---

# 13. Dependency Rule

允许：

Patch：

x.y.z → x.y.(z+1)

Security Patch

npm audit fix

Patch Upgrade

允许评估：

Minor Upgrade

必须验证：

Build

Tests

TypeCheck

禁止：

Electron Major

TypeScript Major

Vue Router Major

Electron Builder Major

Electron-Vite Major

Vite Major

任何 Major Upgrade：

默认拒绝。

---

# 14. Security Rule

P0：

Crash

RCE

Injection

Privilege Escalation

立即修复。

P1：

High CVE

DOS

Memory Leak

尽快修复。

P2：

Dead Code

Performance

Cleanup

Sprint 修复。

P3：

Docs

Comments

Formatting

长期维护。

---

# 15. Performance Rule

允许：

Lazy Import

Cache

Reduce Allocation

Reduce Parse

Reduce IO

Reduce JSON

Reduce Config Load

Bundle Optimization

Startup Optimization

禁止：

改变业务逻辑。

禁止：

影响 API。

---

# 16. Testing Rule

每次修改必须执行：

npm run typecheck

npm run build

npm test

npx madge --circular src

npm run lint

全部 PASS：

允许提交。

否则：

继续修复。

---

# 17. Release Rule

Release 必须满足：

TypeScript = 0

Build PASS

Tests PASS

Circular = 0

Lint PASS

Working Tree Clean

Release Report Ready

Tag Ready

GitHub Release Ready

否则禁止发布。

---

# 18. Commit Convention

Bug：

fix(scope): description

Security：

fix(security): description

Performance：

perf(scope): description

Refactor：

refactor(scope): description

Maintenance：

chore(lts): description

Docs：

docs(lts): description

Test：

test(scope): description

禁止：

feat:

除非明确批准新增功能。

LTS 默认禁止 feat。

---

# 19. Sprint Workflow

需求

↓

分析

↓

设计

↓

实现

↓

TypeCheck

↓

Build

↓

Tests

↓

Circular

↓

Lint

↓

Review

↓

Commit

↓

Tag（如需要）

↓

Release（如需要）

↓

Documentation Update

---

# 20. Claude Default Behavior

Claude 默认应：

优先稳定

优先兼容

优先修复

优先优化

优先测试

优先文档

优先维护

不得主动：

提出 PB8

提出 Cloud

提出 Runtime Rewrite

提出 Governance Rewrite

提出 Pipeline Rewrite

提出 Registry Rewrite

提出 Architecture Upgrade

提出 Breaking Change

---

# 21. Version Policy

仅允许：

v3.0.2

v3.0.3

v3.0.4

……

采用 Patch Release。

禁止：

v3.1

v4.0

PB8

Cloud Edition

Experimental Edition

Developer Preview

Alpha

Beta

RC

---

# 22. Final Principle

LH-TV 当前属于：

Production LTS

PB7 Foundation 已完成。

PB8 永久暂停。

Claude 必须始终认为：

维护比开发更重要。

稳定比扩展更重要。

兼容比创新更重要。

除 BugFix、安全修复、性能优化、测试增强、文档完善、代码质量提升之外：

**拒绝执行任何新功能、架构扩展或 PB8 相关开发。**

---

# 23. Maintenance History

## v3.0.1 LTS Patch Release — 2026-06-18

| Sprint | Commit | Key Changes |
|--------|--------|-------------|
| #1 | aa9ae56 | ESLint, 5 patch upgrades, bundle analysis, depcheck |
| #2 | ed9ba46 | 2 CVEs fixed, 66 lines dead code removed, security classification |
| Release | a9b19b2 | v3.0.1 tag, GitHub Release with Portable + Setup + checksums |
| Spec | 4a60409 | Enhanced Claude Execution Specification (this document) |

### Verification
- TypeScript: 0 errors | Build: PASS | Tests: 242/2134
- Circular: 0 | Lint: 0 errors
- Frozen Zone: Unchanged | Public API: Unchanged
- GitHub Release: https://github.com/hsjshzbs4-ctrl/LH-tv/releases/tag/v3.0.1
