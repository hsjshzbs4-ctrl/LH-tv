# PB2-S3A-6: Single Source Of Truth 审计

> 审计人：小涵 | 日期：2026-06-16 | 基准：PB2-S2-ACCEPTED (`9ce42a2`)

---

## 审计范围

全项目搜索所有读/写路径，覆盖：

| 层级 | 路径 | 文件 |
|------|------|------|
| PB2 PlayerPage | `src/renderer/pages/PlayerPage.vue` | ✅ |
| PB2 playerStore | `src/stores/playerStore.ts` | ✅ |
| PB2 PlayerFacade | `src/player/playerFacade.ts` | ✅ |
| PB2 VideoEngine | `src/player/videoEngine.ts` | ✅ |
| Core PlayerEngine | `src/core/player/PlayerEngine.ts` | ✅ |
| Core Adapters | `src/core/player/adapters/` | ✅ |
| Legacy VideoPlayer | `src/components/player/VideoPlayer.vue` | ✅ |
| Legacy PlayView | `src/views/PlayView.vue` | ✅ |
| Composable | `src/composables/usePlayer.ts` | ✅ |
| Electron Legacy | `electron/shared-legacy/player-core.js` | ✅ |
| Integration | `src/integration/progress/progressSyncService.ts` | ✅ |

---

## 字段 #1: Video Element (DOM 元素)

### 创建点（Write）

| # | 位置 | 方式 | 所属树 | 状态 |
|---|------|------|--------|------|
| W1 | `BaseAdapter.ts:20` | `document.createElement('video')` | TREE A (PB2 Core) | Active |
| W2 | `VideoPlayer.vue:21` | `<video>` Vue template | TREE B (Legacy) | Active |
| W3 | `player-core.js:27` | `document.createElement('video')` | TREE C (Electron HLS) | Legacy |
| W4 | `player-core.js:114` | `document.createElement('video')` | TREE D (Electron MP4) | Legacy |
| W5 | `usePlayer.ts:5` | `ref<HTMLVideoElement \| null>(null)` | TREE E (Composable) | 未绑定到任何组件 |

### 读路径

| # | 位置 | 方式 |
|---|------|------|
| R1 | `PlayerEngine.getVideoElement()` | `adapter?.getVideoElement()` |
| R2 | `VideoPlayer.vue:98` | `ref<HTMLVideoElement \| null>` (模板 ref) |
| R3 | `SubtitleManager.attachVideo()` | 接收 video 参数 |
| R4 | `PlayView.vue:181` | `engine.getVideoElement()` |

### 判定

```
❌ SSOT VIOLATION: 5 个 video 元素创建点
🔴 严重度: CRITICAL
Rule: 整个应用应只有一个 <video> 元素
Fix: VideoPlayer.vue 移除 <video> 标签，统一使用 PlayerPage 的元素
```

---

## 字段 #2: currentTime（播放进度）

### 写路径（谁在修改 currentTime）

| # | 位置 | 方式 | 经何层 |
|---|------|------|--------|
| W1 | Browser Engine | timeupdate 事件自动推进 | 硬件 |
| W2 | `BaseAdapter.seek():75` | `video.currentTime = time` | Adapter |
| W3 | `VideoPlayer.vue:226` | `videoEl.value.currentTime = ...` | **直写 video** 🔴 |
| W4 | `VideoPlayer.vue:230` | `videoEl.value.currentTime = ...` | **直写 video** 🔴 |
| W5 | `VideoPlayer.vue:268` | `videoEl.value.currentTime = pos` | **直写 video** 🔴 |
| W6 | `usePlayer.ts:40` | `video.currentTime = ...` | **直写 video** 🔴 |
| W7 | `playerStore.seek() → facade.seek() → engine.seek() → adapter.seek()` | 经由全链路 | ✅ 正确路径 |
| W8 | `PlayerPage.vue:180` | `store.seek(ratio * store.duration)` | 经 store ✅ |
| W9 | `PlayerPage.vue:206,210` | `store.seek(...)` | 经 store ✅ |
| W10 | `PlayView.vue:301` | `engine.seek(savedProgress)` | 经 engine ✅ |
| W11 | `player-core.js:62,134` | `video.currentTime = timeInSeconds` | **直写 video** 🔴 |

