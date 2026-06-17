# PB2-S3 架构设计审查（修订版）

> 审查人：小涵 | 日期：2026-06-16 | 状态：待小林批准
> 基准：PB2-S2-ACCEPTED (`9ce42a2`)
> 配套文档：[State Ownership 审计](./PB2-S3_STATE_OWNERSHIP_AUDIT.md)

---

## 审查结论

**结论**：PB2-S1/S2 架构骨架良好，但存在 4 个关键集成断裂点和 1 个架构级状态分裂问题。PB2-S3 拆分为 4 个子阶段，按序交付。

---

## 一、批准的修复项（5 项）

| # | 修复项 | 问题简述 | 归属阶段 |
|---|--------|---------|----------|
| 1 | 修复 Video 生命周期 | video 元素未挂载 DOM，播放器无法渲染 | S3A |
| 2 | 修复 playUrl 解析链路 | `playUrl = ''` 硬编码，缺少 Provider → playUrl | S3A |
| 3 | 集成 SourceSwitchManager | 源失败后无自动切换，核心 P4.2 能力未接入 | S3A |
| 4 | 修复 HLS Quality 绑定 | QualityManager.hlsInstance 从未设置，画质切换不工作 | S3A |
| 5 | 增加剧集面板入口 | showEpisodePanel 无触发按钮，用户无法选剧集 | S3A |

---

## 二、State Ownership 审计核心发现

详见 [PB2-S3_STATE_OWNERSHIP_AUDIT.md](./PB2-S3_STATE_OWNERSHIP_AUDIT.md)，核心结论：

```
应用内存在两条完全独立的状态树：

TREE A: PlayerPage → playerStore → PlayerFacade → VideoEngine → PlayerEngine → Adapter → <video#1>
TREE B: VideoPlayer.vue → local refs → <video#2>

两棵树拥有各自的 <video> 元素，各自的事件监听，互不通信。
```

**关键断裂清单**：

| 严重程度 | 数量 | 代表性 |
|---------|------|--------|
| 🔴 严重 | 4 | 双 video、volume 只写不读、HLS 绑定断、SourceSwitch 未接入 |
| 🟡 中等 | 5 | speed 无 store、subtitleTracks 空、episode 双写、error 消息丢失、双定时器 |
| 🟢 轻微 | 2 | progress 死字段、状态事件可能丢同步 |

**状态所有权核心规则（修复后目标）**：

```
playerStore 是 UI 层唯一状态持有者
Manager 层持有业务 Truth
Engine/Adapter 持有硬件 Truth
同步方向: Engine events → Facade → Store (push)  /  Store actions → Facade → Engine (command)
```

---

## 三、PB2-S3 四阶段拆分

### S3A：架构修复（Architecture Fix）

**目标**：修复所有严重和中等的集成断裂点，不引入新功能，不删除文件。

**范围**：

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| A1 | 修复 Video 元素生命周期 | `PlayerPage.vue`, `VideoEngine.ts`, `PlayerEngine.ts` | Medium |
| A2 | 实现 playUrl 解析链路 | `PlayerPage.vue`, `playerStore.ts`, `providerManager.ts` | Medium |
| A3 | 集成 SourceSwitchManager | `playerFacade.ts`, `playerStore.ts`, `PlayerPage.vue` | Medium |
| A4 | 修复 HLS Quality 绑定 | `HLSAdapter.ts`, `QualityManager.ts`, `VideoEngine.ts` | Small |
| A5 | 增加剧集面板入口按钮 | `PlayerPage.vue` | Small |
| A6 | volume/muted 双向同步 | `playerStore.ts`, `VideoEngine.ts` | Small |
| A7 | error 消息保留原始信息 | `playerStore.ts` | Small |
| A8 | subtitleTracks 填充链路 | `playerStore.ts`, `SubtitleManager.ts` | Small |
| A9 | speed 状态纳入 store | `playerStore.ts`, `PlayerPage.vue` | Small |
| A10 | 清理死字段 progress | `playerStore.ts` | Trivial |

**明确不做**：
- ❌ 不删除 VideoPlayer.vue
- ❌ 不新增 UI 组件（只修复现有）
- ❌ 不改变现有 API 签名

