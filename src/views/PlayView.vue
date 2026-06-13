<!-- src/views/PlayView.vue - 播放页（v3: PlayerEngine 驱动）-->
<template>
  <div class="play-page">
    <!-- 播放器区域 -->
    <div class="player-wrapper">
      <div class="player-container" ref="playerContainer">
        <!-- 返回按钮 -->
        <button class="back-btn" @click="goBack" v-show="showControls">← 返回</button>

        <!-- 播放器容器（由 PlayerEngine 接管） -->
        <div class="video-area" ref="engineContainer"></div>

        <!-- 恢复播放提示 -->
        <div v-if="showResumePrompt" class="player-overlay resume-overlay">
          <p class="resume-title">继续上次播放？</p>
          <p class="resume-info" v-if="resumeInfo">{{ resumeInfo.episodeLabel }} · {{ formatTime(resumeInfo.currentTime) }}</p>
          <div class="resume-btns">
            <button class="btn btn-resume" @click="handleResumePlay">▶ 继续播放</button>
            <button class="btn btn-restart" @click="handleRestartPlay">🔄 从头开始</button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="player-overlay">
          <div class="spinner"></div>
          <p>{{ loadingMsg }}</p>
        </div>

        <!-- 源切换中 -->
        <div v-if="switchingSource" class="player-overlay switch-overlay">
          <div class="spinner"></div>
          <p class="switch-title">正在切换播放源...</p>
          <p class="switch-detail">{{ switchDetail }}</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="player-overlay error-overlay">
          <p class="error-icon">⚠️</p>
          <p class="error-msg">{{ error }}</p>
          <div class="error-btns">
            <button class="btn btn-retry" @click="retry()">🔄 切换其他源</button>
            <button class="btn btn-back" @click="goBack">← 返回首页</button>
          </div>
        </div>

        <!-- 底部控制 -->
        <div class="player-controls" v-show="showControls && !loading && !error">
          <button class="ctrl-btn" :disabled="!hasPrev" @click="playPrev">⏮ 上一集</button>
          <button class="ctrl-btn primary" @click="togglePlayPause">
            {{ isPaused ? '▶' : '⏸' }}
          </button>
          <button class="ctrl-btn" :disabled="!hasNext" @click="playNext">下一集 ⏭</button>
          <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <span class="speed-label">倍速:</span>
          <button
            v-for="s in speeds"
            :key="s"
            class="speed-btn"
            :class="{ active: currentSpeed === s }"
            @click="setSpeed(s)"
          >{{ s }}x</button>
        </div>
      </div>
    </div>

    <!-- 剧集信息 -->
    <div class="show-info-bar" v-if="detail">
      <div class="info-left">
        <h1 class="show-title">{{ detail.name }}</h1>
        <p class="show-meta">
          <span v-if="detail.genres?.length">{{ detail.genres.join(' · ') }}</span>
          <span v-if="detail.year"> | {{ detail.year }}</span>
          <span v-if="detail.rating"> | ⭐{{ detail.rating }}</span>
        </p>
        <p class="show-summary" v-if="detail.summary">{{ detail.summary }}</p>
      </div>
      <div class="info-actions">
        <button class="action-btn" @click="toggleFav">
          {{ isFaved ? '★ 已收藏' : '☆ 收藏' }}
        </button>
      </div>
    </div>

    <!-- 源切换 -->
    <div class="source-section">
      <span class="source-current" v-if="currentSourceId">
        当前源: <strong>{{ currentSourceName }}</strong>
      </span>
      <!-- P4.2: 手动源切换按钮 -->
      <div class="source-buttons" v-if="sourceButtonList.length > 1">
        <button
          v-for="src in sourceButtonList"
          :key="src.providerId"
          class="source-select-btn"
          :class="{ active: src.providerId === currentSourceId || src.name === currentSourceId }"
          :disabled="switchingSource"
          @click="manualSwitchSource(src.providerId || src.name)"
        >
          {{ src.providerName || src.name }}
        </button>
      </div>
      <SourceSwitcher
        v-if="sources.length > 1"
        v-model="currentSourceIdx"
        :sources="sources"
      />
    </div>

    <!-- 选集 -->
    <div class="episode-section" v-if="currentEpisodes.length > 0">
      <h3 class="season-title">
        选集
        <span class="count">共 {{ currentEpisodes.length }} 集</span>
      </h3>
      <div class="episode-grid">
        <div class="episode-item" v-for="ep in currentEpisodes" :key="ep.number">
          <button
            class="episode-btn"
            :class="{ playing: currentEp?.number === ep.number }"
            @click="playEpisode(ep)"
          >
            {{ formatEpLabel(ep.label) }}
          </button>
          <button
            class="episode-download-btn"
            @click="downloadEpisode(ep)"
            title="下载本集"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SourceSwitcher from '@/components/player/SourceSwitcher.vue'