### 读路径（谁在读取 currentTime）

| # | 位置 | 方式 | 读的是哪个 video |
|---|------|------|-----------------|
| R1 | `BaseAdapter.getCurrentTime():102` | `video?.currentTime` | TREE A video |
| R2 | `VideoPlayer.vue:181` | `videoEl.value.currentTime` | TREE B video |
| R3 | `VideoPlayer.vue:182` | `emit('timeupdate', videoEl.value.currentTime)` | TREE B video |
| R4 | `VideoPlayer.vue:269` | `videoEl.value?.currentTime` | TREE B video |
| R5 | `usePlayer.ts:41,71` | `video.currentTime` | TREE E video |
| R6 | `playerStore.ts:70` | `facade!.currentTime` → ... → adapter.getCurrentTime() | TREE A video |
| R7 | `PlayerPage.vue:42` | `store.currentTime` | TREE A via store |
| R8 | `PlayView.vue:343` | `TIME_UPDATE event data` | TREE A via event |
| R9 | `PlayView.vue:364,407` | `engine.getVideoElement()?.currentTime` | TREE A via engine |
| R10 | `progressSyncService.ts:34` | `currentTime` parameter | N/A (receives from store) |

### 判定

```
❌ SSOT VIOLATION: 11 条写路径，其中 5 条直写 video 元素
❌ SSOT VIOLATION: 10 条读路径，分别读取 TREE A / TREE B / TREE E 的 video

多源写入明细:
  VideoPlayer.vue:   3 处直写 videoEl.value.currentTime
  usePlayer.ts:       1 处直写 video.currentTime
  player-core.js:     2 处直写 video.currentTime

SSOT 应为: HTMLVideoElement（单一 video 元素）
实际 SSOT: 不存在（5 个 video 元素各自持有 currentTime）
```

---

## 字段 #3: duration（视频总时长）

### 写路径

| # | 位置 | 方式 |
|---|------|------|
| W1 | Browser Engine | loadedmetadata → video.duration |
| W2 | `VideoPlayer.vue:189` | `duration.value = videoEl.value.duration` |
| W3 | `playerStore.ts:66` | `duration.value = facade.duration` |
| W4 | `PlayView.vue:295` | `duration.value = engine.getVideoElement()?.duration` |

### 读路径

| # | 位置 | 方式 | 读的是哪个 video |
|---|------|------|-----------------|
| R1 | `BaseAdapter.getDuration():106` | `video?.duration` | TREE A |
| R2 | `VideoPlayer.vue:189` | `videoEl.value.duration` | TREE B |
| R3 | `playerStore.ts:66` | `facade.duration` (→ engine → adapter) | TREE A |
| R4 | `PlayerPage.vue:42,180,210` | `store.duration` | TREE A via store |
| R5 | `PlayView.vue:181,295,363` | `engine.getVideoElement()?.duration` | TREE A |

### 判定

```
⚠️ SSOT 轻微违规: duration 是只读属性（浏览器设定），问题在于不同 video 元素有不同 duration
实际影响: TREE A 的 duration 和 TREE B 的 duration 可能不同
```

---

## 字段 #4: Playing / Paused（播放状态）

### 写路径

