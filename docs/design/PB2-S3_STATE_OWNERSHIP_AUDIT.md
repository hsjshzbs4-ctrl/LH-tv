# PB2-S3 State Ownership 审计

> 审查人：小涵 | 日期：2026-06-16 | 基准：PB2-S2-ACCEPTED (`9ce42a2`)

---

## 零、核心发现：两条完全独立的状态树

PB2 播放器存在**两个完全独立的 `<video>` 元素**和**两条不共享任何状态的状态树**：

```
TREE A (PB2 intended): PlayerPage → playerStore → PlayerFacade → VideoEngine → PlayerEngine → Adapter → <video#1>
TREE B (Legacy):       VideoPlayer.vue → local refs → <video#2> (Vue template)
```

**两棵树拥有各自的 `<video>` 元素，各自的事件监听，各自的状态存储。它们之间没有任何数据共享。**

---

## 一、逐字段所有权追踪

### 1.1 PlaybackState（播放状态）

```
Truth Source: HTMLVideoElement events
  ↓
BaseAdapter._paused (boolean)            ← 第1层：私有字段
  ↓ 回调
PlayerEngine (emit events)               ← 第2层：无状态存储，仅转发事件
  ↓ PlayerEvent.PLAY/PAUSE/ENDED/ERROR
VideoEngine._state (PlaybackState enum)  ← 第3层：第一次出现枚举状态
  ↓ 事件回调
playerStore.playbackState (Ref)          ← 第4层：响应式副本
  ↓ computed
PlayerPage.vue (isPlaying/isLoading)     ← 第5层：UI 消费
```

| 层 | 字段 | 类型 | 更新方式 | 问题 |
|----|------|------|----------|------|
| BaseAdapter | `_paused` | `boolean` | play/pause 事件直接赋值 | 只有 paused，无 loading/error/idle |
| PlayerEngine | 无 | — | 纯转发事件 | 无状态存储 |
| VideoEngine | `_state` | `PlaybackState` | setState() 被事件触发 | **唯一 Truth** |
| playerStore | `playbackState` | `Ref<PlaybackState>` | 事件回调中手动设置 | 可能与 VideoEngine 不同步 |
| PlayerPage | 通过 `store.isPlaying` | `computed` | Vue computed | 消费层，无问题 |

**问题**：
- `playerStore.playbackState` 是通过事件回调更新的（`facade.on('player:play', () => { playbackState.value = PLAYING })`），但如果事件丢失或重复触发，store 和 VideoEngine 的状态会不一致
- VideoPlayer.vue 有完全独立的 `isPlaying: ref(false)`，绑定到自己的 `<video>` 的 `@play/@pause`

**风险场景**：如果 VideoPlayer.vue 的 `<video>` 播放但 TREE A 的 `<video>` 没播放，两个组件显示不同状态。

---

### 1.2 currentTime / progress / duration

```
Truth Source: HTMLVideoElement (via adapter)
  ↓ adapter.getCurrentTime() / adapter.getDuration()
PlayerEngine.getState()                  ← 第1层：每次调用实时读取
  ↓ engine.currentTime / engine.duration
VideoEngine                              ← 第2层：getter 代理
  ↓ facade.currentTime / facade.duration
PlayerFacade                             ← 第3层：getter 代理
  ↓ store 回调读取 facade!.currentTime
playerStore.currentTime (Ref)            ← 第4层：事件回调中快照
  ↓ 模板绑定
PlayerPage.vue                           ← 第5层：UI 渲染
```

| 层 | 字段 | 更新频率 | 更新方式 |
|----|------|----------|----------|
| HTMLVideoElement | `currentTime` | 每 ~250ms | 浏览器内部 |
| Adapter | `getCurrentTime()` | 按需读取 | 实时读 video.currentTime |
| PlayerEngine | `getState().currentTime` | 按需读取 | 调用 adapter.getCurrentTime() |
| VideoEngine | `get currentTime` | 按需读取 | getter 代理 engine.getState() |
| PlayerFacade | `get currentTime` | 按需读取 | getter 代理 engine.currentTime |
| playerStore | `currentTime (Ref)` | 每 ~250ms | TIME_UPDATE 事件回调中更新 |
| PlayerPage | 模板绑定 | Vue 响应式 | `{{ store.currentTime }}` |

**关键问题**：
- playerStore 中的 `currentTime` 是**快照值**（在事件回调中更新），而 facade.currentTime 是**实时值**（每次读取都调用 adapter.getCurrentTime()）
- playerStore 的回调：`facade.on('player:timeupdate', () => { currentTime.value = facade!.currentTime })` — 这没有问题，但本质上是从 adapter → engine → engine → facade → store 的间接读取
- playerStore 中还有一个 `progress` 字段（`ref(0)`），在同一个回调中计算 `progress = currentTime/duration`，**但 progress 从未被 UI 消费**（PlayerPage 使用 `progressPercent` computed）