import { useUserStore } from '@/stores/user'
import { PlayerEngine, PlayerEvent } from '@/core/player'
import { cacheManager, CacheNamespace } from '@/core/cache'
import { downloadFacade } from '@/core/download'
import { historyFacade } from '@/core/history'
import { continueWatchingFacade } from '@/core/continue-watching'
import { PlaybackFacade, SourceSwitchEvent } from '@/core/playback'
import { aggregationFacade } from '@/core/aggregation'
import { monitoring } from '@/core/monitoring'
import type { PlaybackSource } from '@/core/playback'
import type { ShowDetail, Episode, PlaySource, PlaybackSpeed } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// DOM 引用
const playerContainer = ref<HTMLElement | null>(null)
const engineContainer = ref<HTMLElement | null>(null)

// ======== PlayerEngine ========
const engine = new PlayerEngine({
  speeds: [0.5, 1, 1.25, 1.5, 2],
  defaultSpeed: 1,
  progressSaveInterval: 15,
  resumeMinPosition: 30,
  autoplay: true,
})

// 绑定进度保存 + 观看历史记录
let historyRecorded = false
engine.onProgressSave = (time: number) => {
  if (!detail.value || !currentEp.value) return

  // 原有播放进度保存
  userStore.savePosition(detail.value.name, currentEp.value.number, time)

  // 观看历史：播放超过30秒 → 记录/更新历史
  if (time >= 30) {
    const ep = currentEp.value
    const dur = engine.getVideoElement()?.duration || 0
    if (!historyRecorded) {
      // 首次记录
      historyFacade.recordHistory({
        id: `hist_${detail.value.id}_${ep.number}`,
        mediaId: String(detail.value.id),
        episodeId: `${detail.value.id}_${ep.number}`,
        providerId: detail.value.siteKey || detail.value.siteName || '',
        title: detail.value.name,
        cover: detail.value.image || '',
        episodeLabel: ep.label,
        duration: dur,
        currentTime: time,
        progress: dur > 0 ? time / dur : 0,
        lastWatchedAt: Date.now(),
      })
      historyRecorded = true
    } else {
      // 更新进度
      historyFacade.updateProgress(`${detail.value.id}_${ep.number}`, time, dur)
    }
  }
}

// ======== 状态 ========
const showName = computed(() => (route.query.name as string) || '')
const loading = ref(true)
const loadingMsg = ref('加载中...')
const error = ref('')
const showControls = ref(true)
const currentTime = ref(0)
const duration = ref(0)
const currentSpeed = ref<PlaybackSpeed>(1)
const isPaused = ref(false)

const detail = ref<ShowDetail | null>(null)
const sources = ref<PlaySource[]>([])
const currentSourceIdx = ref(0)
const currentEp = ref<Episode | null>(null)

// ======== P4.2 智能源切换状态 ========
const playbackFacade = new PlaybackFacade({ maxRetries: 3 })
const switchingSource = ref(false)
const switchDetail = ref('')
const currentSourceId = ref('')
const currentSourceName = computed(() => {
  if (!currentSourceId.value) return '—'
  const src = sources.value[currentSourceIdx.value]
  return src?.name || currentSourceId.value
})
const allPlaybackSources = ref<PlaybackSource[]>([])
let loadTimeout: ReturnType<typeof setTimeout> | null = null
/** P4.5: 首帧计时（playEpisode 开始 → READY 事件） */
let loadStartTime = 0

// 健康追踪 → AggregationEngine
playbackFacade.onSwitchResult = (providerId: string, success: boolean) => {
  // 通过 aggregationFacade 的 subscribe 无法直接标记，使用 legacy 方式
  // 健康状态由 AggregationEngine 内部通过搜索结果自动追踪
  // 这里仅做日志记录
}

const speeds: PlaybackSpeed[] = [0.5, 1, 1.25, 1.5, 2]
const isFaved = computed(() => detail.value ? userStore.isFavorited(detail.value.id) : false)

