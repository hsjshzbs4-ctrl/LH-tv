// src/player/subtitle/subtitleTypes.ts — PB3-S1 Subtitle Settings 类型

/** 字幕设置 */
export interface SubtitleSettings {
  fontSize: number       // px
  opacity: number        // 0-1
  position: SubtitlePosition
  color: string
  stroke: SubtitleStroke
}

export enum SubtitlePosition {
  BOTTOM = 'bottom',
  CENTER = 'center',
  TOP = 'top',
}

export interface SubtitleStroke {
  enabled: boolean
  color: string
  width: number
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 16,
  opacity: 1,
  position: SubtitlePosition.BOTTOM,
  color: '#FFFFFF',
  stroke: { enabled: true, color: '#000000', width: 1 },
}
