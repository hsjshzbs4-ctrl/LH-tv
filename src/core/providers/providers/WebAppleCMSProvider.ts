// src/core/providers/providers/WebAppleCMSProvider.ts — Web 版 AppleCMS Provider
// HOTFIX-001: 通过 HTTP Proxy 访问 AppleCMS API，解决浏览器跨域限制
// Electron 继续使用 AppleCMSProvider (window.app IPC)
// Web 使用此 Provider (fetch + CORS proxy)

import { BaseProvider } from '../base/BaseProvider'
import type { MediaItem, MediaDetail, MediaEpisode } from '../types/media.types'

/** HTTP AppleCMS API 端点配置 */
interface AppleCMSEndpoint {
  name: string
  baseUrl: string
}

const ENDPOINTS: AppleCMSEndpoint[] = [
  { name: '光速', baseUrl: 'https://api.guangsu.tv' },
  { name: '360', baseUrl: 'https://api.360kan.com' },
]

export class WebAppleCMSProvider extends BaseProvider {
  id = 'web-applecms'
  name = 'AppleCMS (Web)'
  priority = 1

  private readonly proxyUrl = '' // 可选: CORS 代理 URL

  async search(keyword: string): Promise<MediaItem[]> {
    if (typeof window !== 'undefined' && (window as any).app?.searchVideo) {
      // Electron 环境回退到 IPC
      return this.searchElectron(keyword)
    }
    // Web 环境: HTTP fetch
    return this.searchWeb(keyword)
  }

  async detail(id: string): Promise<MediaDetail> {
    if (typeof window !== 'undefined' && (window as any).app?.getShowDetail) {
      return this.detailElectron(id)
    }
    return { id, title: id, cover: '', description: '', providerId: this.id, episodes: [] }
  }

  async catalog(type: string, sub: string): Promise<MediaItem[]> {
    if (typeof window !== 'undefined' && (window as any).app?.getTypeCatalog) {
      return this.catalogElectron(type, sub)
    }
    return this.catalogWeb(type, sub)
  }

  // ── Electron 路径 ──
  private async searchElectron(keyword: string): Promise<MediaItem[]> {
    try {
      const results = await (window as any).app.searchVideo(keyword, 1)
      return (results || []).map((r: any) => ({
        id: r.url || r.title,
        title: r.title,
        cover: r.image || '',
        providerId: this.id,
        providerName: this.name,
        type: 'movie' as const,
        remark: r.sourceLabel || '',
      }))
    } catch { return [] }
  }

  private async detailElectron(id: string): Promise<MediaDetail> {
    try {
      const raw = await (window as any).app.getShowDetail(id) as any
      if (!raw) throw new Error('Not found')
      return {
        id: String(raw.id),
        title: raw.name,
        cover: raw.image || '',
        description: raw.summary || '',
        providerId: this.id,
        episodes: [],
      }
    } catch { return { id, title: id, cover: '', description: '', providerId: this.id, episodes: [] } }
  }

  private async catalogElectron(type: string, sub: string): Promise<MediaItem[]> {
    try {
      const items = await (window as any).app.getTypeCatalog(type, sub) as any[]
      return (items || []).map((item: any) => ({
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
    } catch { return [] }
  }

  // ── Web 路径 (HTTP fetch) ──
  private async searchWeb(keyword: string): Promise<MediaItem[]> {
    const items: MediaItem[] = []
    for (const endpoint of ENDPOINTS) {
      try {
        const url = this.buildUrl(endpoint.baseUrl, '/api.php/provide/vod/', { wd: keyword })
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) })
        if (!resp.ok) continue
        const data = await resp.json()
        if (data?.list) {
          for (const item of data.list) {
            items.push({
              id: String(item.vod_id || item.title),
              title: item.vod_name || item.title,
              cover: item.vod_pic || '',
              providerId: this.id,
              providerName: `${endpoint.name}`,
              type: (item.type_name as MediaItem['type']) || 'movie',
              year: item.vod_year,
              score: item.vod_score,
              remark: item.vod_remarks || '',
            })
          }
        }
      } catch { /* 单端点失败继续尝试下一个 */ }
    }
    return items
  }

  private async catalogWeb(type: string, sub: string): Promise<MediaItem[]> {
    const typeMap: Record<string, string> = { movie: '1', tv: '2', anime: '3', variety: '4', documentary: '5' }
    const items: MediaItem[] = []
    for (const endpoint of ENDPOINTS) {
      try {
        const url = this.buildUrl(endpoint.baseUrl, '/api.php/provide/vod/', {
          t: typeMap[type] || '1',
          pg: '1',
        })
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) })
        if (!resp.ok) continue
        const data = await resp.json()
        if (data?.list) {
          for (const item of data.list) {
            items.push({
              id: String(item.vod_id || item.vod_name),
              title: item.vod_name,
              cover: item.vod_pic || '',
              providerId: this.id,
              providerName: `${endpoint.name}`,
              type: type as MediaItem['type'],
              year: item.vod_year,
              score: item.vod_score,
              remark: item.vod_remarks || '',
            })
          }
        }
      } catch { /* continue */ }
    }
    return items
  }

  private buildUrl(base: string, path: string, params: Record<string, string>): string {
    const url = new URL(path, this.proxyUrl || base)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return url.toString()
  }
}
