<!-- src/renderer/pages/PlayerPage.vue - PB2-S1 播放页 -->
<template>
  <div class="player-page" ref="containerRef" @mousemove="onMouseMove" @keydown="onKeydown" tabindex="0">
    <!-- 视频区域 -->
    <div class="video-area" ref="videoAreaRef" @click="togglePlay">
      <!-- S3A-1: 唯一 <video> 元素 — PlayerEngine 复用此元素 -->
      <video
        ref="videoEl"
        class="video-el"
        :controls="false"
        playsinline
      ></video>

      <!-- 加载中 -->
      <div v-if="store.isLoading" class="overlay-center">
        <LoadingSpinner />
      </div>

      <!-- 中央播放按钮（暂停时） -->
      <div
        v-if="!store.isPlaying && !store.isLoading && store.playbackState !== 'ended'"
        class="overlay-center clickable"
        @click.stop="store.play()"
      >
        <button class="big-play-btn">▶</button>
      </div>

      <!-- 播放结束 -->
      <div v-if="store.playbackState === 'ended'" class="overlay-center">
        <button class="replay-btn" @click.stop="store.seek(0); store.play()">🔄 重新播放</button>
      </div>

      <!-- S3A-3: 源切换中 -->
      <div v-if="store.switchingSource" class="overlay-center">
        <LoadingSpinner />
        <span style="color:#fff;margin-top:12px;font-size:14px">正在切换播放源...</span>
      </div>

      <!-- 错误 -->
      <div v-else-if="store.error" class="overlay-center">
        <ErrorState :message="store.error" :on-retry="() => store.tryNextSource()" hint="点击重试切换播放源" />
        <button class="replay-btn" style="margin-top:8px" @click.stop="goBack">← 返回</button>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div
      class="control-bar"
      :class="{ visible: showControls }"
    >
      <!-- 进度条 -->
      <div class="progress-row" @click="onProgressClick">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: store.progressPercent + '%' }" />
          <div class="progress-thumb" :style="{ left: store.progressPercent + '%' }" />
        </div>
        <span class="time-display">{{ formatTime(store.currentTime) }} / {{ formatTime(store.duration) }}</span>
      </div>

      <!-- 按钮栏 -->
      <div class="button-row">
        <div class="left-btns">
          <button class="ctrl-btn" @click="store.play()" :title="store.isPlaying ? '暂停' : '播放'">
            {{ store.isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="ctrl-btn" @click="prevEpisode" :disabled="!hasPrev" title="上一集">⏮</button>
          <button class="ctrl-btn" @click="nextEpisode" :disabled="!hasNext" title="下一集">⏭</button>
          <!-- S3A-5: 剧集面板入口 -->
          <button
            class="ctrl-btn"
            :class="{ active: showEpisodePanel }"
            @click="showEpisodePanel = !showEpisodePanel"
            title="剧集列表 (E)"
          >📺</button>
          <span class="episode-label" v-if="store.currentEpisode && !showEpisodePanel">
            {{ store.currentEpisode.title || '第' + store.currentEpisode.episodeNumber + '集' }}
          </span>
        </div>

        <div class="right-btns">
          <!-- 画质选择 -->
          <button class="ctrl-btn" @click="cycleQuality" title="画质">{{ store.quality }}</button>

          <!-- 字幕 -->
          <button
            class="ctrl-btn"
            :class="{ active: store.subtitleEnabled }"
            @click="store.subtitleEnabled ? store.disableSubtitles() : store.enableSubtitles()"
            title="字幕"
          >
            CC
          </button>

          <!-- 音量 -->
          <button class="ctrl-btn" @click="store.toggleMute()" :title="store.muted ? '取消静音' : '静音'">
            {{ store.muted ? '🔇' : '🔊' }}
          </button>

          <!-- 全屏 -->
          <button class="ctrl-btn" @click="toggleFullscreen" title="全屏">⛶</button>
        </div>
      </div>
    </div>

    <!-- 剧集列表侧栏 -->
    <div v-if="showEpisodePanel" class="episode-panel">
      <h3>📺 剧集列表</h3>
      <div class="episode-grid">
        <button
          v-for="(ep, idx) in episodes"
          :key="ep.id"
          class="ep-btn"
          :class="{ current: ep.id === store.currentEpisode?.id }"
          @click="selectEpisode(idx)"
        >
          {{ ep.title || '第' + ep.episodeNumber + '集' }}
        </button>
      </div>
      <button class="close-panel-btn" @click="showEpisodePanel = false">✕</button>
    </div>

    <!-- 继续观看弹窗（PATCH 4） -->
    <div v-if="store.showResumeDialog" class="resume-overlay" @click.self="store.showResumeDialog = false">
      <div class="resume-dialog">
        <p>是否从上次位置继续观看？</p>
        <span class="resume-pos">{{ formatTime(store.resumePosition) }}</span>
        <div class="resume-actions">
          <button class="resume-ok" @click="store.play()">继续播放</button>
          <button class="resume-skip" @click="store.showResumeDialog = false; store.play()">从头开始</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { PlaybackQuality } from '@/player'
import type { MediaEpisode } from '@provider-contracts'

const router = useRouter()
const route = useRoute()
const store = usePlayerStore()

const containerRef = ref<HTMLElement | null>(null)
const videoAreaRef = ref<HTMLElement | null>(null)
/** S3A-1: 唯一 video 元素 ref */
const videoEl = ref<HTMLVideoElement | null>(null)
const showControls = ref(true)
const showEpisodePanel = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const episodes = computed<MediaEpisode[]>(() => {
  return store.currentDetail?.episodes || []
})

const hasPrev = computed(() => episodes.value.length > 1)
const hasNext = computed(() => episodes.value.length > 1)

const QUALITY_CYCLE: PlaybackQuality[] = [
  PlaybackQuality.AUTO,
  PlaybackQuality.P720,
  PlaybackQuality.P1080,
  PlaybackQuality.P480,
  PlaybackQuality.P360,
]

function cycleQuality() {
  const idx = QUALITY_CYCLE.indexOf(store.quality)
  const next = QUALITY_CYCLE[(idx + 1) % QUALITY_CYCLE.length]
  store.switchQuality(next)
}

async function selectEpisode(idx: number) {
  const ep = episodes.value[idx]
  if (!ep) return
  showEpisodePanel.value = false
  await store.switchEpisode(ep, '' /* URL 由 facade 内部管理 */)
}

async function prevEpisode() {
  const idx = episodes.value.findIndex(e => e.id === store.currentEpisode?.id)
  if (idx > 0) await selectEpisode(idx - 1)
}

async function nextEpisode() {
  const idx = episodes.value.findIndex(e => e.id === store.currentEpisode?.id)
  if (idx < episodes.value.length - 1) await selectEpisode(idx + 1)
}

function togglePlay() {
  if (store.isPlaying) store.pause()
  else store.play()
}

function onProgressClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  store.seek(ratio * store.duration)
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    containerRef.value?.requestFullscreen()
  }
}

