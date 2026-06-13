<!-- src/components/player/VideoPlayer.vue - 核心播放器 -->
<template>
  <div class="video-player" ref="playerRoot" @mousemove="onMouseMove" @click="togglePlay">
    <!-- 加载状态 -->
    <div v-if="loading" class="player-overlay">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingMsg }}</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="player-overlay error-overlay">
      <p class="error-icon">⚠️</p>
      <p class="error-text">{{ error }}</p>
      <div class="error-actions">
        <button class="btn-retry" @click.stop="$emit('retry')">🔄 切换其他源</button>
        <button class="btn-back" @click.stop="$emit('back')">← 返回</button>
      </div>
    </div>

    <!-- 视频元素 -->
    <video
      v-show="!loading && !error"
      ref="videoEl"
      :src="src"
      class="video-el"
      :controls="false"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoaded"
      @error="onError"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    ></video>

    <!-- 返回按钮 -->
    <button class="back-btn" v-show="showUI" @click.stop="$emit('back')">
      ← 返回
    </button>

    <!-- 底部控制栏 -->
    <div class="controls-bar" v-show="showUI && !loading">
      <div class="controls-left">
        <button class="ctrl-btn" @click.stop="togglePlay">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="ctrl-btn" :disabled="!hasPrev" @click.stop="$emit('prev')">
          ⏮
        </button>
        <button class="ctrl-btn" :disabled="!hasNext" @click.stop="$emit('next')">
          ⏭
        </button>
        <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
      <div class="controls-right">
        <button
          v-for="s in speeds"
          :key="s"
          class="speed-btn"
          :class="{ active: currentSpeed === s }"
          @click.stop="setSpeed(s)"
        >{{ s }}x</button>
        <button v-if="pipSupported" class="ctrl-btn" @click.stop="togglePiP" :title="isPiP ? '退出画中画' : '画中画'">
          {{ isPiP ? '⏏' : '⊡' }}
        </button>
        <button class="ctrl-btn" @click.stop="toggleFullscreen" title="全屏">
          ⛶
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  hasPrev?: boolean
  hasNext?: boolean
  autoplay?: boolean
}>(), {
  hasPrev: false,
  hasNext: false,
  autoplay: true
})

const emit = defineEmits<{
  retry: []
  back: []
  prev: []
  next: []
  timeupdate: [time: number]
  loaded: []
  ended: []
}>()

const playerRoot = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)

const loading = ref(true)
const loadingMsg = ref('加载中...')
const error = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const currentSpeed = ref(1)
const showUI = ref(true)

const speeds = [0.5, 1, 1.25, 1.5, 2]

let hideUITimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.src, () => {
  loading.value = true
  loadingMsg.value = '加载中...'
  error.value = ''
})

function onMouseMove() {
  showUI.value = true
  if (hideUITimer) clearTimeout(hideUITimer)
  hideUITimer = setTimeout(() => {
    if (isPlaying.value) showUI.value = false
  }, 3000)
}

function togglePlay() {
  if (!videoEl.value) return
  if (videoEl.value.paused) {
    videoEl.value.play()
  } else {
    videoEl.value.pause()
  }
}

// 画中画
const pipSupported = ref(false)
const isPiP = ref(false)

function toggleFullscreen() {
  if (playerRoot.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      playerRoot.value.requestFullscreen()
    }
  }
}

async function togglePiP() {
  if (!videoEl.value) return
  try {
    if (document.pictureInPictureElement === videoEl.value) {
      await document.exitPictureInPicture()
      isPiP.value = false
    } else {
      await videoEl.value.requestPictureInPicture()
      isPiP.value = true
    }
  } catch (e) {
    console.log('[PiP] 切换失败:', (e as Error).message)
  }
}

