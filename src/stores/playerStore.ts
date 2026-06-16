// src/stores/playerStore.ts — PB2-S1 Player Store
// Pinia store，聚合 PlayerFacade 的响应式状态

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PlayerFacade } from '@/player'
import { PlaybackState, PlaybackQuality, PlayerTelemetryEvent } from '@/player'
import type { MediaItem, MediaDetail, MediaEpisode } from '@provider-contracts'
import type { SubtitleTrack } from '@/player'
import type { PlaybackSource } from '@/core/playback'  // S3A-3

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
  /** S3A-3: 源切换中 */
  const switchingSource = ref(false)

  // ── 计算属性 ──
  const isPlaying = computed(() => playbackState.value === PlaybackState.PLAYING)
  const isLoading = computed(() => playbackState.value === PlaybackState.LOADING)
  const progressPercent = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0)

  /** S3B-2: 剧集列表 — 从 EpisodeManager（唯一 SSOT）读取 */
  const allEpisodes = computed<MediaEpisode[]>(() => {
    return facade?.episodes.getEpisodes() || currentDetail.value?.episodes || []
  })
  /** S3B-2: 是否有上一集 */
  const hasPrev = computed(() => facade?.episodes.hasPrevious || false)
  /** S3B-2: 是否有下一集 */
  const hasNext = computed(() => facade?.episodes.hasNext || false)

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

  /** S3A-1: 初始化 — 绑定已有 video 元素到播放引擎 */
  function initialize(video: HTMLVideoElement): void {
    if (!facade) facade = new PlayerFacade()
    facade.initialize(video)
  }

  async function loadMedia(
    media: MediaItem,
    detail: MediaDetail,
    episode: MediaEpisode,
    playUrl: string,
  ): Promise<void> {
    facade = new PlayerFacade()
    currentMedia.value = media
    currentDetail.value = detail
    // S3B-2: currentEpisode 由 EpisodeManager 持有，操作后同步
    currentEpisode.value = null  // 清空旧值，等待 facade 操作后同步

    // S3A-3: 构建多源列表（同一集号的不同源）
    const allSources: PlaybackSource[] = detail.episodes
      .filter(e => e.episodeNumber === episode.episodeNumber && e.url)
      .map((e, i) => ({
        providerId: media.providerId,
        providerName: media.providerName || media.providerId,
        episodeId: e.id,
        playUrl: e.url!,
        priority: i,
      }))

    await facade.loadMedia(media, detail, episode, playUrl, allSources)
    duration.value = facade.duration
    // S3B-2: currentEpisode 从 EpisodeManager 同步（唯一 SSOT）
    currentEpisode.value = facade.episodes.currentEpisode

    // S3A-3: 订阅源切换事件（UI 可显示切换状态）
    facade.onSourceSwitch((data) => {
      if (data.event === 'switching') {
        switchingSource.value = true
      } else {
        switchingSource.value = false
      }
      // S3B-4: 源切换事件 → 遥测
      emitTelemetry(PlayerTelemetryEvent.PLAYER_SOURCE_SWITCH, {
        event: data.event,
        fromSource: data.fromSource,
        toSource: data.toSource,
        reason: data.reason,
      })
    })

    // S3B-3: 定期保存进度（Engine 每 15s 触发 → ResumeManager 持久化）
    facade.engine.onProgressSave = (time: number) => {
      if (currentMedia.value && currentEpisode.value) {
        facade!.resume.savePosition(
          currentMedia.value.id,
          currentEpisode.value.id,
          time,
          facade!.duration,
        )
      }
    }

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
      // S3B-3: 暂停时保存进度
      if (currentMedia.value && currentEpisode.value) {
        facade!.resume.savePosition(
          currentMedia.value.id,
          currentEpisode.value.id,
          facade!.currentTime,
          facade!.duration,
        )
      }
    })
    facade.on('player:ended' as never, () => {
      playbackState.value = PlaybackState.ENDED
      emitTelemetry(PlayerTelemetryEvent.PLAYER_COMPLETE)
      if (facade!.episodes.shouldAutoPlayNext()) {
        const next = facade!.episodes.nextEpisode()
        // S3B-2: 使用下一集自身的 URL（而非当前源的 playUrl）
        if (next && next.url) {
          switchEpisode(next, next.url)
        }
      }
    })
    // S3A-3: 错误回调 — 先尝试切换源，耗尽后才设置 error
    // S3A-3 审核修正: switchingSource 同时充当防重入锁
    facade.on('player:error' as never, async () => {
      if (switchingSource.value) return  // 已在切换中，忽略重复 error
      if (facade!.hasMoreSources) {
        switchingSource.value = true
        const switched = await facade!.tryNextSource('播放失败')
        switchingSource.value = false
        if (switched) return  // 切换成功，不显示错误
      }
      playbackState.value = PlaybackState.ERROR
      error.value = facade!.remainingRetries <= 0
        ? '所有播放源均已尝试，播放失败'
        : '播放出错'
    })
    // S3A-3: 就绪回调 — 标记源成功
    facade.on('player:ready' as never, () => {
      facade?.markSourceSuccess()
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
      // S3B-4: 续播 seek 也要发遥测（之前 silent）
      emitTelemetry(PlayerTelemetryEvent.PLAYER_SEEK, {
        time: resumePosition.value,
        source: 'resume',
      })
    }
    await facade!.play()
  }

  function pause(): void { facade?.pause() }

  function seek(time: number): void {
    facade?.seek(time)
    emitTelemetry(PlayerTelemetryEvent.PLAYER_SEEK, { time })
  }

  async function switchEpisode(episode: MediaEpisode, playUrl: string): Promise<void> {
    // S3B-2: 不提前写 currentEpisode — facade 操作后从 EpisodeManager 同步
    await facade?.switchEpisode(episode, playUrl)
    currentEpisode.value = facade?.episodes.currentEpisode || null
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

  async function destroy(): Promise<void> {
    // S3B-3: 退出前保存最终位置（ResumeManager → localStorage + historyFacade）
    if (facade && currentMedia.value && currentEpisode.value) {
      await facade.resume.savePosition(
        currentMedia.value.id,
        currentEpisode.value.id,
        facade.currentTime,
        facade.duration,
      )
    }
    facade?.session.end()
    facade?.destroy()
    facade = null
    playbackState.value = PlaybackState.IDLE
  }

  function clearError(): void { error.value = null }

  /** S3A-3: 手动切换播放源（用户点击"换源"按钮） */
  async function tryNextSource(): Promise<boolean> {
    if (!facade) return false
    switchingSource.value = true
    const switched = await facade.tryNextSource('手动切换')
    switchingSource.value = false
    if (!switched) {
      error.value = '所有播放源均已尝试'
      playbackState.value = PlaybackState.ERROR
    }
    return switched
  }

  return {
    currentMedia, currentDetail, currentEpisode,
    playbackState, progress, duration, currentTime,
    quality, subtitleEnabled, subtitleTracks, volume, muted,
    error, showResumeDialog, resumePosition,
    isPlaying, isLoading, progressPercent,
    allEpisodes, hasPrev, hasNext,                      // S3B-2
    switchingSource,                                    // S3A-3
    loadMedia, play, pause, seek,
    switchEpisode, switchQuality,
    enableSubtitles, disableSubtitles,
    setVolume, toggleMute,
    destroy, clearError,
    tryNextSource,                                       // S3A-3
    initialize,
  }
})