function onMouseMove() {
  showControls.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { if (store.isPlaying) showControls.value = false }, 3000)
}

// ── PATCH 4: 键盘快捷键 ──
function onKeydown(e: KeyboardEvent) {
  switch (e.code) {
    case 'Space':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      e.preventDefault()
      store.seek(Math.max(0, store.currentTime - 10))
      break
    case 'ArrowRight':
      e.preventDefault()
      store.seek(Math.min(store.duration, store.currentTime + 10))
      break
    case 'Escape':
      e.preventDefault()
      if (document.fullscreenElement) document.exitFullscreen()
      else goBack()
      break
    case 'KeyF':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'KeyM':
      e.preventDefault()
      store.toggleMute()
      break
    case 'KeyN':
      e.preventDefault()
      nextEpisode()
      break
    case 'KeyE':
      e.preventDefault()
      showEpisodePanel.value = !showEpisodePanel.value  // S3A-5
      break
  }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function goBack() {
  store.destroy()
  router.back()
}

onMounted(async () => {
  const providerId = route.params?.providerId as string || route.query?.providerId as string
  const mediaId = route.params?.mediaId as string || route.query?.mediaId as string
  const episodeId = route.params?.episodeId as string || route.query?.episodeId as string

  if (providerId && mediaId && episodeId) {
    try {
      // 从 content/ 服务获取媒体数据
      const { mediaLibraryService } = await import('@/content/mediaLibrary')
      const detail = await mediaLibraryService.getDetail(providerId, mediaId)
      const episode = detail.episodes.find(e => e.id === episodeId) || detail.episodes[0]
      const playUrl = episode.url || ''  // S3A-2: 从 MediaEpisode.url 获取播放地址

      // 构建 MediaItem
      const media = {
        id: detail.id,
        title: detail.title,
        cover: detail.cover,
        providerId: detail.providerId,
        providerName: '',
        type: 'movie' as const,
      }

      // S3A-1: 必须在 loadMedia 之前绑定 video 元素
      if (videoEl.value) {
        store.initialize(videoEl.value)
      }

      await store.loadMedia(media, detail, episode, playUrl)

      // 绑定 video 元素
      if (containerRef.value) {
        const videoArea = videoAreaRef.value
        if (videoArea) {
          store.play() // 触发播放器初始化
        }
      }
    } catch (e) {
      store.$patch({ error: `加载失败: ${(e as Error).message}` })
    }
  }
})

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
  store.destroy()
})
</script>