**VideoPlayer.vue 的平行状态**：
- 自己的 `currentTime: ref(0)` + `duration: ref(0)` + `@timeupdate/@loadedmetadata` 事件
- 完全独立于 TREE A

---

### 1.3 Volume / Muted

```
SET 路径（写）:
playerStore.volume (Ref)                 ← 第1层：UI 状态
  ↓ store.setVolume(vol)
PlayerFacade.setVolume()                 ← 第2层：代理
  ↓ engine.setVolume(vol)
VideoEngine.setVolume()                  ← 第3层：代理
  ↓ engine.setVolume(vol)
PlayerEngine.setVolume()                 ← 第4层：代理
  ↓ adapter.setVolume(vol)
BaseAdapter.setVolume()                  ← 第5层：设置 video.volume
  ↓
HTMLVideoElement.volume                  ← 第6层：Truth
```

**READ 路径（读）**：❌ 不存在！

| 操作 | 状态 |
|------|------|
| SET volume | ✅ playerStore.setVolume(vol) → 一路到 video.volume |
| READ volume | ❌ playerStore.volume 只在本地 set，从不从 facade 读取 |
| SET muted | ✅ playerStore.toggleMute() → facade.setMuted() → video.muted |
| READ muted | ❌ playerStore.muted 只在本地翻转，从不从 facade 读取 |

**风险场景**：如果外部代码直接设置 video.volume（如键盘快捷键 ArrowUp），playerStore.volume 不会更新。

**VideoPlayer.vue**：直接在 keydown 中操作 `video.volume`，不经过任何 store。

---

### 1.4 Playback Speed

```
SET 路径:
VideoPlayer.vue setSpeed(s)              ← 唯一入口
  ↓ videoEl.value.playbackRate = s
HTMLVideoElement.playbackRate            ← Truth
```

| 组件 | 速度状态 | 暴露方式 |
|------|---------|---------|
| VideoPlayer.vue | `currentSpeed: ref(1)` | ✅ 局部响应式 |
| PlayerPage.vue | 无 | ❌ 无速度控制 |
| playerStore | 无 | ❌ 无速度字段 |
| VideoEngine | `setPlaybackRate(rate)` | ✅ 方法存在但无人调用 |
| PlayerEngine | `setPlaybackRate(rate)` | ✅ 方法存在但无人调用 |

**核心问题**：播放速度状态**只存在于 VideoPlayer.vue 本地**，PlayerPage 完全没有速度控制，而 VideoEngine/PlayerEngine 的 `setPlaybackRate()` 是 dead code。

---

### 1.5 Quality（画质）

```
SET 路径:
PlayerPage.vue cycleQuality()            ← 第1层：循环切换
  ↓ store.switchQuality(q)
playerStore.quality (Ref)                ← 第2层：本地 Ref
  ↓ facade.switchQuality(q)
QualityManager._current                  ← 第3层：Truth
  ↓ applyToHLS()
this.hlsInstance                         ← ❌ 从未被设置！
```

| 层 | 字段 | Truth? | 问题 |
|----|------|--------|------|
| QualityManager | `_current` | ✅ 唯一 Truth | `applyToHLS()` 依赖 `hlsInstance` |
| QualityManager | `hlsInstance` | — | **从未通过 bindHLS() 绑定** |
| playerStore | `quality (Ref)` | ❌ 副本 | 在 `switchQuality()` 中乐观更新 |
| PlayerPage | 通过 `store.quality` | ❌ 消费副本 | 只能循环切换，无下拉选择 |

**断裂点**：`QualityManager.bindHLS(hls)` 方法存在，但没有任何代码调用它。HLSAdapter 创建 `new Hls()` 后，实例没有传回给 QualityManager。

---

### 1.6 Subtitle（字幕）

```
SET 路径:
playerStore.subtitleEnabled (Ref)        ← 第1层：UI 状态
  ↓ store.enableSubtitles()
SubtitleManager._enabled                 ← 第2层：Truth
  ↓ applyTrackState()
HTMLVideoElement.textTracks[N].mode      ← 第3层：实际生效
```

| 层 | 字段 | 更新方式 | 问题 |
|----|------|----------|------|
| SubtitleManager | `_enabled` | enable/disable 方法 | ✅ Truth |
| SubtitleManager | `tracks[]` | `loadSubtitles(tracks)` | 只有 PlayerFacade 暴露了 loadSubtitles |
| playerStore | `subtitleEnabled` | 方法中乐观设置 | **不读取 SubtitleManager 的实际状态** |
| playerStore | `subtitleTracks` | `ref([])` | **从未被 populate** |
| PlayerPage | 模板绑定 | store.subtitleEnabled | 只有 CC toggle，无轨道选择 |

