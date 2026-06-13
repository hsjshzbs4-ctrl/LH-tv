// src/composables/usePlayer.ts - 播放器状态管理
import { ref, type Ref } from 'vue'

export function usePlayer() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const hlsInstance = ref<unknown>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const playbackRate = ref(1)
  const volume = ref(1)
  const isFullscreen = ref(false)
  const showControls = ref(true)

  let controlsTimer: ReturnType<typeof setTimeout> | null = null

  function showControlsTemporarily() {
    showControls.value = true
    if (controlsTimer) clearTimeout(controlsTimer)
    controlsTimer = setTimeout(() => {
      if (isPlaying.value) showControls.value = false
    }, 3000)
  }

  function togglePlay() {
    const video = videoRef.value
    if (!video) return
    if (video.paused) {
      video.play()
      isPlaying.value = true
    } else {
      video.pause()
      isPlaying.value = false
    }
  }

  function seek(seconds: number) {
    const video = videoRef.value
    if (!video) return
    video.currentTime = Math.max(0, Math.min(seconds, video.duration || 0))
    currentTime.value = video.currentTime
  }

  function setPlaybackRate(rate: number) {
    const video = videoRef.value
    if (!video) return
    video.playbackRate = rate
    playbackRate.value = rate
  }

  function setVolume(vol: number) {
    const video = videoRef.value
    if (!video) return
    video.volume = Math.max(0, Math.min(1, vol))
    volume.value = video.volume
  }

  function toggleFullscreen() {
    const el = videoRef.value?.parentElement
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      isFullscreen.value = true
    } else {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }

  function getCurrentTimeSeconds(): number {
    return videoRef.value ? Math.floor(videoRef.value.currentTime) : 0
  }

  return {
    videoRef,
    hlsInstance,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isFullscreen,
    showControls,
    showControlsTemporarily,
    togglePlay,
    seek,
    setPlaybackRate,
    setVolume,
    toggleFullscreen,
    getCurrentTimeSeconds
  }
}
