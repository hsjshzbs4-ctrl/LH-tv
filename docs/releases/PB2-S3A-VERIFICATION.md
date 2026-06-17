# PB2-S3A 架构验证报告

> 验证人：小涵 | 日期：2026-06-16 | 基准：PB2-S2-ACCEPTED (`9ce42a2`)

---

## 验证结论

**5/5 断裂点全部确认。PB2-S3A 架构稳定性修复必要且紧急。**

---

## S3A-1: 双 Video Tree ✅ CONFIRMED

### 调查范围
全项目搜索 `createElement('video')`、`<video`、`createVideoElement`、`HTMLVideoElement`

### 证据

| # | 文件 | 行号 | 类型 | Video 创建方式 |
|---|------|------|------|---------------|
| 1 | `src/core/player/adapters/BaseAdapter.ts` | 20 | TREE A | `document.createElement('video')` |
| 2 | `src/components/player/VideoPlayer.vue` | 21 | TREE B | `<video>` Vue 模板 |
| 3 | `electron/shared-legacy/player-core.js` | 27, 114 | Legacy | `document.createElement('video')` ×2 |
| 4 | `src/composables/usePlayer.ts` | 5 | 未使用 | `ref<HTMLVideoElement | null>(null)` |

### 结论
**4 个独立的 Video 元素创建点，分属 3 条独立的状态树。**

TREE A (PB2 PlayerPage) 和 TREE B (VideoPlayer.vue) 各自拥有独立的 `<video>` 元素，各自的事件监听，互不通信。这是双状态树的根本原因。

**风险**：任意时刻最多可能有 4 个 `<video>` 元素同时存在于 DOM，消耗 GPU 解码资源。

---

## S3A-2: PlayerFacade 初始化链路 ✅ CONFIRMED 断裂

### 调查范围
追踪 `PlayerFacade.initialize()` 调用链 + `PlayerEngine.setContainer/getOrCreateContainer` 路径

### 证据

**调用方搜索**：`grep "\.initialize("` 全项目搜索 → PlayerFacade.initialize **0 次调用**

```typescript
// playerFacade.ts:49 — 方法存在但从未被调用
initialize(container: HTMLElement): void {
  this.engine.attachElement(container)
  const video = this.engine.getVideoElement()
  if (video) this.subtitle.attachVideo(video)
}
```

**断裂链路**：

```
PlayerPage.onMounted()
  → store.loadMedia(media, detail, episode, '')      // ❌ 不传 container
    → facade = new PlayerFacade()
    → facade.loadMedia(media, detail, episode, '')     // ❌ 不调 initialize()
      → engine.loadSource('')                          // playUrl = ''
        → PlayerEngine.load('')
          → getOrCreateContainer()                     // 创建 ORPHAN div
            → document.getElementById('player-engine-container')
            → 找不到 → 创建新 div（从未 append 到 DOM）
          → new MP4Adapter(orphanDiv, callbacks)
            → createVideoElement()
              → orphanDiv.appendChild(video)           // video 在孤儿 div 中
```

**结果**：Video 元素被创建并添加到 `#player-engine-container` div 中，但该 div **从未被追加到可见 DOM**。播放器在技术上无法渲染画面。

**对比参考 — PlayView.vue（旧版，正常工作）**：
```typescript
// PlayView.vue:285
engine.setContainer(engineContainer.value)  // ✅ 传入实际 DOM 元素
```

### 结论
PlayerFacade.initialize() 存在但 **0 调用**。Video 元素生命周期完全断裂，视频无法渲染。

---

## S3A-3: playUrl 获取链路 ✅ CONFIRMED 断裂

### 调查范围
追踪 `MediaEpisode` → `IProvider` → `ProviderManager` → `PlayerPage` 的 URL 获取路径

### 证据

**1. playUrl 硬编码为空**：
```typescript
// PlayerPage.vue:255
const playUrl = '' /* playUrl 由外部 provider 提供 */
```

**2. MediaEpisode 无 playUrl 字段**：
```typescript
// provider-contracts/types/media.types.ts:30-34
export interface MediaEpisode {
  id: string
  title: string
  episodeNumber?: number
  // ❌ 无 playUrl / url / source 字段
}
```

**3. IProvider 无 URL 解析方法**：
```typescript
// provider-contracts/interfaces/IProvider.ts:7-24
export interface IProvider {
  id: string; name: string; enabled: boolean; priority: number
  search(keyword: string): Promise<MediaItem[]>
  detail(id: string): Promise<MediaDetail>
  catalog?(type: string, sub: string): Promise<MediaItem[]>
  healthCheck(): Promise<boolean>
  // ❌ 无 getPlayUrl / resolveUrl 方法
}
```

**4. ProviderManagerService 无 URL 解析**：
```typescript
// src/content/providerManager.ts — 只有 get/enable/disable/priority/health
// ❌ 无 getPlayUrl 方法
```

### 结论
从 Provider 接口 → Content 服务 → PlayerPage 的完整 playUrl 链路**均不存在**。当前 `playUrl = ''` 导致 `PlayerEngine.load('')` 加载空字符串，MP4Adapter 将空字符串设为 `<video src="">`。

---

## S3A-4: QualityManager HLS 绑定 ✅ CONFIRMED 断裂