**问题**：
- `playerStore.subtitleTracks` 是空数组，从未被填充
- 选中轨道的 UI 不存在
- 字幕轨道由谁加载（Provider？Content？）——未定义

---

### 1.7 Episode（剧集）

```
数据加载路径:
PlayerPage.onMounted()
  ↓ mediaLibraryService.getDetail()
playerStore.currentDetail (Ref)          ← 第1层：包含 episodes
  ↓ store.loadMedia(media, detail, ep, url)
PlayerFacade.loadMedia()
  ↓ episodes.loadEpisodeList(detail.episodes)
EpisodeManager.episodes[]                ← 第2层：内部数组
  ↓ episodes.selectById(episode.id)
EpisodeManager._index                    ← 第3层：当前索引
```

| 层 | 字段 | 内容 | 同步关系 |
|----|------|------|----------|
| playerStore | `currentDetail` | `MediaDetail` (含 episodes[]) | 数据源 |
| EpisodeManager | `episodes[]` | `MediaEpisode[]` | loadEpisodeList 从 detail.episodes 复制 |
| EpisodeManager | `_index` | 当前播放索引 | 通过 selectById/selectEpisode 更新 |
| playerStore | `currentEpisode` | `MediaEpisode` | 在 loadMedia/switchEpisode 中手动设置 |
| PlayerPage | `episodes` computed | 从 `store.currentDetail?.episodes` | 只读 |

**重复定义**：`EpisodeManager.episodes[]` 和 `playerStore.currentDetail.episodes` 包含相同数据。如果外部修改了 detail.episodes，EpisodeManager 不会感知。

---

### 1.8 Error

```
TREE A 路径:
Adapter.onError callback
  ↓ PlayerEngine → PlayerEvent.ERROR
VideoEngine.setState(ERROR)
  ↓ playerStore 回调
playerStore.error (Ref)                  ← "播放出错"
  ↓
PlayerPage.vue 渲染 ErrorState

TREE B 路径 (独立):
VideoPlayer @error handler
  ↓
VideoPlayer.error (ref)                  ← "视频加载失败"
  ↓
VideoPlayer.vue 渲染 error overlay
```

**问题**：两个 error 状态完全独立，错误消息格式不同。TREE A 的错误消息是写死的 `"播放出错"`（playerStore.ts:93），丢失了原始错误信息。

---

### 1.9 Loading

```
TREE A:
playerStore.isLoading = computed(() => playbackState === PlaybackState.LOADING)
  ↓ PlaybackState.LOADING 由 VideoEngine.loadSource() 设置

TREE B:
VideoPlayer.loading = ref(true)
  ↓ @loadedmetadata → loading = false
```

**问题**：TREE A 的 loading 判断依赖 PlaybackState 枚举状态机，TREE B 直接读 video 事件。两者判断逻辑不同。

---

### 1.10 Resume / Session

```
ResumeManager
  ↓ localStorage + historyFacade
  ↓ facade.resume.loadPosition(epId)
playerStore.resumePosition / showResumeDialog

PlaybackSessionTracker
  ↓ sessionStorage + setInterval(10s)
  ↓ facade.session
（不暴露到 store）
```

这两个相对干净，没有重复。但 session 的 10s 持久化 + progressSyncService 的 30s 同步是**双重定时器**。

---

### 1.11 Source Switch（画质/源切换）

```
SourceSwitchManager (src/core/playback/)
  ↓ PlaybackFacade (src/core/playback/facade/)
  
PB2 PlayerFacade (src/player/playerFacade.ts)
  ❌ 不使用 PlaybackFacade
  ❌ 不使用 SourceSwitchManager
```

**断裂**：P4.2 的 SourceSwitchManager 和 P4.2 的 PlaybackFacade 是完整实现的，但 PB2 的 PlayerFacade 完全不接入它们。源切换逻辑在 PB2 层是**完全缺失**的。

---

## 二、State Ownership 问题汇总

### 🔴 严重问题

| # | 问题 | 影响 |
|---|------|------|
| S1 | **双 `<video>` 元素** — TREE A 和 TREE B 各有自己的 video，彼此独立 | 状态根本性分裂 |
| S2 | **Volume/Muted 只写不读** — playerStore 从不从 facade 读回实际值 | 外部修改 video 后 UI 不同步 |
| S3 | **Quality HLS 绑定断裂** — QualityManager.hlsInstance 从未设置 | 画质切换不工作 |
| S4 | **SourceSwitchManager 完全未接入** | 源失败后无自动切换 |

