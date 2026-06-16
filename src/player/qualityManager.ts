// src/player/qualityManager.ts — PB2-S1 Quality Manager
// HLS 多码率流画质切换，通过 hls.levels 实现

import { PlaybackQuality, QUALITY_RESOLUTIONS } from './playerTypes'

interface QualityOption {
  quality: PlaybackQuality
  label: string
  resolution: number
  active: boolean
}

export class QualityManager {
  private _current: PlaybackQuality = PlaybackQuality.AUTO
  private hlsInstance: unknown = null

  /** 设置当前画质 */
  setQuality(quality: PlaybackQuality): void {
    this._current = quality
    this.applyToHLS()
  }

  /** 获取当前画质 */
  getQuality(): PlaybackQuality { return this._current }

  /** 列出可用画质 */
  listQualities(): QualityOption[] {
    return Object.values(PlaybackQuality).map(q => ({
      quality: q,
      label: q === PlaybackQuality.AUTO ? '自动' : q,
      resolution: QUALITY_RESOLUTIONS[q],
      active: q === this._current,
    }))
  }

  /** 绑定 HLS 实例（由 videoEngine 在 HLS 流加载后调用） */
  bindHLS(hls: unknown): void {
    this.hlsInstance = hls
  }

  /** S3B-1: 解绑旧 HLS 实例 — 切源/销毁前调用，防止操作已销毁的 hls */
  unbindHLS(): void {
    this.hlsInstance = null
  }

  /** 应用画质到 HLS 实例 */
  private applyToHLS(): void {
    if (!this.hlsInstance) return
    const hls = this.hlsInstance as Record<string, unknown>
    if (typeof hls['nextLevel'] === 'undefined') return

    if (this._current === PlaybackQuality.AUTO) {
      ;(hls['nextLevel'] as number) = -1
    } else {
      const targetHeight = QUALITY_RESOLUTIONS[this._current]
      if (targetHeight > 0 && Array.isArray(hls['levels'])) {
        const levels = hls['levels'] as Array<{ height: number }>
        const idx = levels.findIndex(l => l.height === targetHeight)
        if (idx >= 0) {
          ;(hls['nextLevel'] as number) = idx
          ;(hls['currentLevel'] as number) = idx
        }
      }
    }
  }
}