| # | 位置 | 字段 | 触发方式 | 所属树 |
|---|------|------|----------|--------|
| W1 | `BaseAdapter.ts:33` | `_paused = false` | video.onplay | TREE A |
| W2 | `BaseAdapter.ts:37` | `_paused = true` | video.onpause | TREE A |
| W3 | `VideoEngine.ts:22-26` | `_state = PlaybackState` | PlayerEngine events | TREE A |
| W4 | `playerStore.ts:73-78` | `playbackState = PLAYING/PAUSED` | facade events | TREE A |
| W5 | `VideoPlayer.vue:202` | `isPlaying = true` | @play on TREE B video | TREE B |
| W6 | `VideoPlayer.vue:203` | `isPlaying = false` | @pause on TREE B video | TREE B |
| W7 | `PlayView.vue:214` | `isPaused = false/true` | engine events | TREE A |
| W8 | `usePlayer.ts:30,33` | `isPlaying = true/false` | togglePlay() 手动设置 | TREE E |

### 读路径

| # | 位置 | 字段 | 来源 |
|---|------|------|------|
| R1 | `PlayerPage.vue` | `store.isPlaying`, `store.playbackState` | playerStore |
| R2 | `VideoPlayer.vue:44` | `isPlaying` (local) | 本地 ref |
| R3 | `PlayView.vue:50,382,387` | `isPaused` (local) | 本地 ref |
| R4 | `VideoEngine.ts:54` | `isPaused` getter | engine.getState() |

### 判定

```
❌ SSOT VIOLATION: 8 条写路径，分布在 3 个状态树上
❌ 多源写入: 同一语义 (isPlaying) 有 3 个独立的本地 ref，互不同步

状态树 A (PB2): BaseAdapter._paused → VideoEngine._state → playerStore.playbackState
状态树 B (VideoPlayer): isPlaying (local ref, TREE B video events)
状态树 C (PlayView): isPaused (local ref, TREE A engine events)
状态树 D (usePlayer): isPlaying (local ref, 手动设置)

SSOT 应为: 单一 video.paused 属性
实际: 4 个独立状态副本
```

---

## 字段 #5: Volume

### 写路径

| # | 位置 | 方式 | 经何层 |
|---|------|------|--------|
| W1 | `playerStore.setVolume()` | `facade.setVolume(vol)` → ... → `video.volume` | ✅ 全链路 |
| W2 | `VideoPlayer.vue:234` | `videoEl.value.volume = Math.min(1, videoEl.value.volume + 0.1)` | **直写 video** 🔴 |
| W3 | `VideoPlayer.vue:238` | `videoEl.value.volume = Math.max(0, videoEl.value.volume - 0.1)` | **直写 video** 🔴 |
| W4 | `usePlayer.ts:54` | `video.volume = Math.max(0, Math.min(1, vol))` | **直写 video** 🔴 |

### 读路径

| # | 位置 | 方式 | 同步方向 |
|---|------|------|----------|
| R1 | `playerStore.volume` | 本地 ref，仅在 setVolume() 中设置 | **只写不读** 🔴 |
| R2 | `usePlayer.ts:55` | `volume.value = video.volume` (读回) | ✅ 双向 |
| R3 | `VideoPlayer.vue` | 无直接读取（只通过 keydown 修改） | — |

### 判定

```
❌ SSOT VIOLATION: 4 条写路径，2 条直写 video 元素
❌ playerStore.volume 是只写字段 — 从不从 facade/video 读回实际值

场景: 用户在 VideoPlayer 中用 ArrowUp 调大音量 → video.volume = 0.5
       → playerStore.volume 仍为 1（从未同步）
       → PlayerPage 音量 UI 显示错误

SSOT 应为: HTMLVideoElement.volume
实际: 3 个独立写入点，无读回机制
```

---

## 字段 #6: Muted

### 写路径

| # | 位置 | 方式 | 经何层 |
|---|------|------|--------|
| W1 | `playerStore.toggleMute()` | `facade.setMuted(!muted)` → ... → `video.muted` | ✅ 全链路 |
| W2 | `VideoPlayer.vue:246` | `videoEl.value.muted = !videoEl.value.muted` | **直写 video** 🔴 |
| W3 | `PlayerPage.vue:73` | `store.toggleMute()` | 经 store ✅ |

### 读路径