// Resume state
const showResumePrompt = ref(false)
const resumeInfo = ref<{ episodeId: string; currentTime: number; episodeLabel: string } | null>(null)
const resumeQuery = computed(() => route.query.resume as string | undefined)

const currentEpisodes = computed(() => {
  if (sources.value.length === 0) return []
  return sources.value[currentSourceIdx.value]?.episodes || []
})

// P4.2: 手动源切换按钮列表（去重 source name）
const sourceButtonList = computed(() => {
  const seen = new Set<string>()
  return sources.value.filter((s) => {
    const key = s.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((s, i) => ({
    providerId: s.name,
    name: s.name,
    providerName: s.name,
    priority: i,
  }))
})

const hasPrev = computed(() => (currentEp.value?.number || 0) > 1)
const hasNext = computed(() => {
  const eps = currentEpisodes.value
  if (!eps.length || !currentEp.value) return false
  return currentEp.value.number < eps.length
})

let hideControlsTimer: ReturnType<typeof setTimeout> | null = null

// ======== PlayerEngine 事件监听 ========
onMounted(() => {
  // 设置容器
  if (engineContainer.value) {
    engine.setContainer(engineContainer.value)
  }

  engine.on(PlayerEvent.READY, () => {
    // P4.2: 清除超时
    if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }

    loading.value = false
    switchingSource.value = false
    isPaused.value = false
    const dur = engine.getVideoElement()?.duration
    if (dur) duration.value = dur

    // P4.2: 恢复源切换前的播放进度
    const savedProgress = playbackFacade.getSavedProgress()
    if (savedProgress > 1) {
      engine.seek(savedProgress)
      playbackFacade.clearProgress()
    }

    // P4.2: 标记播放成功
    if (detail.value) {
      playbackFacade.onSuccess(String(detail.value.id))
    }
    // P4.5: 记录播放成功 + 首帧时间
    const firstFrame = loadStartTime > 0 ? performance.now() - loadStartTime : 0
    monitoring.playbackMetrics.recordPlaySuccess(currentSourceId.value || 'unknown', firstFrame)
    loadStartTime = 0

    // 恢复播放检测
    if (resumeQuery.value === 'true' && detail.value && currentEp.value) {
      const epId = route.query.episodeId as string || `${detail.value.id}_${currentEp.value.number}`
      const hist = historyFacade.getByEpisode(epId)
      if (hist && hist.currentTime > 30) {
        engine.pause()
        resumeInfo.value = {
          episodeId: epId,
          currentTime: hist.currentTime,
          episodeLabel: hist.episodeLabel,
        }
        showResumePrompt.value = true
      }
    }
  })

  engine.on(PlayerEvent.PLAY, () => { isPaused.value = false })
  engine.on(PlayerEvent.PAUSE, () => { isPaused.value = true })
  engine.on(PlayerEvent.ENDED, () => {
    // 自动播下一集
    if (hasNext.value) playNext()
  })
  engine.on(PlayerEvent.ERROR, (data) => {
    const msg = (data as { message: string })?.message || '播放失败'
    // P4.2: 不直接显示错误，先尝试自动切换源
    handleSourceError(msg)
  })

  engine.on(PlayerEvent.TIME_UPDATE, (data) => {
    const t = (data as { currentTime: number })?.currentTime || 0
    currentTime.value = t
  })

  engine.on(PlayerEvent.BUFFERING, (data) => {
    const b = (data as { buffering: boolean })?.buffering
    if (b) loadingMsg.value = '缓冲中...'
  })

  // 鼠标移动显示控制栏
  document.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  // P4.2: 清理超时定时器
  if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
  // 保存进度后销毁
  engine.saveProgress()
  // 刷新观看历史
  if (detail.value && currentEp.value && historyRecorded) {
    const dur = engine.getVideoElement()?.duration || 0
    const t = engine.getVideoElement()?.currentTime || 0
    historyFacade.updateProgress(`${detail.value.id}_${currentEp.value.number}`, t, dur)
  }
  engine.destroy()
  document.removeEventListener('mousemove', onMouseMove)
})

// 监听源切换
watch(currentSourceIdx, () => {
  const eps = sources.value[currentSourceIdx.value]?.episodes
  if (eps?.length) playEpisode(eps[0])
})

// ======== 控制 ========
function onMouseMove() {
  showControls.value = true
  if (hideControlsTimer) clearTimeout(hideControlsTimer)
  hideControlsTimer = setTimeout(() => {
    if (!isPaused.value) showControls.value = false
  }, 3000)
}

function togglePlayPause() {
  if (isPaused.value) engine.play()
  else engine.pause()
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatEpLabel(label: string): string {
  return label.replace('第', '').replace('集', '')
}

function goBack() {
  if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
  engine.saveProgress()
  if (detail.value && currentEp.value && historyRecorded) {
    const dur = engine.getVideoElement()?.duration || 0
    const t = engine.getVideoElement()?.currentTime || 0
    historyFacade.updateProgress(`${detail.value.id}_${currentEp.value.number}`, t, dur)
  }
  engine.destroy()
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function setSpeed(s: PlaybackSpeed) {
  currentSpeed.value = s
  engine.setPlaybackRate(s)
}

function playEpisode(ep: Episode, preserveProgress = false) {
  // P4.2: 保存进度（源切换时保留）
  if (preserveProgress) {
    playbackFacade.saveProgress(currentTime.value)
  } else {
    engine.saveProgress()
    playbackFacade.clearProgress()
  }

  currentEp.value = ep
  historyRecorded = false
  loading.value = true
  error.value = ''
  switchingSource.value = false
  loadingMsg.value = '正在加载...'
  loadStartTime = performance.now() // P4.5

  // 更新当前源 ID
  const currentSource = sources.value[currentSourceIdx.value]
  currentSourceId.value = currentSource?.name || ''

  // 通过 PlayerEngine 加载
  engine.load(ep.url)

  // P4.2: 15s 超时检测
  if (loadTimeout) clearTimeout(loadTimeout)
  loadTimeout = setTimeout(() => {
    handleSourceError('播放超时（15秒）')
  }, 15_000)

  // 记录历史
  if (detail.value) {
    userStore.addHistory(
      { id: detail.value.id, name: detail.value.name, image: detail.value.image || '' },
      { id: `${detail.value.id}_${ep.number}`, season: 1, number: ep.number, name: ep.label }
    )
  }
}

function playPrev() {
  const eps = currentEpisodes.value
  if (!eps.length || !currentEp.value) return
  const curNum = currentEp.value.number
  const prev = eps.filter(e => e.number < curNum).sort((a, b) => b.number - a.number)[0]
  if (prev) playEpisode(prev)
}

function playNext() {
  const eps = currentEpisodes.value
  if (!eps.length || !currentEp.value) return
  const curNum = currentEp.value.number
  const next = eps.filter(e => e.number > curNum).sort((a, b) => a.number - b.number)[0]
  if (next) playEpisode(next)
}

function retry() {
  if (sources.value.length > 1) {
    currentSourceIdx.value = (currentSourceIdx.value + 1) % sources.value.length
  }
}

// ======== P4.2 智能源切换 ========

/**
 * 源切换失败处理（ERROR 事件 / 15s 超时）
 * 1. 标记当前源失败 → 获取下一个源
 * 2. 有下一个源 → 自动切换并播放
 * 3. 无下一个源 → 显示错误
 */
function handleSourceError(reason: string) {
  if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }

  // 尝试获取下一个源
  const nextSource = playbackFacade.onFailed(reason)

  if (nextSource && detail.value && currentEp.value) {
    // P4.5: 记录自动换源
    monitoring.playbackMetrics.recordAutoSwitch(
      currentSourceId.value || 'unknown',
      nextSource.providerId,
    )
    // 自动切换：找到新源对应的 episode
    switchingSource.value = true
    switchDetail.value = `正在切换至 ${nextSource.providerName}...`
    loadingMsg.value = `正在切换至 ${nextSource.providerName}...`

    // 找到新源的 playSource 索引和 episode
    const newSrcIdx = sources.value.findIndex(
      (s) => s.name === nextSource!.providerId || s.name === nextSource!.providerName,
    )
    if (newSrcIdx >= 0) {
      currentSourceIdx.value = newSrcIdx
      const newEp = sources.value[newSrcIdx].episodes.find(
        (e) => e.number === currentEp.value!.number,
      )
      if (newEp) {
        // 保存当前进度 → 切换源 → 恢复进度
        playEpisode(newEp, true)
        return
      }
    }
  }

  // 全部耗尽 → 显示错误
  switchingSource.value = false
  loading.value = false
  // P4.5: 记录播放失败
  monitoring.playbackMetrics.recordPlayFail(currentSourceId.value || 'unknown')
  error.value = playbackFacade.hasMoreSources
    ? `播放失败: ${reason}`
    : `所有播放源均失败 (${reason})`
}

/**
 * 手动切换到指定 Provider 的播放源
 */
function manualSwitchSource(providerId: string) {
  if (!detail.value || !currentEp.value) return

  const source = playbackFacade.switchToProvider(providerId)
  if (!source) return

  // 找到对应的 playSource 和 episode
  const newSrcIdx = sources.value.findIndex(
    (s) => s.name === providerId,
  )
  if (newSrcIdx < 0) return

  const targetEp = sources.value[newSrcIdx].episodes.find(
    (e) => e.number === currentEp.value!.number,
  )
  if (!targetEp) return

  switchingSource.value = true
  switchDetail.value = `切换至 ${source.providerName}`
  loadingMsg.value = `切换至 ${source.providerName}...`
  currentSourceIdx.value = newSrcIdx

  playEpisode(targetEp, true)
}

function toggleFav() {
  if (!detail.value) return
  userStore.toggleFavorite({
    id: detail.value.id,
    name: detail.value.name,
    image: detail.value.image || '',
    genres: detail.value.genres || [],
    rating: detail.value.rating
  })
}

function handleResumePlay() {
  showResumePrompt.value = false
  if (resumeInfo.value) {
    engine.seek(resumeInfo.value.currentTime)
  }
  engine.play()
}

function handleRestartPlay() {
  showResumePrompt.value = false
  if (resumeInfo.value) {
    historyFacade.removeHistory(resumeInfo.value.episodeId)
  }
  engine.seek(0)
  engine.play()
}

function downloadEpisode(ep: Episode) {
  if (!detail.value) return
  const currentSource = sources.value[currentSourceIdx.value]
  downloadFacade.addTask({
    mediaId: String(detail.value.id),
    providerId: detail.value.siteKey || currentSource?.name || 'unknown',
    providerName: detail.value.siteName || currentSource?.name || '未知来源',
    episodeId: `${detail.value.id}_${ep.number}`,
    episodeLabel: ep.label,
    episodeNum: ep.number,
    title: detail.value.name,
    cover: detail.value.image || '',
    sourceUrl: ep.url,
  })
}

// ======== 初始化 ========
onMounted(async () => {
  if (showName.value) {
    try {
      const result = await cacheManager.cacheWrap(
        CacheNamespace.DETAIL, showName.value,
        () => window.app.getShowDetail(showName.value)
      ) as ShowDetail | null
      if (result) {
        detail.value = result
        sources.value = result.playSources || []
        if (sources.value.length > 0) {
          const firstEp = sources.value[0].episodes[0]
          if (firstEp) playEpisode(firstEp)
        } else {
          loading.value = false
          error.value = '暂无播放资源'
        }
      } else {
        loading.value = false
        error.value = `未找到 "${showName.value}" 的播放资源`
      }
    } catch (err) {
      loading.value = false
      error.value = `加载失败: ${(err as Error).message || '未知错误'}`
    }
  }
})
</script>

<style scoped>
.play-page { max-width: 1200px; margin: 0 auto; padding: 0; }
.player-wrapper { margin: -24px -24px 0; }
.player-container { position: relative; background: #000; aspect-ratio: 16/9; max-height: 55vh; border-radius: 0 0 var(--radius-md) var(--radius-md); overflow: hidden; }
.video-area { width: 100%; height: 100%; }

.back-btn {
  position: absolute; top: 12px; left: 12px; z-index: 100;
  padding: 6px 14px;
  background: rgba(0,0,0,0.7); color: #fff;
  border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-sm);
  cursor: pointer; font-size: var(--text-sm);
  backdrop-filter: blur(4px);
  transition: all var(--duration-fast) var(--ease-out);
}
.back-btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.4); }