### 🟡 中等问题

| # | 问题 | 影响 |
|---|------|------|
| S5 | **Speed 状态仅存在于 VideoPlayer 本地** | PlayerPage 无倍速功能，Engine 的 setPlaybackRate 是 dead code |
| S6 | **SubtitleTracks 从未填充** | 字幕轨道选择 UI 无法工作 |
| S7 | **Episode 数据双写** — EpisodeManager.episodes 和 store.currentDetail.episodes | 可能数据不一致 |
| S8 | **Error 消息丢失** — playerStore 写死 "播放出错" | 用户看不到真实错误原因 |
| S9 | **双重定时器** — session 10s + progressSync 30s | 资源浪费 |

### 🟢 轻微问题

| # | 问题 | 影响 |
|---|------|------|
| S10 | `playerStore.progress` 字段无人读取（UI 用 progressPercent computed） | 死字段 |
| S11 | PlaybackState 事件回调中状态可能与 VideoEngine._state 不同步 | 极端情况下 UI 显示错误状态 |

---

## 三、修复方案

### 3.1 统一 Video 元素（解决 S1）

**原则**：整个应用只有一个 `<video>` 元素，由 PlayerPage.vue 直接渲染。

```
PlayerPage.vue
  └── <video ref="videoEl">    ← 唯一的 video 元素
```

PlayerEngine/Adapter 不再创建 video 元素，改为接管已存在的 video：

```typescript
// PlayerEngine 新增方法
useExistingVideo(video: HTMLVideoElement): void {
  // adapter 不再 createVideoElement()，而是复用这个 video
}
```

VideoPlayer.vue 变为**纯控制组件**（无 `<video>` 标签），通过 props 接收状态，通过 emits 发送命令。

### 3.2 建立单向数据流（解决 S2-S9）

```
                     SET ↓                    READ ↑
  UI  ←→  playerStore  ←→  PlayerFacade  ←→  Engine/Adapter/video
        (唯一状态持有者)    (命令代理)        (Truth Source)
```

**playerStore 是 UI 层的唯一状态持有者**：
- 所有 UI 组件只读 playerStore
- 所有用户操作通过 playerStore actions 下发
- playerStore 从 facade 读取真实状态（不只是乐观设置）

### 3.3 修复 Quality HLS 绑定（解决 S3）

```typescript
// HLSAdapter 在 MANIFEST_PARSED 后通知外部
this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
  this.callbacks.onReady?.()
  this.callbacks.onHLSReady?.(this.hls)  // NEW: 传出 HLS 实例
})
```

### 3.4 接入 SourceSwitchManager（解决 S4）

```typescript
// PlayerFacade 中新增 PlaybackFacade 成员
class PlayerFacade {
  private sourceSwitch = new PlaybackFacade()
  
  async loadMedia(...) {
    const bestSource = this.sourceSwitch.start(mediaId, allSources, epNum)
    await this.engine.loadSource(bestSource.url)
  }
  
  // 在 onError 中
  const next = this.sourceSwitch.onFailed(reason)
  if (next) await this.engine.loadSource(next.url)
}
```

---

## 四、修复后状态所有权矩阵

| 状态 | Truth Source | 唯一 Owner (Store) | 读取方向 | 写入方向 |
|------|-------------|---------------------|----------|----------|
| PlaybackState | video events | playerStore.playbackState | engine → store (events) | UI → store → engine |
| currentTime | video.currentTime | playerStore.currentTime | engine → store (events) | UI → store → engine.seek() |
| duration | video.duration | playerStore.duration | engine → store (events) | 只读 |
| volume | video.volume | playerStore.volume | engine → store | store → engine |
| muted | video.muted | playerStore.muted | engine → store | store → engine |
| speed | video.playbackRate | playerStore.speed | engine → store | store → engine |
| quality | QualityManager._current | playerStore.quality | manager → store | store → manager |
| subtitleEnabled | SubtitleManager._enabled | playerStore.subtitleEnabled | manager → store | store → manager |
| subtitleTracks | SubtitleManager.tracks | playerStore.subtitleTracks | manager → store | content → manager |
| currentEpisode | EpisodeManager._index | playerStore.currentEpisode | manager → store | UI → store → manager |
| error | adapter events | playerStore.error | engine → store (events) | — |
| sourceList | SourceSwitchManager | playerStore.sources | manager → store | content → manager |

**核心规则**：
1. **playerStore 是唯一的响应式状态持有者** — 所有 UI 从这里读
2. **Manager 层持有业务 Truth** — 但不暴露响应式接口
3. **Engine/Adapter 持有硬件 Truth** — video 元素的实际状态
4. **状态同步方向**：Engine events → Facade → Store (push)，Store actions → Facade → Engine (command)
