// src/core/download/queue/TaskScheduler.ts - 下载任务调度器
// 职责：控制最大并发数，从队列取任务分发给 Manager
// 采用回调注入避免循环依赖

import type { DownloadTask } from '../types/download.types'
import type { DownloadQueue } from './DownloadQueue'

/** 启动任务回调类型 */
export type StartTaskFn = (task: DownloadTask) => Promise<void>

export class TaskScheduler {
  private maxConcurrent: number
  private activeTasks: Set<string> = new Set()
  private queue: DownloadQueue
  private startTask: StartTaskFn

  constructor(
    queue: DownloadQueue,
    startTask: StartTaskFn,
    maxConcurrent = 3,
  ) {
    this.queue = queue
    this.startTask = startTask
    this.maxConcurrent = Math.max(1, maxConcurrent)
  }

  /** 当前活跃任务数 */
  get activeCount(): number {
    return this.activeTasks.size
  }

  /** 最大并发数 */
  get max(): number {
    return this.maxConcurrent
  }

  /** 检查是否可以启动新任务，如果可以则执行 */
  schedule(): void {
    while (this.activeTasks.size < this.maxConcurrent) {
      const task = this.queue.dequeue()
      if (!task) break

      this.activeTasks.add(task.id)
      // fire-and-forget: 启动失败由回调处理
      this.startTask(task).catch(() => {
        // 错误已在 onTaskFailed 中处理
      })
    }
  }

  /** 任务完成，释放槽位并调度下一个 */
  onTaskComplete(taskId: string): void {
    this.activeTasks.delete(taskId)
    this.schedule()
  }

  /** 任务失败，释放槽位并调度下一个 */
  onTaskFailed(taskId: string): void {
    this.activeTasks.delete(taskId)
    this.schedule()
  }

  /** 任务暂停，释放槽位并调度下一个 */
  onTaskPaused(taskId: string): void {
    this.activeTasks.delete(taskId)
    this.schedule()
  }
}