| # | 位置 | 方式 | 同步方向 |
|---|------|------|----------|
| R1 | `playerStore.muted` | 本地 ref，仅在 toggleMute() 中翻转 | **只写不读** 🔴 |
| R2 | `PlayerPage.vue:73-74` | `store.muted` | UI 渲染 |

### 判定

```
❌ SSOT VIOLATION: 2 条写路径 (1 条全链路 + 1 条直写)
❌ playerStore.muted 是只写字段 — 翻转操作而非读取真实值

场景: 用户在 VideoPlayer 中按 M 静音 → video.muted = true
       → playerStore.muted 仍为 false
       → PlayerPage 仍显示 🔊
```

---

## 字段 #7: Playback Speed

### 写路径

| # | 位置 | 方式 | 经何层 |
|---|------|------|--------|
| W1 | `VideoPlayer.vue:176` | `videoEl.value.playbackRate = s` | **直写 video** 🔴 |
| W2 | `usePlayer.ts:47` | `video.playbackRate = rate` | **直写 video** 🔴 |
| W3 | `PlayView.vue:416` | `engine.setPlaybackRate(s)` → adapter | ✅ 全链路 |
| W4 | `PlayerEngine.setPlaybackRate()` | 方法存在 | **无人调用** (dead code in PB2 context) |

### 读路径

| # | 位置 | 字段 | 来源 |
|---|------|------|------|
| R1 | `VideoPlayer.vue:106` | `currentSpeed` (local ref) | 本地 |
| R2 | `PlayView.vue:213` | `currentSpeed` (local ref) | 本地 |
| R3 | `usePlayer.ts:10` | `playbackRate` (local ref) | 本地 |
| R4 | `playerStore` | **无 speed 字段** | ❌ 不存在 |

### 判定

```
❌ SSOT VIOLATION: 4 条写路径
❌ playerStore 完全没有 speed 状态
❌ PlayerPage 完全没有倍速 UI
❌ 3 个独立的本地 speed ref，互不同步
❌ PlayerEngine.setPlaybackRate() 在 PB2 上下文中是 dead code

SSOT 应为: HTMLVideoElement.playbackRate
实际: 3 个独立本地状态 + store 完全缺失
```

---

## 字段 #8: Quality（画质）

### 写路径

| # | 位置 | 方式 | 效果 |
|---|------|------|------|
| W1 | `playerStore.switchQuality()` | `facade.switchQuality(q)` → `QualityManager.setQuality()` | ✅ 唯一写路径 |
| W2 | `QualityManager.applyToHLS()` | 设置 hls.nextLevel | ❌ 永远不执行 (hlsInstance = null) |

### 读路径

| # | 位置 | 字段 | 同步 |
|---|------|------|------|
| R1 | `QualityManager._current` | 内部字段 | SSOT |
| R2 | `playerStore.quality` | 本地 ref | switchQuality() 中乐观设置 |
| R3 | `PlayerPage.vue:60` | `store.quality` | UI |

### 判定

```
⚠️ SSOT 成立但无效: QualityManager._current 是唯一 SSOT
❌ 但 applyToHLS() 从未生效 → 画质切换是空操作

SSOT: QualityManager._current ✅
实际效果: 画质切换不工作 ❌ (因为 HLS 实例未绑定)
```

---

## 字段 #9: Subtitle Enabled

### 写路径

| # | 位置 | 方式 | 经何层 |
|---|------|------|--------|
| W1 | `playerStore.enableSubtitles()` | `subtitleEnabled = true` + `facade.enableSubtitle()` | ✅ |
| W2 | `playerStore.disableSubtitles()` | `subtitleEnabled = false` + `facade.disableSubtitle()` | ✅ |

### 读路径

| # | 位置 | 字段 | 同步 |
|---|------|------|------|
| R1 | `SubtitleManager._enabled` | 内部字段 | SSOT |
| R2 | `playerStore.subtitleEnabled` | 本地 ref | 乐观设置，不读回 |
| R3 | `PlayerPage.vue:65-66` | `store.subtitleEnabled` | UI |

