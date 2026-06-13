// src/core/offline/facade/OfflineLibraryFacade.ts - 离线媒体库 View 入口
// View 禁止直接访问 OfflineLibraryManager / StorageService

import { OfflineLibraryManager } from '../manager/OfflineLibraryManager'
import type { OfflineMedia } from '../types/offline.types'

export class OfflineLibraryFacade {
  private manager = new OfflineLibraryManager()

  /** 初始化加载 */
  async load(): Promise<void> {
    return this.manager.load()
  }

  /** 添加媒体（下载完成时由 DownloadManager 调用） */
  async addMedia(media: OfflineMedia): Promise<void> {
    return this.manager.addMedia(media)
  }

  /** 删除媒体 */
  async removeMedia(id: string): Promise<void> {
    return this.manager.removeMedia(id)
  }

  /** 获取单条 */
  getMedia(id: string): OfflineMedia | undefined {
    return this.manager.getMedia(id)
  }

  /** 获取全部 */
  getAllMedia(): OfflineMedia[] {
    return this.manager.getAllMedia()
  }

  /** 搜索 */
  search(keyword: string): OfflineMedia[] {
    return this.manager.search(keyword)
  }

  /** 订阅，返回取消函数 */
  subscribe(callback: () => void): () => void {
    return this.manager.subscribe(callback)
  }

  /** 是否已加载 */
  get isLoaded(): boolean {
    return this.manager.isLoaded
  }
}

/** 全局单例 */
export const offlineLibraryFacade = new OfflineLibraryFacade()