.player-overlay {
  position: absolute; inset: 0; z-index: 50;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #0a0a14; color: var(--color-text-secondary);
}
.error-overlay { background: #0a0a14; }
.error-icon { font-size: 32px; margin-bottom: 8px; }
.error-msg { font-size: var(--text-md); margin-bottom: 16px; }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.player-controls {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 60;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
}
.ctrl-btn {
  padding: 4px 12px; border: 1px solid var(--color-border);
  border-radius: var(--radius-xs); background: transparent;
  color: var(--color-text-secondary); font-size: var(--text-xs);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
}
.ctrl-btn:hover:not(:disabled) { border-color: var(--color-accent-blue); color: var(--color-accent-blue); }
.ctrl-btn.primary { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
.ctrl-btn:disabled { opacity: 0.3; cursor: default; }
.time-display { font-size: var(--text-xs); color: var(--color-text-tertiary); font-family: var(--font-mono); margin: 0 8px; }
.speed-label { color: var(--color-text-tertiary); font-size: var(--text-xs); margin-left: auto; }
.speed-btn {
  padding: 2px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
  background: transparent; color: var(--color-text-tertiary); font-size: 11px;
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
}
.speed-btn:hover { color: #fff; border-color: var(--color-accent); }
.speed-btn.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }

.show-info-bar { display: flex; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; }
.info-left { flex: 1; }
.show-title { font-size: var(--text-xl); font-weight: var(--weight-bold); }
.show-meta { font-size: var(--text-sm); color: var(--color-text-tertiary); margin-top: 4px; }
.show-summary { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 8px; line-height: 1.5; max-height: 48px; overflow: hidden; }
.action-btn { padding: 8px 16px; background: var(--color-accent-blue); color: #fff; border-radius: var(--radius-sm); font-size: var(--text-sm); cursor: pointer; transition: opacity var(--duration-fast) var(--ease-out); }
.action-btn:hover { opacity: 0.85; }

.source-section { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 4px 0; }
.source-count-label { font-size: var(--text-xs); color: var(--color-text-tertiary); flex-shrink: 0; }
.source-current { font-size: var(--text-xs); color: var(--color-text-secondary); flex-shrink: 0; margin-right: 4px; }
.source-current strong { color: var(--color-accent); }

.source-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.source-select-btn {
  padding: 4px 12px; border: 1px solid var(--color-border);
  border-radius: var(--radius-full); background: transparent;
  color: var(--color-text-secondary); font-size: var(--text-xs);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
}
.source-select-btn:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
.source-select-btn.active { background: var(--color-accent-muted); color: var(--color-accent); border-color: var(--color-accent); }
.source-select-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* P4.2 源切换覆盖层 */
.switch-overlay { background: rgba(10, 10, 20, 0.92); z-index: 55; }
.switch-title { font-size: var(--text-md); color: var(--color-text-primary); margin: 12px 0 4px; font-weight: var(--weight-medium); }
.switch-detail { font-size: var(--text-xs); color: var(--color-text-tertiary); }

.episode-section { padding-bottom: 40px; }
.season-title { font-size: var(--text-md); font-weight: var(--weight-semibold); margin: 20px 0 12px; display: flex; align-items: baseline; gap: 8px; }
.count { font-size: var(--text-xs); color: var(--color-text-tertiary); font-weight: var(--weight-normal); }
.episode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; }
.episode-item { display: flex; flex-direction: column; gap: 4px; }
.episode-btn {
  padding: 10px 6px; background: var(--color-bg-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: var(--text-sm);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
}
.episode-btn:hover { background: var(--color-bg-hover); border-color: var(--color-accent-blue); }
.episode-btn.playing { background: rgba(91,156,245,0.15); border-color: var(--color-accent-blue); color: var(--color-accent-blue); }
.episode-download-btn {
  padding: 2px 6px; background: transparent; border: 1px solid var(--color-border);
  border-radius: var(--radius-xs); color: var(--color-text-tertiary); font-size: 11px;
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out); text-align: center;
}
.episode-download-btn:hover { color: var(--color-accent); border-color: var(--color-accent); background: var(--color-accent-muted); }

.btn { padding: 6px 16px; border-radius: var(--radius-xs); cursor: pointer; font-size: var(--text-sm); }
.btn-retry { background: var(--color-accent-blue); color: #fff; }
.btn-back { background: var(--color-bg-surface); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.error-btns { display: flex; gap: 8px; margin-top: 12px; }

.resume-overlay { background: rgba(10,10,20,0.95); }
.resume-title { font-size: var(--text-lg); color: var(--color-text-primary); margin-bottom: 4px; font-weight: var(--weight-semibold); }
.resume-info { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: 20px; }
.resume-btns { display: flex; gap: 12px; }
.btn-resume { background: var(--color-accent-blue); color: #fff; border: none; padding: 10px 24px; font-size: var(--text-md); border-radius: var(--radius-sm); }
.btn-restart { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); padding: 10px 24px; font-size: var(--text-md); border-radius: var(--radius-sm); }
</style>
