# LH-TV v3.0 LTS Maintenance Policy

## Claude Execution Specification (PB8 Disabled Edition)

Version: v3.0.1 LTS
Branch: release/v3.0.x
Status: Production Stable
Last Update: 2026-06-18

---

# 一、项目状态

LH-TV 已完成 PB7 全部开发。

当前项目进入：

> **LTS（Long Term Support）长期维护阶段**

目标：

* 保持线上稳定
* 修复 Bug
* 修复安全问题
* 提高代码质量
* 优化性能
* 完善测试
* 完善文档

**不再进行 PB8 或后续架构开发。**

---

# 二、当前版本

Branch:

release/v3.0.x

Tag:

v3.0.1

Status:

Production Stable

Git Flow：

main
└── release/v3.0.x (Current LTS)

PB8 分支全部冻结，不允许开发。

---

# 三、最高原则

稳定性 > 可维护性 > 性能 > 可读性 > 可扩展性

禁止为了"更先进"而修改稳定代码。

禁止为了"未来扩展"增加复杂度。

保持 API 永久兼容。

---

# 四、Claude 工作范围

Claude 允许：

✓ Bug Fix

✓ Security Fix

✓ Memory Leak 修复

✓ Null Check

✓ Crash Fix

✓ Exception Fix

✓ 性能优化

✓ 测试补充

✓ 文档更新

✓ 注释完善

✓ 死代码分析

✓ 内部 Refactor（行为一致）

✓ 类型优化

✓ 日志优化

✓ 构建优化

✓ Package 更新（Patch）

✓ Minor Upgrade（需要评估）

---

Claude 禁止：

✗ PB8 Cloud

✗ Cluster

✗ Sync

✗ Telemetry

✗ Analytics

✗ Runtime Rewrite

✗ Governance Rewrite

✗ 新架构

✗ 新 Feature

✗ Breaking Change

✗ API 修改

✗ 数据结构修改

✗ Feature Flag 增加

✗ Pipeline 修改

✗ Registry 修改

✗ EventBus 改写

✗ Cloud Adapter

✗ Enterprise 新能力

✗ Community 新能力

---

# 五、Frozen Zone

以下目录永久冻结：

src/ai/**

src/ecosystem/**

src/community/**

src/enterprise/**

src/governance/**

任何修改必须满足：

Bug Fix

AND

行为一致

AND

Public API 不变

否则禁止修改。

---

# 六、允许修改目录

允许：

electron/

renderer/

shared/

utils/

scripts/

docs/

tests/

package.json

package-lock.json

eslint.config.js

vitest.config.ts

仅允许：

维护

修复

优化

测试

文档

不得新增业务功能。

---

# 七、依赖升级策略

允许：

Patch：

1.2.3 → 1.2.4

安全升级：

npm audit fix

Wanted Version：

Vue Patch

Vitest Patch

Playwright Patch

Happy-dom Patch

禁止：

Electron Major

Electron Builder Major

TypeScript Major

Vue Router Major

Vite Major

Electron-Vite Major

任何 Major Upgrade 必须拒绝。

---

# 八、Security Policy

优先级：

P0：

Crash

Data Loss

RCE

Injection

Privilege Escalation

立即修复。

P1：

High CVE

DOS

Memory Leak

立即评估。

P2：

Performance

Dead Code

Refactor

按 Sprint 修复。

P3：

文档

格式

注释

长期维护。

---

# 九、Dead Code Policy

允许：

删除 private unused

删除 internal helper

删除 unreachable code

删除 duplicate function

禁止：

删除 public export

删除 barrel export

删除 Frozen Zone API

删除未来兼容接口

如果 ts-prune 报 unused：

必须人工确认。

不得自动删除。

---

# 十、Performance Policy

允许：

缓存优化

Lazy Import

减少对象创建

减少 JSON Parse

减少 IO

减少重复计算

减少 Config 解析

Build 优化

Bundle 分析

禁止：

改变业务逻辑。

禁止：

影响 Public API。

---

# 十一、Refactor Policy

允许：

拆函数

提取变量

重命名 private

提取 helper

统一类型

删除重复代码

要求：

Before == After

行为一致。

不得修改：

API

Event

Pipeline

Registry

Facade

Contract

---

# 十二、Testing Policy

所有修改必须执行：

npm run typecheck

npm run build

npm test

npx madge --circular src

npm run lint

全部 PASS 才允许提交。

---

# 十三、Release Policy

每次 Release：

TypeScript == 0

Build PASS

Tests PASS

Circular == 0

Lint PASS

Working Tree Clean

Tag 完成

Release Note 完成

GitHub Release 完成

否则禁止发布。

---

# 十四、Commit Convention

Bug：

fix(scope): description

维护：

chore(lts): description

文档：

docs(lts): description

性能：

perf(scope): description

测试：

test(scope): description

重构：

refactor(scope): description

禁止：

feat:

除非真正新增功能。

LTS 原则上不允许 feat。

---

# 十五、Sprint Workflow

每次 Sprint：

分析

↓

实现

↓

TypeCheck

↓

Build

↓

Test

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

GitHub Release（如需要）

---

# 十六、Claude 执行原则

Claude 不得主动：

开发 PB8

扩展架构

修改 Governance

增加 Feature

增加 Flag

增加 Adapter

增加 Pipeline

增加 Registry

增加 Runtime Layer

Claude 应始终优先：

稳定

兼容

维护

优化

修复

文档

测试

代码质量

---

# 十七、最终原则

LH-TV 当前进入：

Production LTS

目标：

保持长期稳定运行。

除 BugFix、安全修复、性能优化、代码质量维护外：

**拒绝一切新功能开发。**

PB8：

永久暂停。

Claude 必须默认认为：

PB7 Foundation 已完成且不可重构。

任何建议涉及 PB8、Cloud、Cluster、Sync、Telemetry、Analytics、Governance 重构、Runtime 重构、Public API 修改，应直接拒绝执行，并保持 release/v3.0.x 的长期稳定性。

---

# 十八、维护历史

## Sprint #1 — 2026-06-18

- ✅ ESLint + TypeScript/Vue linting 配置
- ✅ 5 个 Patch 升级 (vitest, playwright, happy-dom, vue)
- ✅ Bundle 分析 (Main/Preload/Renderer)
- ✅ depcheck + ts-prune 初步分析
- ⚠️ vue-tsc 3.x 阻止 (Major)
- ⚠️ npm audit fix 网络超时

## Sprint #2 — 2026-06-18

- ✅ form-data + glob CVE 修复 (12→10 HIGH)
- ✅ 66 行死代码删除 (config.ts 58% 缩减)
- ✅ rollup-plugin-visualizer 移除 (24 子包)
- ✅ vue-eslint-parser 显式依赖
- ✅ P0/P1/P2 安全分类完成

## v3.0.1 Release — 2026-06-18

- Commit: a9b19b2
- Tag: v3.0.1
- Release: https://github.com/hsjshzbs4-ctrl/LH-tv/releases/tag/v3.0.1
- Assets: Portable.exe + Setup.exe + checksums.txt
- All gates passed | Frozen Zone unchanged | Public API unchanged
- Status: Certified — Production Ready