**预估**：修改 ~10 文件，+200/-50 行，新增 ~20 测试

---

### S3B：播放器统一（Player Unification）

**目标**：统一 VideoPlayer.vue 和 PlayerPage.vue 的功能，消除双 video 架构。

**策略**：不是删除 VideoPlayer.vue，而是将其**重构为纯控制组件**（无 `<video>` 标签），由 PlayerPage.vue 统一持有唯一 `<video>` 元素。

**范围**：

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| B1 | VideoPlayer.vue 移除 `<video>` 标签 | `VideoPlayer.vue` | Medium |
| B2 | VideoPlayer 改为纯控制层（props in, emits out） | `VideoPlayer.vue` | Medium |
| B3 | PlayerPage.vue 持有唯一 `<video>` | `PlayerPage.vue` | Medium |
| B4 | PlayerPage 集成 VideoPlayer 控制功能 | `PlayerPage.vue` | Medium |
| B5 | PiP / 倍速 / 全屏快捷键统一 | `PlayerPage.vue` | Small |
| B6 | 键盘快捷键 overlay 提示 | `PlayerPage.vue` | Small |

**架构变更**：
```
修复前:
  PlayerPage.vue (自己一套控制 + facade) 
  VideoPlayer.vue (自己一套控制 + 自己的 <video>)
  两者并存，互不通信

修复后:
  PlayerPage.vue
    ├── <video ref="videoEl">          ← 唯一 video
    ├── <VideoPlayerControls />        ← 纯控制组件（原 VideoPlayer 重构）
    └── playerStore                    ← 唯一状态持有者
```

**VideoPlayer.vue 保留但重构**：从自带 `<video>` 的独立播放器，变为无 `<video>` 的纯控制面板。

**预估**：修改 ~4 文件，+150/-300 行，新增 ~15 测试

---

### S3C：UX 增强（UX Enhancement）

**目标**：补齐播放器用户体验能力。

**范围**：

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| C1 | 音量滑块组件 | `VolumeSlider.vue` (new) | Small |
| C2 | 画质选择下拉 | `QualitySelector.vue` (new) | Small |
| C3 | 字幕轨道选择下拉 | `SubtitleSelector.vue` (new) | Small |
| C4 | 倍速选择器 | `SpeedSelector.vue` (new) | Small |
| C5 | SourceSwitcher 源切换 UI 集成 | `PlayerPage.vue`, `SourceSwitcher.vue` | Small |
| C6 | 全屏下快捷键提示浮层 | `PlayerPage.vue` | Small |

**预估**：新增 ~4 组件，修改 ~2 文件，+200 行，新增 ~15 测试

---

### S3D：推荐接入（Recommendation Integration）

**目标**：将 CE9 推荐引擎真正接入 RecommendationBridge，替换 stub。

**范围**：

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| D1 | RecommendationBridge 接入 CE9 UseCases | `recommendationBridge.ts` | Large |
| D2 | 详情页"猜你喜欢"区域 | `DetailPage.vue` | Medium |
| D3 | 播放结束推荐浮层 | `PlayerPage.vue` | Medium |

**预估**：修改 ~4 文件，+300 行，新增 ~20 测试

---

## 四、各阶段量化指标

| 阶段 | 修改文件 | 新增文件 | 删除文件 | 代码变动 | 新增测试 | 预计耗时 |
|------|---------|---------|---------|---------|---------|---------|
| **S3A** 架构修复 | ~10 | 0 | 0 | +200/-50 | ~20 | 1-2 轮 |
| **S3B** 播放器统一 | ~4 | 0 | 0 | +150/-300 | ~15 | 1-2 轮 |
| **S3C** UX 增强 | ~2 | ~4 | 0 | +200 | ~15 | 1 轮 |
| **S3D** 推荐接入 | ~4 | 0 | 0 | +300 | ~20 | 2 轮 |
| **合计** | ~20 | ~4 | 0 | +850/-350 | ~70 | 5-7 轮 |

---

## 五、阶段依赖关系

```
S3A (架构修复)
  └── S3B (播放器统一)    ← 依赖 A 修复的 video 生命周期
       └── S3C (UX 增强)  ← 依赖 B 统一后的组件结构
  └── S3D (推荐接入)      ← 可并行于 B/C，仅依赖 A 的事件总线
```