### 判定

```
⚠️ SSOT 成立但有风险: SubtitleManager._enabled 是 SSOT
⚠️ playerStore.subtitleEnabled 乐观设置，如果 facade 调用失败则状态不一致

SSOT: SubtitleManager._enabled ✅ (但无读回机制)
风险: store 乐观更新
```

---

## 字段 #10: Fullscreen

### 写路径

| # | 位置 | 方式 |
|---|------|------|
| W1 | `PlayerPage.vue:183-189` | `containerRef?.requestFullscreen()` / `document.exitFullscreen()` |
| W2 | `VideoPlayer.vue:140-148` | `playerRoot.requestFullscreen()` / `document.exitFullscreen()` |
| W3 | `usePlayer.ts:58-67` | `videoRef.parentElement.requestFullscreen()` / `document.exitFullscreen()` |

### 读取

所有读取均通过 `document.fullscreenElement`（浏览器 API）— **无本地状态**。

### 判定

```
✅ SSOT 成立: document.fullscreenElement (浏览器 API)
⚠️ 3 个组件各自操作全屏，可能冲突但不影响状态正确性
```

---

## 字段 #11: Error

### 写路径

| # | 位置 | 字段值 | 来源 |
|---|------|--------|------|
| W1 | `playerStore.ts:93` | `error = '播放出错'` | **硬编码** 🔴 |
| W2 | `VideoPlayer.vue:199` | `error = '视频加载失败'` | @error 事件 |
| W3 | `PlayerPage.vue:277` | `store.$patch({ error: '加载失败: ...' })` | try/catch |

### 读路径

| # | 位置 | 字段 |
|---|------|------|
| R1 | `PlayerPage.vue:26` | `store.error` |
| R2 | `VideoPlayer.vue:12` | 本地 `error` ref |

### 判定

```
❌ SSOT VIOLATION:
- playerStore 硬编码 error 消息，丢失原始错误信息
- 2 个独立的 error ref
- 没有统一的错误类型/格式

SSOT 应为: playerStore.error（统一字符串）
实际: 硬编码 + 分离的本地状态
```

---

## 字段 #12: Source/URL

### 写路径

| # | 位置 | 方式 |
|---|------|------|
| W1 | `PlayerPage.vue:255` | `const playUrl = ''` — **硬编码空** 🔴 |
| W2 | `PlayerFacade.loadMedia()` | `this._playUrl = playUrl` (接收空字符串) |
| W3 | `VideoPlayer.vue:274` | `videoEl.value.src = url` — 直设 src |

### PlayUrl 解析链路

```
PlayerPage → mediaLibraryService.getDetail()
           → ❌ 无 getPlayUrl 方法
           → playUrl = ''

MediaEpisode: { id, title, episodeNumber? }
              ❌ 无 playUrl 字段

IProvider: { search, detail, catalog?, healthCheck }
           ❌ 无 getPlayUrl / resolveUrl 方法
```

### 判定

```
❌ SSOT 不存在: playUrl 的 Truth Source 在整个系统中不存在
❌ MediaEpisode 无 url 字段
❌ IProvider 无 URL 解析接口
```

---

## 字段 #13: Episode（当前剧集）

### 写路径

| # | 位置 | 方式 |
|---|------|------|
| W1 | `playerStore.loadMedia()` | `currentEpisode.value = episode` |
| W2 | `playerStore.switchEpisode()` | `currentEpisode.value = episode` |
| W3 | `EpisodeManager.selectById()` | `_index = idx` |
| W4 | `EpisodeManager.loadEpisodeList()` | `episodes = detail.episodes` |

### 读路径

| # | 位置 | 字段 | 来源 |
|---|------|------|------|
| R1 | `EpisodeManager.currentEpisode` | `episodes[_index]` | 内部数组 |
| R2 | `playerStore.currentEpisode` | Ref | store 本地 |
| R3 | `PlayerPage.vue:53-54` | `store.currentEpisode` | store |
| R4 | `PlayerPage.vue:133-134` | `store.currentDetail?.episodes` | computed |

