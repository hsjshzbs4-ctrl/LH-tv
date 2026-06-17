// src/core/providers/providers/AppleCMSProvider.ts - AppleCMS 聚合 Provider
// 统一封装 4 个 AppleCMS 资源站 (光速/360/量子/非凡)
// 内部通过 IPC 调用 legacy video-source.js + api-client.js

import { BaseProvider } from '../base/BaseProvider'
import type { MediaItem, MediaDetail, MediaEpisode } from '../types/media.types'
import type { ShowDetail, CatalogItem, SearchResult } from '@/types'

export class AppleCMSProvider extends BaseProvider {
  id = 'applecms'
  name = 'AppleCMS'
  priority = 1

  // ==================== 搜索 ====================

  async search(keyword: string): Promise<MediaItem[]> {
    return this.cachedSearch(keyword, async () => {
      try {
        const results = await window.app.searchVideo(keyword, 1)
        return (results || []).map(r => this.searchResultToMediaItem(r))
      } catch {
        return []
      }
    })
  }

  // ==================== 详情 ====================

  async detail(id: string): Promise<MediaDetail> {
    return this.cachedDetail(id, async () => {
      const raw = await window.app.getShowDetail(id) as ShowDetail | null
      if (!raw) throw new Error(`未找到 "${id}" 的详情`)

      const episodes: MediaEpisode[] = []
      for (const src of raw.playSources || []) {
        for (const ep of src.episodes || []) {
          episodes.push({
            id: `${raw.id}_${src.name}_${ep.number}`,
            title: ep.label,
            episodeNumber: ep.number,
            url: ep.url,
          })
        }
      }

      return {
        id: String(raw.id),
        title: raw.name,
        cover: raw.image || '',
        description: raw.summary || '',
        providerId: this.id,
        episodes,
      }
    })
  }

  // ==================== 分类目录 ====================

  async catalog(type: string, sub: string): Promise<MediaItem[]> {
    return this.cachedCatalog(type, sub, async () => {
      try {
        const items = await window.app.getTypeCatalog(type, sub) as CatalogItem[]
        return (items || []).map(item => ({
          id: item.name,
          title: item.name,
          cover: item.image || '',
          providerId: this.id,
          providerName: this.name,
          type: (item.type || type) as MediaItem['type'],
          year: item.year,
          score: item.rating,
          remark: item.genres?.slice(0, 2).join(' / ') || '',
        }))
      } catch {
        return []
      }
    })
  }

  // ==================== 适配器 ====================

  private searchResultToMediaItem(r: SearchResult): MediaItem {
    return {
      id: r.url || r.title,
      title: r.title,
      cover: r.image || '',
      providerId: this.id,
      providerName: this.name,
      type: 'movie',
      remark: r.sourceLabel || '',
    }
  }
}