S3D 可与 S3B/S3C 并行进行。

---

## 六、VideoPlayer.vue 演进路线

小林要求**不允许立即删除 VideoPlayer.vue**。三阶段演进路线：

```
S3A 结束时:  VideoPlayer.vue 保持不变（仍有自己的 <video>）
             PlayerPage.vue 的 <video> 生命周期已修复
             两者各自工作，暂不互相调用

S3B 结束时:  VideoPlayer.vue 重构为纯控制组件（<VideoPlayerControls />）
             自身 <video> 标签移除
             所有状态通过 props/emits 与 PlayerPage 通信
             VideoPlayer.vue 文件保留

S3C 结束时:  可选：将 VideoPlayerControls 重命名或标记 deprecated
             所有 UX 组件独立于 VideoPlayer 历史代码
```

---

## 七、执行计划

### S3A 具体步骤

```
Step 1: PlayerEngine 支持接管已有 video 元素
  └── 新增 useExistingVideo(video: HTMLVideoElement) 方法
  └── Adapter 不再 createVideoElement()，改为 attachToVideo()

Step 2: PlayerPage.vue 渲染 <video> + ref 绑定
  └── <video ref="videoEl"> 直接写在模板中
  └── onMounted 中 facade.initialize(videoEl.value)

Step 3: playUrl 解析链路
  └── providerManager.getPlayUrl(providerId, episodeId)
  └── PlayerPage.onMounted 调用获取 URL
  └── 传入 store.loadMedia()

Step 4: SourceSwitchManager 接入
  └── PlayerFacade 持有 PlaybackFacade 实例
  └── loadMedia 中 sources[] → PlaybackFacade.start()
  └── error 事件中 PlaybackFacade.onFailed()

Step 5: HLS Quality 绑定
  └── AdapterEventCallbacks 新增 onHLSReady(hls)
  └── VideoEngine 转发 → QualityManager.bindHLS()

Step 6: State 双向同步
  └── volume/muted/speed 从 engine 读回
  └── error 消息保留原始文本
  └── subtitleTracks 填充链路

Step 7: UI 微修复
  └── 剧集面板触发按钮
  └── 清理死字段 progress
```

### 每个 Step 的验证方式

| Step | 验证方式 |
|------|---------|
| Step 1 | 单元测试：PlayerEngine 接管已有 video |
| Step 2 | 手动：PlayerPage 打开后 video 可见渲染 |
| Step 3 | 手动：从 DetailPage 跳转 PlayerPage，video 有 src |
| Step 4 | 单元测试：源失败自动切换 |
| Step 5 | 手动：HLS 流切换画质生效 |
| Step 6 | 单元测试：store 读写与 engine 一致 |
| Step 7 | 手动：剧集面板可打开/关闭 |

---

## 八、CI 门禁（不变）

```
npm run typecheck  → 0 errors
npm run test       → 100% pass (不降)
npm run build      → PASS
```

---

## 九、风险矩阵

| 风险 | 阶段 | 严重度 | 缓解 |
|------|------|--------|------|
| PlayerEngine 重构影响 Core 稳定性 | S3A | 🟡 中 | 新增方法不改现有签名，向后兼容 |
| playUrl 解析依赖 Provider 协议 | S3A | 🟡 中 | 先确认 Provider 接口，必要时新增 getPlayUrl |
| VideoPlayer 重构时破坏现有功能 | S3B | 🟡 中 | 逐功能迁移，每步验证；VideoPlayer 不删 |
| CE9 接口与 RecommendationBridge 不匹配 | S3D | 🟡 中 | S3D 独立于 B/C，可延后 |

---

## 十、批准状态

| 检查项 | 状态 |
|--------|------|
| 5 项核心修复已纳入 S3A | ✅ |
| VideoPlayer.vue 不立即删除 | ✅ 三阶段演进 |
| State Ownership 审计完成 | ✅ 独立文档 |
| 四阶段拆分 (S3A→S3D) | ✅ |
| 手动审批流程 | ✅ 每 Step 独立提交 |

---

**待小林批准后开始 S3A Step 1 实施。**
