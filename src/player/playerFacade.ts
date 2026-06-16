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

  get currentMedia(): MediaItem | null { return this._media }
  get currentDetail(): MediaDetail | null { return this._detail }
  get playUrl(): string { return this._playUrl }

  constructor() {
    this.engine = new VideoEngine()
    this.session = new PlaybackSessionTracker()
    this.resume = new ResumeManager(30)
    this.episodes = new EpisodeManager()
    this.quality = new QualityManager()
    this.subtitle = new SubtitleManager()
    this.drm = new DRMManager()
  }

  // ── 初始化/销毁 ──

  /** 初始化：绑定 video 元素到 container */
  initialize(container: HTMLElement): void {
    this.engine.attachElement(container)
    const video = this.engine.getVideoElement()
    if (video) this.subtitle.attachVideo(video)
  }

  /** 销毁 */
  destroy(): void {
    this.session.end()
    this.engine.destroy()
    this._media = null
  }

  // ── 媒体加载 ──

  /** 加载媒体详情并准备播放 */
  async loadMedia(media: MediaItem, detail: MediaDetail, episode: MediaEpisode, playUrl: string): Promise<void> {
    this._media = media
    this._detail = detail
    this._playUrl = playUrl

    this.episodes.loadEpisodeList(detail.episodes)
    this.episodes.selectById(episode.id)

    // DRM 检测
    const drmType = this.drm.detectDRM(playUrl)
    if (drmType !== 'none') {
      console.log(`[PB2] DRM detected: ${drmType}`)
    }

    // 检查续播
    const savedPos = await this.resume.loadPosition(episode.id)

    this.session.begin(media.id, episode.id, media.providerId)
    await this.engine.loadSource(playUrl)

    if (savedPos > 0 && this.resume.shouldResume(savedPos)) {
      this.engine.seek(savedPos)
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