<style scoped>
.player-page {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
  outline: none;
}

.video-area {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* S3A-1: 唯一 video 元素样式 */
.video-el {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.overlay-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
}

.big-play-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  transition: transform 0.2s;
}
.big-play-btn:hover { transform: scale(1.1); }

.replay-btn {
  padding: 12px 28px;
  font-size: 16px;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 8px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  cursor: pointer;
}

/* 控制栏 */
.control-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.85));
  padding: 32px 16px 12px;
  z-index: 20;
  transition: opacity 0.4s;
  opacity: 0;
}
.control-bar.visible { opacity: 1; }

.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  padding: 4px 0;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  position: relative;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent, #e8a850);
  border-radius: 2px;
}

.progress-thumb {
  position: absolute;
  top: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-accent, #e8a850);
  transform: translateX(-50%);
  display: none;
}
.progress-track:hover .progress-thumb { display: block; }
.progress-track:hover { height: 6px; }

.time-display {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
  min-width: 80px;
  text-align: right;
}

.button-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-btns, .right-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ctrl-btn {
  padding: 6px 10px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.ctrl-btn:hover { background: rgba(255,255,255,0.15); }
.ctrl-btn:disabled { opacity: 0.3; cursor: default; }
.ctrl-btn.active { color: var(--color-accent, #e8a850); }

.episode-label {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  margin-left: 8px;
}

/* 剧集面板 */
.episode-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: rgba(20,20,40,0.95);
  padding: 16px;
  z-index: 30;
  overflow-y: auto;
}
.episode-panel h3 {
  color: #fff;
  margin: 0 0 12px;
  font-size: 16px;
}
.episode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.ep-btn {
  padding: 10px 8px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  background: transparent;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.ep-btn:hover { border-color: var(--color-accent, #e8a850); color: #fff; }
.ep-btn.current {
  background: var(--color-accent, #e8a850);
  color: #000;
  border-color: var(--color-accent, #e8a850);
}
.close-panel-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff;
  cursor: pointer;
}

/* 续播弹窗 */
.resume-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.resume-dialog {
  background: rgba(30,30,50,0.95);
  padding: 32px 40px;
  border-radius: 14px;
  text-align: center;
}
.resume-dialog p { color: #fff; font-size: 16px; margin: 0 0 8px; }
.resume-pos { color: var(--color-accent, #e8a850); font-size: 14px; display: block; margin-bottom: 20px; }
.resume-actions { display: flex; gap: 12px; justify-content: center; }
.resume-ok, .resume-skip {
  padding: 10px 24px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
}
.resume-ok {
  background: var(--color-accent, #e8a850);
  color: #000;
  border: none;
  font-weight: 600;
}
.resume-skip {
  background: transparent;
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.3);
}
</style>
