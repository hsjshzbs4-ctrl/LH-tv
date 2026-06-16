// src/player/subtitle/subtitleSettingsManager.ts — PB3-S1 Subtitle Settings Manager
// 唯一 Owner: 字幕外观设置。包装 SubtitleManager，不修改其内部状态。

import {
  DEFAULT_SUBTITLE_SETTINGS,
} from './subtitleTypes'
import type { SubtitleSettings } from './subtitleTypes'

export class SubtitleSettingsManager {
  private _settings: SubtitleSettings
  private styleElement: HTMLStyleElement | null = null

  get settings(): SubtitleSettings { return { ...this._settings } }

  constructor(settings?: Partial<SubtitleSettings>) {
    this._settings = { ...DEFAULT_SUBTITLE_SETTINGS, ...settings }
  }

  /** 更新设置并应用到 DOM */
  update(partial: Partial<SubtitleSettings>): void {
    this._settings = { ...this._settings, ...partial }
    this.applyToDOM()
  }

  /** 重置为默认 */
  reset(): void {
    this._settings = { ...DEFAULT_SUBTITLE_SETTINGS }
    this.applyToDOM()
  }

  /** 应用字幕样式到 ::cue pseudo-element */
  private applyToDOM(): void {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style')
      this.styleElement.id = 'pb3-subtitle-settings'
      document.head.appendChild(this.styleElement)
    }

    const s = this._settings
    const posMap: Record<string, string> = {
      bottom: 'auto auto 10% auto',
      center: 'auto auto 50% auto',
      top: '10% auto auto auto',
    }

    this.styleElement.textContent = `
      ::cue {
        font-size: ${s.fontSize}px;
        opacity: ${s.opacity};
        color: ${s.color};
        ${s.stroke.enabled ? `text-shadow: -${s.stroke.width}px -${s.stroke.width}px 0 ${s.stroke.color}, ${s.stroke.width}px -${s.stroke.width}px 0 ${s.stroke.color}, -${s.stroke.width}px ${s.stroke.width}px 0 ${s.stroke.color}, ${s.stroke.width}px ${s.stroke.width}px 0 ${s.stroke.color};` : ''}
      }
    `
  }

  /** 清理 */
  destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove()
      this.styleElement = null
    }
  }
}