// 在 video 上监听 PiP 事件
function setupPiPEvents() {
  if (!videoEl.value) return
  pipSupported.value = document.pictureInPictureEnabled

  videoEl.value.addEventListener('enterpictureinpicture', () => { isPiP.value = true })
  videoEl.value.addEventListener('leavepictureinpicture', () => { isPiP.value = false })
}

function setSpeed(s: number) {
  currentSpeed.value = s
  if (videoEl.value) videoEl.value.playbackRate = s
}

function onTimeUpdate() {
  if (videoEl.value) {
    currentTime.value = videoEl.value.currentTime
    emit('timeupdate', videoEl.value.currentTime)
  }
}

function onLoaded() {
  loading.value = false
  if (videoEl.value) {
    duration.value = videoEl.value.duration || 0
    setupPiPEvents()
    if (props.autoplay) {
      videoEl.value.play().catch(() => { /* autoplay blocked */ })
    }
  }
  emit('loaded')
}

function onError() {
  error.value = '视频加载失败'
}

function onPlay() { isPlaying.value = true }
function onPause() { isPlaying.value = false }
function onEnded() { emit('ended') }

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ==================== 键盘快捷键 ====================
function handleKeydown(e: KeyboardEvent) {
  // 忽略输入框中的按键
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (videoEl.value) videoEl.value.currentTime = Math.max(0, videoEl.value.currentTime - 5)
      break
    case 'ArrowRight':
      e.preventDefault()
      if (videoEl.value) videoEl.value.currentTime = Math.min(videoEl.value.duration || 0, videoEl.value.currentTime + 5)
      break
    case 'ArrowUp':
      e.preventDefault()
      if (videoEl.value) videoEl.value.volume = Math.min(1, videoEl.value.volume + 0.1)
      break
    case 'ArrowDown':
      e.preventDefault()
      if (videoEl.value) videoEl.value.volume = Math.max(0, videoEl.value.volume - 0.1)
      break
    case 'KeyF':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'KeyM':
      e.preventDefault()
      if (videoEl.value) videoEl.value.muted = !videoEl.value.muted
      break
    case 'KeyN':
      e.preventDefault()
      if (props.hasNext) emit('next')
      break
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
      e.preventDefault()
      setSpeed(speeds[parseInt(e.code.slice(-1)) - 1])
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

defineExpose({
  videoEl,
  seek: (pos: number) => { if (videoEl.value) videoEl.value.currentTime = pos },
  getCurrentTime: () => videoEl.value?.currentTime || 0,
  play: () => videoEl.value?.play(),
  pause: () => videoEl.value?.pause(),
  setSource: (url: string) => {
    loading.value = true
    error.value = ''
    if (videoEl.value) videoEl.value.src = url
  }
})
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  cursor: pointer;
}

.video-el {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a14;
  color: var(--color-text-secondary);
}

.error-overlay { background: #0a0a14; }
.error-icon { font-size: 32px; margin-bottom: 8px; }
.error-text { font-size: var(--text-md); margin-bottom: 16px; }
.error-actions { display: flex; gap: 8px; }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text { font-size: var(--text-sm); color: var(--color-text-tertiary); }

.back-btn {
  position: absolute;
  top: 12px; left: 12px;
  z-index: 10;
  padding: 6px 14px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  backdrop-filter: blur(4px);
  transition: all var(--duration-fast) var(--ease-out);
}
.back-btn:hover { background: rgba(255,255,255,0.15); }

.controls-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
}

.controls-left, .controls-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctrl-btn {
  width: 32px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #ccc;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.ctrl-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.ctrl-btn:disabled { opacity: 0.3; cursor: default; }

.time-display {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  margin-left: 4px;
}

.speed-btn {
  padding: 2px 7px;
  background: transparent;
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.speed-btn:hover { color: #fff; border-color: var(--color-accent); }
.speed-btn.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }

.btn-retry {
  padding: 6px 16px;
  background: var(--color-accent-blue);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
}
.btn-back {
  padding: 6px 16px;
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
}
</style>
