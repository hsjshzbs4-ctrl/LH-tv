// src/core/download/facade/DownloadFacade.ts - View 层唯一下载入口
// View 禁止直接访问 DownloadManager / DownloadQueue / IPC

import { DownloadManager } from '../manager/DownloadManager'
import type {
  DownloadTask,
  DownloadStatus,
  CreateDownloadTaskParams,
} from '../types/download.types'

export class DownloadFacade {
  private manager: DownloadManager

  constructor() {
    this.manager = new DownloadManager()
  }

  /** 创建下载任务，返回任务 ID */
  addTask(params: CreateDownloadTaskParams): string {
    return this.manager.addTask(params)
  }

  /** 暂停任务 */
  pauseTask(id: string): void {
    this.manager.pauseTask(id)
  }

  /** 恢复任务 */
  resumeTask(id: string): void {
    this.manager.resumeTask(id)
  }

  /** 恢复下载 */
  async recoverTask(id: string): Promise<void> {
    return this.manager.recoverTask(id)
  }

  /** 取消任务 */
  cancelTask(id: string): void {
    this.manager.cancelTask(id)
  }

  /** 移除已完成/失败的任务 */
  removeTask(id: string): void {
    this.manager.removeTask(id)
  }

  /** 获取单个任务 */
  getTask(id: string): DownloadTask | undefined {
    return this.manager.getTask(id)
  }

  /** 获取任务列表（可选按状态过滤） */
  getTasks(filter?: DownloadStatus): DownloadTask[] {
    return this.manager.getTasks(filter)
  }

  /** 订阅状态变更，返回取消函数 */
  subscribe(fn: () => void): () => void {
    return this.manager.subscribe(fn)
  }

  /** 销毁（注销所有监听） */
  destroy(): void {
    this.manager.destroy()
  }
}

/** 全局单例 */
export const downloadFacade = new DownloadFacade()
