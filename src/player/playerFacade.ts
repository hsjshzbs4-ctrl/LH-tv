// src/player/playerFacade.ts — PB2-S1 Player Facade
// PATCH 1: 纯编排层，包装 VideoEngine + 各 Manager
// 目标 < 1000 行新逻辑，大部分为委托调用

import type { MediaItem, MediaDetail, MediaEpisode } from '@provider-contracts'
import { VideoEngine } from './videoEngine'
import { PlaybackSessionTracker } from './playbackSession'
import { ResumeManager } from './resumeManager'
import { EpisodeManager } from './episodeManager'
import { QualityManager } from './qualityManager'
import { SubtitleManager } from './subtitleManager'
import { DRMManager } from './drmManager'
import { PlaybackState, PlaybackQuality } from './playerTypes'
import type { SubtitleTrack } from './playerTypes'
import { PlayerEvent } from '@/core/player/types/player.types'
// S3A-3: 智能源切换
import { PlaybackFacade } from '@/core/playback'
import type { PlaybackSource, SourceSwitchEventData } from '@/core/playback'

/** S3A-3: 源切换回调 */
export type SourceSwitchCallback = (data: SourceSwitchEventData) => void

export class PlayerFacade {
  // ── 子模块 ──
  readonly engine: VideoEngine
  readonly session: PlaybackSessionTracker
  readonly resume: ResumeManager
  readonly episodes: EpisodeManager
  readonly quality: QualityManager
  readonly subtitle: SubtitleManager
  readonly drm: DRMManager

  // ── 当前媒体信息 ──
  private _media: MediaItem | null = null
  private _detail: MediaDetail | null = null
  private _playUrl: string = ''
  /** S3A-3: 智能源切换管理器 */
  private sourceSwitch: PlaybackFacade
  /** S3A-3: 切换锁 — 防止重复切换导致源队列耗尽 */
  private _isSwitching = false

  get currentMedia(): MediaItem | null { return this._media }
  get currentDetail(): MediaDetail | null { return this._detail }
  get playUrl(): string { return this._playUrl }

  /** S3A-3: 是否有更多源可切换 */
  get hasMoreSources(): boolean { return this.sourceSwitch.hasMoreSources }
  /** S3A-3: 剩余重试次数 */
  get remainingRetries(): number { return this.sourceSwitch.remainingRetries }

  constructor() {
    this.engine = new VideoEngine()
    this.session = new PlaybackSessionTracker()
    this.resume = new ResumeManager(30)
    this.episodes = new EpisodeManager()
    this.quality = new QualityManager()
    this.subtitle = new SubtitleManager()
    this.drm = new DRMManager()
    this.sourceSwitch = new PlaybackFacade({ maxRetries: 3 })  // S3A-3

    // S3A-4: HLS 实例就绪 → 自动绑定 QualityManager
    this.engine.onHLSReady = (hls: unknown) => {
      this.quality.bindHLS(hls)
    }
  }

  // ── 初始化/销毁 ──

  /** S3A-1: 初始化 — 绑定已有 video 元素到播放引擎 */
  initialize(video: HTMLVideoElement): void {
    this.engine.setVideoElement(video)
    this.subtitle.attachVideo(video)
  }

  /** 销毁 */
  destroy(): void {
    this.session.end()
    this.engine.destroy()
    this._media = null
  }

  // ── 媒体加载 ──

  /** S3A-3: 订阅源切换事件 */
  onSourceSwitch(cb: SourceSwitchCallback): () => void {
    return this.sourceSwitch.subscribe(cb)
  }

  /** 加载媒体详情并准备播放 */
  async loadMedia(
    media: MediaItem,
    detail: MediaDetail,
    episode: MediaEpisode,
    playUrl: string,
    /** S3A-3: 所有可用播放源（供自动切换） */
    allSources?: PlaybackSource[],
  ): Promise<void> {
    this._media = media
    this._detail = detail

    this.episodes.loadEpisodeList(detail.episodes)
    this.episodes.selectById(episode.id)

    // S3A-3: 初始化源切换队列
    const sources = allSources && allSources.length > 0
      ? allSources
      : [{ providerId: media.providerId, providerName: media.providerName || media.providerId, episodeId: episode.id, playUrl, priority: 0 }]
    const bestSource = this.sourceSwitch.start(media.id, sources, episode.episodeNumber || 1)
    this._playUrl = bestSource?.playUrl || playUrl

    // DRM 检测
    const drmType = this.drm.detectDRM(this._playUrl)
    if (drmType !== 'none') {
      console.log(`[PB2] DRM detected: ${drmType}`)
    }

    // 检查续播
    const savedPos = await this.resume.loadPosition(episode.id)

    this.session.begin(media.id, episode.id, media.providerId)
    await this.engine.loadSource(this._playUrl)

    if (savedPos > 0 && this.resume.shouldResume(savedPos)) {
      this.engine.seek(savedPos)
    }
  }

  /** S3A-3: 当前源失败 → 尝试下一个源（null = 全部耗尽） */
  async tryNextSource(reason?: string): Promise<boolean> {
    // S3A-3 审核修正: 防止重复切换 — 双重 error 事件可能导致源队列被跳过
    if (this._isSwitching) return false
    this._isSwitching = true

    try {
      const nextSource = this.sourceSwitch.onFailed(reason)
      if (!nextSource) return false

      // 保存播放进度（源切换时保留）
      this.sourceSwitch.saveProgress(this.engine.currentTime)

      this._playUrl = nextSource.playUrl
      await this.engine.loadSource(this._playUrl)

      // 恢复播放进度
      const savedProgress = this.sourceSwitch.getSavedProgress()
      if (savedProgress > 1) {
        this.engine.seek(savedProgress)
        this.sourceSwitch.clearProgress()
      }
      return true
    } finally {
      this._isSwitching = false
    }
  }

  /** S3A-3: 标记当前源播放成功 */
  markSourceSuccess(): void {
    if (this._media) {
      this.sourceSwitch.onSuccess(this._media.id)
    }
  }

  /** 切换剧集 */
  async switchEpisode(episode: MediaEpisode, playUrl: string): Promise<void> {
    this.session.end()
    this._playUrl = playUrl

    this.episodes.selectById(episode.id)
    if (this._media) {
      this.session.begin(this._media.id, episode.id, this._media.providerId)
    }
    await this.engine.loadSource(playUrl)
  }

  // ── 播放控制（委托 VideoEngine）──

  async play(): Promise<void> { return this.engine.play() }
  pause(): void { this.engine.pause() }
  seek(time: number): void { this.engine.seek(time); this.session.updateProgress(time, this.engine.duration) }
  setVolume(vol: number): void { this.engine.setVolume(vol) }
  setMuted(muted: boolean): void { this.engine.setMuted(muted) }

  get currentTime(): number { return this.engine.currentTime }
  get duration(): number { return this.engine.duration }
  get playbackState(): PlaybackState { return this.engine.state }

  // ── 画质（委托 QualityManager）──

  switchQuality(quality: PlaybackQuality): void { this.quality.setQuality(quality) }

  // ── 字幕（委托 SubtitleManager）──

  enableSubtitle(): void { this.subtitle.enableSubtitle() }
  disableSubtitle(): void { this.subtitle.disableSubtitle() }
  switchSubtitleTrack(trackId: string): void { this.subtitle.switchTrack(trackId) }
  loadSubtitles(tracks: SubtitleTrack[]): void { this.subtitle.loadSubtitles(tracks) }

  // ── 事件 ──

  on(event: PlayerEvent, cb: (data?: unknown) => void): () => void {
    return this.engine.on(event, cb)
  }
}