### 调查范围
搜索 `bindHLS` 和 `hlsInstance` 的所有引用

### 证据

**bindHLS 存在但 0 调用**：
```
src/player/qualityManager.ts:37  — bindHLS 方法定义 ← 0 次跨文件调用
```

**hlsInstance 永久为 null**：
```typescript
// qualityManager.ts:15
private hlsInstance: unknown = null    // ← 从未被赋值

// qualityManager.ts:42-43
private applyToHLS(): void {
  if (!this.hlsInstance) return        // ← 永远在这里返回！
  // ...
}
```

**HLSAdapter 不暴露 HLS 实例**：
```typescript
// HLSAdapter.ts:38-71
this.hls = new Hls({...})              // ← 创建了
// ... 但从未通知外部（无 callback/event 传出 hls 实例）
```

`AdapterEventCallbacks` 接口中无 `onHLSReady` 回调：
```typescript
// adapter.types.ts:58-66
export interface AdapterEventCallbacks {
  onReady?: () => void
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onError?: (message: string) => void
  onBuffering?: (buffering: boolean) => void
  // ❌ 无 onHLSReady?: (hls: Hls) => void
}
```

**usePlayer.ts 有独立 hlsInstance — 但从未被 PlayerPage 使用**：
```typescript
// composables/usePlayer.ts:6
const hlsInstance = ref<unknown>(null)  // 独立存在，无人消费
```

### 结论
HLS 画质切换功能**完全不可用**。QualityManager.hlsInstance 始终为 null。修复需要：
1. `AdapterEventCallbacks` 新增 `onHLSReady` 回调
2. `HLSAdapter` 在 `MANIFEST_PARSED` 后调用回调
3. `PlayerEngine` → `VideoEngine` 转发 HLS 实例到 `QualityManager.bindHLS()`

---

## S3A-5: SourceSwitchManager 集成 ✅ CONFIRMED 未接入

### 调查范围
搜索 `src/player/` 对 `PlaybackFacade` 和 `SourceSwitchManager` 的引用

### 证据

```
grep "PlaybackFacade|SourceSwitchManager" src/player/playerFacade.ts
→ 0 matches
```

```typescript
// src/player/playerFacade.ts 的 imports:
import type { MediaItem, MediaDetail, MediaEpisode } from '@provider-contracts'
import { VideoEngine } from './videoEngine'
import { PlaybackSessionTracker } from './playbackSession'
import { ResumeManager } from './resumeManager'
import { EpisodeManager } from './episodeManager'
import { QualityManager } from './qualityManager'
import { SubtitleManager } from './subtitleManager'
import { DRMManager } from './drmManager'
// ❌ 无 import { PlaybackFacade } from '@/core/playback'
```

**两套门面系统并存但互不连接**：

```
src/core/playback/PlaybackFacade   → SourceSwitchManager  (P4.2, 280行生产代码)
src/player/PlayerFacade            → VideoEngine + Managers (PB2-S1, 130行)
                                    ↕ 无连接
```

### 结论
SourceSwitchManager 的 24h 成功缓存、自动重试（最多 3 次）、进度保持、源切换事件等能力完全未被 PB2 层使用。播放失败时无任何自动恢复机制。

---

## 汇总

| # | 验证项 | 状态 | 严重度 | 影响 |
|---|--------|------|--------|------|
| S3A-1 | 双 Video Tree | ✅ CONFIRMED | 🔴 | 4 个独立 video 元素，状态分裂 |
| S3A-2 | 初始化链路断裂 | ✅ CONFIRMED | 🔴 | video 在孤儿 DOM 中，画面不渲染 |
| S3A-3 | playUrl 链路断裂 | ✅ CONFIRMED | 🔴 | MediaEpisode/IProvider 无 URL 概念 |
| S3A-4 | HLS Quality 绑定断裂 | ✅ CONFIRMED | 🟡 | 画质切换不可用 |
| S3A-5 | SourceSwitch 未集成 | ✅ CONFIRMED | 🟡 | 失败后无自动恢复 |

---

## PB2-S3A 修复清单

| # | 修复任务 | 涉及文件 | 优先级 |
|---|---------|---------|--------|
| 1 | PlayerPage 持有唯一 `<video ref>` | `PlayerPage.vue` | P0 |
| 2 | PlayerEngine 支持接管已有 video | `PlayerEngine.ts`, `BaseAdapter.ts` | P0 |
| 3 | 修复初始化链路 | `playerStore.ts`, `PlayerPage.vue` | P0 |
| 4 | IProvider 新增 getPlayUrl | `IProvider.ts`, `providerManager.ts` | P0 |
| 5 | PlayerPage 接入 playUrl 解析 | `PlayerPage.vue` | P0 |
| 6 | AdapterEventCallbacks 新增 onHLSReady | `adapter.types.ts`, `HLSAdapter.ts` | P1 |
| 7 | VideoEngine 转发 HLS 实例到 QualityManager | `VideoEngine.ts`, `playerFacade.ts` | P1 |
| 8 | PlayerFacade 集成 PlaybackFacade | `playerFacade.ts` | P1 |

---

## 下一步

所有验证完成 → **PB2-S3A 修复阶段启动待小林批准**。
