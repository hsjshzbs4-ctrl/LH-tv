// src/player/episodeUX.ts — PB3-S1 Episode UX Enhancement
// 包装 EpisodeManager（FROZEN），新增 UX 状态。不修改 EpisodeManager 内部。

import type { MediaEpisode } from '@provider-contracts'
import type { EpisodeManager } from './episodeManager'

export interface EpisodeUXState {
  /** 观看到的集数映射 (episodeId → 是否已观看) */
  watchedEpisodes: Set<string>
  /** 自动播放下一集 */
  autoPlayNext: boolean
  /** 下一集提示文本 */
  nextEpisodeHint: string | null
}

export class EpisodeUX {
  private episodeManager: EpisodeManager
  private _state: EpisodeUXState = {
    watchedEpisodes: new Set(),
    autoPlayNext: true,
    nextEpisodeHint: null,
  }

  get state(): Readonly<EpisodeUXState> { return this._state }
  get manager(): EpisodeManager { return this.episodeManager }

  constructor(episodeManager: EpisodeManager) {
    this.episodeManager = episodeManager
    this.episodeManager.autoPlayNext = true
  }

  /** 标记剧集为已观看 */
  markWatched(episodeId: string): void {
    this._state.watchedEpisodes.add(episodeId)
    this._updateNextHint()
  }

  /** 是否已观看 */
  isWatched(episodeId: string): boolean {
    return this._state.watchedEpisodes.has(episodeId)
  }

  /** 切换自动播放下一集 */
  toggleAutoPlay(): boolean {
    this._state.autoPlayNext = !this._state.autoPlayNext
    this.episodeManager.autoPlayNext = this._state.autoPlayNext
    return this._state.autoPlayNext
  }

  /** 获取下一集提示 */
  private _updateNextHint(): void {
    const next = this.episodeManager.hasNext
      ? this.episodeManager.getEpisodes()[this.episodeManager.currentIndex + 1]
      : null
    this._state.nextEpisodeHint = next
      ? `下一集: ${next.title || `第${next.episodeNumber}集`}`
      : null
  }

  /** 搜索剧集（本地过滤） */
  searchEpisodes(keyword: string): MediaEpisode[] {
    const kw = keyword.toLowerCase()
    return this.episodeManager.getEpisodes().filter(e =>
      e.title?.toLowerCase().includes(kw) ||
      String(e.episodeNumber || '').includes(kw),
    )
  }
}