### 判定

```
⚠️ 双源写入: EpisodeManager._index 和 playerStore.currentEpisode 独立更新
⚠️ Episode 数据双写: EpisodeManager.episodes = playerStore.currentDetail.episodes (两个独立数组引用)

SSOT 应为: EpisodeManager（业务逻辑层）
实际: store 和 manager 各自维护副本
```

---

## 汇总矩阵

| # | 字段 | SSOT 应是什么 | 实际 SSOT 状态 | 写路径数 | 直写 video 数 | 严重度 |
|---|------|-------------|---------------|---------|-------------|--------|
| 1 | Video Element | 单一 `<video>` 元素 | ❌ 5 个创建点 | 5 | N/A | 🔴 CRITICAL |
| 2 | currentTime | `video.currentTime` | ❌ 5 个 video 各自持有 | 11 | 5 | 🔴 CRITICAL |
| 3 | duration | `video.duration` | ⚠️ 多 video 各自持有 | 4 | 0 | 🟡 LOW |
| 4 | playing/paused | `video.paused` | ❌ 4 个独立状态副本 | 8 | N/A | 🔴 CRITICAL |
| 5 | volume | `video.volume` | ❌ store 只写不读 + 2 处直写 | 4 | 2 | 🔴 HIGH |
| 6 | muted | `video.muted` | ❌ store 只写不读 + 1 处直写 | 2 | 1 | 🟡 MEDIUM |
| 7 | speed | `video.playbackRate` | ❌ store 无字段 + 2 处直写 | 4 | 2 | 🔴 HIGH |
| 8 | quality | `QualityManager._current` | ✅ 唯一 SSOT（但无效） | 1 | N/A | 🟡 MEDIUM |
| 9 | subtitleEnabled | `SubtitleManager._enabled` | ⚠️ store 乐观不读回 | 2 | N/A | 🟢 LOW |
| 10 | fullscreen | `document.fullscreenElement` | ✅ 浏览器 SSOT | 3 | N/A | ✅ OK |
| 11 | error | `playerStore.error` | ❌ 硬编码 + 2 个独立 ref | 3 | N/A | 🟡 MEDIUM |
| 12 | source/URL | IProvider.getPlayUrl() | ❌ 不存在 | 1 | N/A | 🔴 CRITICAL |
| 13 | episode | `EpisodeManager` | ⚠️ store+manager 双写 | 4 | N/A | 🟡 MEDIUM |

---

## 汇总统计

| 分类 | 数量 |
|------|------|
| 审计字段 | 13 |
| 🔴 CRITICAL | 4 (video element, currentTime, playing, playUrl) |
| 🔴 HIGH | 2 (volume, speed) |
| 🟡 MEDIUM | 5 (muted, quality, episode, error, duration) |
| 🟢 LOW | 1 (subtitleEnabled) |
| ✅ OK | 1 (fullscreen) |
| 直写 video 元素 | 10 处 |
| 只写不读字段 | 3 个 (volume, muted, subtitleEnabled) |
| Store 完全缺失字段 | 1 个 (speed) |

---

## S3B 修复指令

S3A 已确认所有断裂点。S3B 修复阶段必须解决：

1. **统一 Video Element**: 删除 TREE B/C/D/E，只保留一个 `<video>` 在 PlayerPage
2. **统一写路径**: 所有状态修改必须经过 `playerStore → Facade → Engine → Adapter → video`
3. **统一读路径**: 所有状态读取必须经过 `playerStore`（从 video 读回，而非乐观设置）
4. **新增 playUrl 解析**: IProvider 新增 `getPlayUrl` 方法
5. **新增 speed 状态**: playerStore 新增 speed 字段
6. **删除 dead code**: usePlayer.ts composable（未被任何组件使用）
7. **清理直写**: VideoPlayer.vue 移除所有 `videoEl.value.* = ...` 直写
