// src/stores/playerStore.ts — PB2-S1 Player Store
// Pinia store，聚合 PlayerFacade 的响应式状态

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PlayerFacade } from '@/player'
import { PlaybackState, PlaybackQuality, PlayerTelemetryEvent } from '@/player'
import type { MediaItem, MediaDetail, MediaEpisode } from '@provider-contracts'
import type { SubtitleTrack } from '@/player'

export const usePlayerStore = defineStore('player', () => {
  // ── 实例 ──
  let facade: PlayerFacade | null = null

  // ── 状态 ──
  const currentMedia = ref<MediaItem | null>(null)
  const currentDetail = ref<MediaDetail | null>(null)
  const currentEpisode = ref<MediaEpisode | null>(null)
  const playbackState = ref<PlaybackState>(PlaybackState.IDLE)
  const progress = ref(0)
  const duration = ref(0)
  const currentTime = ref(0)
  const quality = ref<PlaybackQuality>(PlaybackQuality.AUTO)
  const subtitleEnabled = ref(false)
  const subtitleTracks = ref<SubtitleTrack[]>([])
  const volume = ref(1)
  const muted = ref(false)
  const error = ref<string | null>(null)
  const showResumeDialog = ref(false)
  const resumePosition = ref(0)

  // ── 计算属性 ──
  const isPlaying = computed(() => playbackState.value === PlaybackState.PLAYING)
  const isLoading = computed(() => playbackState.value === PlaybackState.LOADING)
  const progressPercent = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0)

  // ── 遥测发射（PATCH 3）──
  function emitTelemetry(event: PlayerTelemetryEvent, data?: Record<string, unknown>): void {
    try {
      console.log(`[PB2:Telemetry] ${event}`, data || {})
      // 使用现有 PB1 telemetryService
      const { getTelemetryService } = require('@/telemetry')
      const ts = getTelemetryService()
      ts.session.recordEvent({
        type: event as unknown as string,
        timestamp: Date.now(),
        data: data || {},
      })
    } catch { /* 遥测静默失败 */ }
  }

  // ── Actions ──

  async function loadMedia(
    media: MediaItem,
    detail: MediaDetail,
    episode: MediaEpisode,
    playUrl: string,
  ): Promise<void> {
    facade = new PlayerFacade()
    currentMedia.value = media
    currentDetail.value = detail
    currentEpisode.value = episode

    await facade.loadMedia(media, detail, episode, playUrl)
    duration.value = facade.duration

    // 事件绑定
    facade.on('player:timeupdate' as never, () => {
      currentTime.value = facade!.currentTime
      progress.value = facade!.duration > 0 ? facade!.currentTime / facade!.duration : 0
    })
    facade.on('player:play' as never, () => {
      playbackState.value = PlaybackState.PLAYING
      emitTelemetry(PlayerTelemetryEvent.PLAYER_PLAY, { mediaId: media.id })
    })
    facade.on('player:pause' as never, () => {
      playbackState.value = PlaybackState.PAUSED
      emitTelemetry(PlayerTelemetryEvent.PLAYER_PAUSE)
    })
    facade.on('player:ended' as never, () => {
      playbackState.value = PlaybackState.ENDED
      emitTelemetry(PlayerTelemetryEvent.PLAYER_COMPLETE)
      if (facade!.episodes.shouldAutoPlayNext()) {
        const next = facade!.episodes.nextEpisode()
        if (next && facade!.playUrl) {
          switchEpisode(next, facade!.playUrl)
        }
      }
    })
    facade.on('player:error' as never, () => {
      playbackState.value = PlaybackState.ERROR
      error.value = '播放出错'
    })

    // 续播检测
    const savedPos = await facade.resume.loadPosition(episode.id)
    if (savedPos > 0 && facade.resume.shouldResume(savedPos)) {
      resumePosition.value = savedPos
      showResumeDialog.value = true
    }

    emitTelemetry(PlayerTelemetryEvent.PLAYER_OPEN, {
      mediaId: media.id,
      episodeId: episode.id,
      providerId: media.providerId,
    })
  }

  async function play(): Promise<void> {
    if (showResumeDialog.value) {
      showResumeDialog.value = false
      facade!.seek(resumePosition.value)
    }
    await facade!.play()
  }

  function pause(): void { facade?.pause() }

  function seek(time: number): void {
    facade?.seek(time)
    emitTelemetry(PlayerTelemetryEvent.PLAYER_SEEK, { time })
  }

  async function switchEpisode(episode: MediaEpisode, playUrl: string): Promise<void> {
    currentEpisode.value = episode
    await facade?.switchEpisode(episode, playUrl)
    emitTelemetry(PlayerTelemetryEvent.PLAYER_EPISODE_SWITCH, {
      episodeId: episode.id,
      episodeNumber: episode.episodeNumber,
    })
  }

  function switchQuality(q: PlaybackQuality): void {
    quality.value = q
    facade?.switchQuality(q)
    emitTelemetry(PlayerTelemetryEvent.PLAYER_QUALITY_SWITCH, { quality: q })
  }

  function enableSubtitles(): void {
    subtitleEnabled.value = true
    facade?.enableSubtitle()
  }

  function disableSubtitles(): void {
    subtitleEnabled.value = false
    facade?.disableSubtitle()
  }

  function setVolume(vol: number): void {
    volume.value = Math.max(0, Math.min(1, vol))
    facade?.setVolume(volume.value)
  }

  function toggleMute(): void {
    muted.value = !muted.value
    facade?.setMuted(muted.value)
  }

  function destroy(): void {
    facade?.session.end()
    facade?.destroy()
    facade = null
    playbackState.value = PlaybackState.IDLE
  }

  function clearError(): void { error.value = null }

  return {
    currentMedia, currentDetail, currentEpisode,
    playbackState, progress, duration, currentTime,
    quality, subtitleEnabled, subtitleTracks, volume, muted,
    error, showResumeDialog, resumePosition,
    isPlaying, isLoading, progressPercent,
    loadMedia, play, pause, seek,
    switchEpisode, switchQuality,
    enableSubtitles, disableSubtitles,
    setVolume, toggleMute,
    destroy, clearError,
  }
})
