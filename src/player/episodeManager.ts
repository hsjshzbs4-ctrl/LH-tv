// src/player/episodeManager.ts — PB2-S1 Episode Manager
// 管理剧集列表、选集、上下集切换

import type { MediaEpisode } from '@provider-contracts'

export class EpisodeManager {
  private episodes: MediaEpisode[] = []
  private _index = -1
  private _autoPlayNext = true

  get currentIndex(): number { return this._index }
  get currentEpisode(): MediaEpisode | null {
    return this._index >= 0 && this._index < this.episodes.length
      ? this.episodes[this._index] : null
  }
  get episodeCount(): number { return this.episodes.length }
  get hasNext(): boolean { return this._index < this.episodes.length - 1 }
  get hasPrevious(): boolean { return this._index > 0 }
  get autoPlayNext(): boolean { return this._autoPlayNext }
  set autoPlayNext(v: boolean) { this._autoPlayNext = v }

  /** 加载剧集列表 */
  loadEpisodeList(episodes: MediaEpisode[]): void {
    this.episodes = episodes
    this._index = episodes.length > 0 ? 0 : -1
  }

  /** 选择剧集 */
  selectEpisode(index: number): MediaEpisode | null {
    if (index < 0 || index >= this.episodes.length) return null
    this._index = index
    return this.episodes[index]
  }

  /** 通过 episodeId 选择 */
  selectById(episodeId: string): MediaEpisode | null {
    const idx = this.episodes.findIndex(e => e.id === episodeId)
    if (idx === -1) return null
    return this.selectEpisode(idx)
  }

  /** 下一集 */
  nextEpisode(): MediaEpisode | null {
    return this.hasNext ? this.selectEpisode(this._index + 1) : null
  }

  /** 上一集 */
  previousEpisode(): MediaEpisode | null {
    return this.hasPrevious ? this.selectEpisode(this._index - 1) : null
  }

  /** 是否应该自动播下一集 */
  shouldAutoPlayNext(): boolean {
    return this._autoPlayNext && this.hasNext
  }

  /** 获取所有剧集 */
  getEpisodes(): MediaEpisode[] {
    return [...this.episodes]
  }
}
