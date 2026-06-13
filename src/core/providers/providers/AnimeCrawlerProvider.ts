// src/core/providers/providers/AnimeCrawlerProvider.ts - 动漫爬虫聚合 Provider
// 统一封装樱花动漫 + 天天动漫爬虫
// 内部通过 IPC 调用 legacy anime-scraper.js + tiantian-scraper.js

import { BaseProvider } from '../base/BaseProvider'
import type { MediaItem, MediaDetail, MediaEpisode } from '../types/media.types'
import type { ShowDetail, SearchResult, Video } from '@/types'

export class AnimeCrawlerProvider extends BaseProvider {
  id = 'anime-crawler'
  name = '动漫爬虫'
  priority = 2

  // ==================== 搜索 ====================

  async search(keyword: string): Promise<MediaItem[]> {
    return this.cachedSearch(keyword, async () => {
      try {
        const results = await window.app.searchAnime(keyword)
        return (results || []).map(r => ({
          id: r.url || r.title,
          title: r.title,
          cover: r.image || '',
          providerId: this.id,
          providerName: this.name,
          type: 'anime' as const,
          remark: r.sourceLabel || '',
        }))
      } catch {
        return []
      }
    })
  }

  // ==================== 详情 ====================

  async detail(id: string): Promise<MediaDetail> {
    return this.cachedDetail(id, async () => {
      let raw: ShowDetail | null = null
      try {
        raw = await window.app.getAnimeDetail(Number(id)) as ShowDetail | null
      } catch {
        throw new Error(`未找到 "${id}" 的动漫详情`)
      }
      if (!raw) throw new Error(`未找到 "${id}" 的动漫详情`)

      const episodes: MediaEpisode[] = []
      for (const src of raw.playSources || []) {
        for (const ep of src.episodes || []) {
          episodes.push({
            id: `${raw.id}_${ep.number}`,
            title: ep.label,
            episodeNumber: ep.number,
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
        const items = await window.app.getAnimeCatalog(sub) as Video[]
        return (items || []).map(v => ({
          id: String(v.id || v.name),
          title: v.name,
          cover: v.image || '',
          providerId: this.id,
          providerName: this.name,
          type: 'anime' as const,
          year: v.year,
          score: v.rating,
          remark: v.year ? String(v.year) : '',
        }))
      } catch {
        return []
      }
    })
  }

  // ==================== 健康检查 ====================

  async healthCheck(): Promise<boolean> {
    try {
      const results = await this.search('火影')
      return Array.isArray(results) && results.length > 0
    } catch {
      return false
    }
  }
}
