// src/core/download/queue/DownloadQueue.ts - 下载等待队列
// 职责：维护等待中的下载任务（纯数据结构，不处理下载逻辑）

import type { DownloadTask } from '../types/download.types'

export class DownloadQueue {
  private queue: DownloadTask[] = []

  /** 入队 */
  enqueue(task: DownloadTask): void {
    this.queue.push(task)
  }

  /** 出队（FIFO） */
  dequeue(): DownloadTask | undefined {
    return this.queue.shift()
  }

  /** 移除指定任务 */
  remove(taskId: string): boolean {
    const index = this.queue.findIndex((t) => t.id === taskId)
    if (index === -1) return false
    this.queue.splice(index, 1)
    return true
  }

  /** 队列长度 */
  size(): number {
    return this.queue.length
  }

  /** 清空队列 */
  clear(): void {
    this.queue = []
  }

  /** 获取队列中所有任务（只读） */
  getAll(): readonly DownloadTask[] {
    return this.queue
  }
}
