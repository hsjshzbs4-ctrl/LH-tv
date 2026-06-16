// src/player/subtitleManager.ts — PB2-S1 Subtitle Manager
// VTT/SRT 字幕加载与切换，通过 HTML track 元素实现

import type { SubtitleTrack } from './playerTypes'

export class SubtitleManager {
  private tracks: SubtitleTrack[] = []
  private videoElement: HTMLVideoElement | null = null
  private _enabled = false

  get enabled(): boolean { return this._enabled }
  get currentTrack(): SubtitleTrack | null {
    return this.tracks.find(t => t.enabled) || null
  }

  /** 绑定 video 元素 */
  attachVideo(video: HTMLVideoElement): void {
    this.videoElement = video
  }

  /** 加载字幕轨道列表 */
  loadSubtitles(tracks: SubtitleTrack[]): void {
    this.tracks = tracks
    this.applyTracks()
  }

  /** 启用字幕 */
  enableSubtitle(): void {
    this._enabled = true
    this.applyTrackState()
  }

  /** 禁用字幕 */
  disableSubtitle(): void {
    this._enabled = false
    if (this.videoElement) {
      for (const track of this.videoElement.textTracks) {
        track.mode = 'disabled'
      }
    }
  }

  /** 切换字幕轨道 */
  switchTrack(trackId: string): void {
    this.tracks = this.tracks.map(t => ({
      ...t,
      enabled: t.id === trackId,
    }))
    this.applyTrackState()
  }

  /** 列出所有轨道 */
  listTracks(): SubtitleTrack[] { return [...this.tracks] }

  /** 应用轨道到 video 元素 */
  private applyTracks(): void {
    if (!this.videoElement) return
    // 清除旧 track
    const existing = this.videoElement.querySelectorAll('track')
    existing.forEach(t => t.remove())

    for (const t of this.tracks) {
      const trackEl = document.createElement('track')
      trackEl.kind = 'subtitles'
      trackEl.label = t.label
      trackEl.srclang = t.language
      trackEl.src = t.url
      trackEl.default = t.enabled
      trackEl.dataset['trackId'] = t.id
      this.videoElement.appendChild(trackEl)
    }
    this.applyTrackState()
  }

  private applyTrackState(): void {
    if (!this.videoElement) return
    for (const track of this.videoElement.textTracks) {
      const trackId = (track as TextTrack & { _trackEl?: HTMLElement })._trackEl?.dataset?.['trackId']
        || (track as TextTrack).id
      const target = this.tracks.find(t => t.id === trackId)
      track.mode = (this._enabled && target?.enabled) ? 'showing' : 'disabled'
    }
  }
}
