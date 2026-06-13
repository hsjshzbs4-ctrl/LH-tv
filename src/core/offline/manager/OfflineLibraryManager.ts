// src/core/offline/manager/OfflineLibraryManager.ts - 离线媒体库管理器
// 职责：维护离线媒体列表，加载/保存/搜索/删除，验证文件存在性
// 禁止导入任何下载模块

import { storageService } from '@/shared/storage/storage.service'
import type { OfflineMedia } from '../types/offline.types'

type Subscriber = () => void

export class OfflineLibraryManager {
  private mediaMap: Map<string, OfflineMedia> = new Map()
  private subscribers: Set<Subscriber> = new Set()
  private loaded = false

  // ==================== 生命周期 ====================

  /** 从 StorageService 加载数据，填充 Map，校验文件存在性 */
  async load(): Promise<void> {
    try {
      const items = await storageService.getOfflineLibrary()
      this.mediaMap.clear()

      // 通过 legacy library 批量校验文件存在性
      const legacyMap = await this._loadLegacyFileMap()

      for (const item of items) {
        const legacyItem = legacyMap.get(item.localFilePath)
        if (legacyItem) {
          // 文件仍然存在（legacy downloader 已验证）
          item.exists = true
          item.fileSize = (legacyItem as { fileSize?: number }).fileSize ?? item.fileSize
        } else if (item.exists) {
          // 之前标记为存在，但现在不在 legacy records 中，标记为待验证
          // 保留 exists 原值，不误删
        }
        this.mediaMap.set(item.id, item)
      }

      this.loaded = true
    } catch {
      this.loaded = true
    }
  }

  // ==================== CRUD ====================

  /** 添加媒体记录（下载完成时调用） */
  async addMedia(media: OfflineMedia): Promise<void> {
    // 确保已加载现有数据
    if (!this.loaded) await this.load()

    // 获取实际文件元数据
    const legacyMap = await this._loadLegacyFileMap()
    const legacyItem = legacyMap.get(media.localFilePath)
    if (legacyItem) {
      media.fileSize = (legacyItem as { fileSize?: number }).fileSize ?? media.fileSize
    }
    media.exists = !!legacyItem

    this.mediaMap.set(media.id, media)
    await this._save()
    this._notify()
  }

  /** 删除媒体（文件 + 记录） */
  async removeMedia(id: string): Promise<void> {
    const media = this.mediaMap.get(id)
    if (!media) return

    // 删除磁盘文件
    try {
      await window.app.deleteLocalEpisode(media.localFilePath)
    } catch {
      // 文件可能已不存在
    }

    this.mediaMap.delete(id)
    await this._save()
    this._notify()
  }

  /** 获取单条记录 */
  getMedia(id: string): OfflineMedia | undefined {
    return this.mediaMap.get(id)
  }

  /** 获取全部记录 */
  getAllMedia(): OfflineMedia[] {
    return Array.from(this.mediaMap.values())
  }

  /** 搜索（标题 + 集数标签，不区分大小写） */
  search(keyword: string): OfflineMedia[] {
    if (!keyword.trim()) return this.getAllMedia()
    const kw = keyword.toLowerCase()
    return this.getAllMedia().filter(
      (m) =>
        m.title.toLowerCase().includes(kw) ||
        m.episodeLabel.toLowerCase().includes(kw),
    )
  }

  // ==================== 订阅 ====================

  /** 订阅状态变更，返回取消函数 */
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /** 是否已加载 */
  get isLoaded(): boolean {
    return this.loaded
  }

  // ==================== 内部方法 ====================

  /** 持久化到 StorageService */
  private async _save(): Promise<void> {
    try {
      await storageService.setOfflineLibrary(
        Array.from(this.mediaMap.values()),
      )
    } catch {
      // 保存失败不抛
    }
  }

  /** 通知所有订阅者 */
  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try { fn() } catch { /* 忽略 */ }
    })
  }

  /**
   * 从 legacy downloader 加载文件映射表
   * 用于校验文件存在性 + 获取实际文件大小
   */
  private async _loadLegacyFileMap(): Promise<Map<string, { filePath: string; fileSize?: number }>> {
    try {
      const lib = await window.app.getLocalLibrary()
      const map = new Map<string, { filePath: string; fileSize?: number }>()
      for (const show of lib) {
        if (show.episodes) {
          for (const ep of show.episodes) {
            map.set(ep.filePath, ep as unknown as { filePath: string; fileSize?: number })
          }
        }
      }
      return map
    } catch {
      return new Map()
    }
  }
}
