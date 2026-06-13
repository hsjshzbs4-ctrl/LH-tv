// src/core/download/manager/DownloadManager.ts - 核心下载调度器
// 职责：
//   1. 维护 Map<string, DownloadTask> 作为唯一状态源 (SSOT)
//   2. 创建/暂停/恢复/取消任务
//   3. 监听 IPC 事件同步状态（纯事件驱动，不轮询）
//   4. 通知所有 subscriber

import type {
  DownloadTask,
  DownloadStatus,
  CreateDownloadTaskParams,
  LegacyProgressData,
  LegacyCompleteData,
  LegacyErrorData,
} from '../types/download.types'
import { DownloadQueue } from '../queue/DownloadQueue'
import { TaskScheduler } from '../queue/TaskScheduler'
import type { StartTaskFn } from '../queue/TaskScheduler'
import { DownloadPersistenceManager } from '../persistence/DownloadPersistenceManager'
import { RecoveryManager } from '../recovery/RecoveryManager'
import { offlineLibraryFacade } from '@/core/offline'

/** 订阅回调类型 */
type Subscriber = () => void

export class DownloadManager {
  /** 任务状态唯一源 */
  private tasks: Map<string, DownloadTask> = new Map()

  /** legacyId → internal id 反向映射 */
  private legacyMap: Map<string, string> = new Map()

  /** 订阅者集合 */
  private subscribers: Set<Subscriber> = new Set()

  /** 等待队列 */
  private queue: DownloadQueue = new DownloadQueue()

  /** 并发调度器（回调注入） */
  private scheduler: TaskScheduler

  /** 持久化管理器 */
  private persistence: DownloadPersistenceManager

  /** 恢复引擎 */
  private recovery: RecoveryManager

  /** 内部任务计数器 */
  private taskCounter = 0

  /** 是否已完成恢复 */
  private restored = false

  /** IPC 事件注销函数 */
  private offProgress: (() => void) | null = null
  private offComplete: (() => void) | null = null
  private offError: (() => void) | null = null

  constructor() {
    this.persistence = new DownloadPersistenceManager()
    this.recovery = new RecoveryManager()

    // 回调注入：启动任务的实际逻辑
    const startTaskFn: StartTaskFn = (task) => this._doStartDownload(task)
    this.scheduler = new TaskScheduler(this.queue, startTaskFn, 3)

    // 注册 IPC 事件监听
    this._setupIpcListeners()

    // 恢复持久化的任务（fire-and-forget）
    this.restore()
  }

  // ==================== 公共 API ====================

  /** 创建下载任务 */
  addTask(params: CreateDownloadTaskParams): string {
    const id = this._generateId()
    const now = Date.now()

    const task: DownloadTask = {
      id,
      mediaId: params.mediaId,
      providerId: params.providerId,
      providerName: params.providerName,
      episodeId: params.episodeId,
      episodeLabel: params.episodeLabel,
      episodeNum: params.episodeNum,
      title: params.title,
      cover: params.cover,
      sourceUrl: params.sourceUrl,
      status: 'pending',
      progress: 0,
      speed: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      supportsResume: true,
      resumeCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    this.tasks.set(id, task)
    this.queue.enqueue(task)
    this.scheduler.schedule()
    this._notify()
    this._scheduleSave()

    return id
  }

  /** 暂停任务 */
  pauseTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) return

    if (task.status === 'downloading') {
      // legacy downloader 只支持全局暂停，这里标记状态
      // 实际上通过 pauseAll 暂停所有，后续可升级为单任务暂停
      task.status = 'paused'
      task.updatedAt = Date.now()
      this._notify()
      this._scheduleSave()
    }
  }

  /** 恢复任务 */
  resumeTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) return

    if (task.status === 'paused') {
      task.status = 'downloading'
      task.updatedAt = Date.now()
      this._notify()
      this._scheduleSave()
    }
  }

  /** 恢复任务（手动触发） */
  async recoverTask(id: string): Promise<void> {
    const task = this.tasks.get(id)
    if (!task) return

    if (!this.recovery.canRecover(task)) return

    // 进入恢复状态
    task.status = 'recovering'
    task.updatedAt = Date.now()
    this._notify()

    try {
      // 调用 legacy downloader 重新下载
      const result = await this.recovery.recoverTask(task)

      // 建立新的 legacyId 映射
      if (task.legacyId) {
        this.legacyMap.delete(task.legacyId)
      }
      task.legacyId = result.id
      this.legacyMap.set(result.id, task.id)

      // 标记恢复
      this.recovery.markRecovered(task)

      // 转为下载中
      task.status = 'downloading'
      task.updatedAt = Date.now()
      this._notify()
      this._scheduleSave()
    } catch (err) {
      // 恢复失败
      task.status = 'failed'
      task.error = (err as Error).message || '恢复下载失败'
      task.updatedAt = Date.now()
      this.scheduler.onTaskFailed(task.id)
      this._notify()
      this._scheduleSave()
    }
  }

  /** 取消任务 */
  cancelTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) return

    // 清理 legacy 映射
    if (task.legacyId) {
      this.legacyMap.delete(task.legacyId)
    }

    // 从队列中移除（如果还在等待）
    this.queue.remove(id)

    // 从任务表中移除
    this.tasks.delete(id)
    this.scheduler.onTaskFailed(id)
    this._notify()
    this._scheduleSave()
  }

  /** 移除已完成/失败的任务 */
  removeTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) return
    if (task.status === 'downloading' || task.status === 'pending') {
      // 不允许移除进行中/等待中的任务，先取消
      this.cancelTask(id)
      return
    }
    this.tasks.delete(id)
    this._notify()
    this._scheduleSave()
  }

  /** 获取单个任务 */
  getTask(id: string): DownloadTask | undefined {
    return this.tasks.get(id)
  }

  /** 获取任务列表（可选按状态过滤） */
  getTasks(filter?: DownloadStatus): DownloadTask[] {
    const all = Array.from(this.tasks.values())
    if (!filter) return all
    return all.filter((t) => t.status === filter)
  }

  /** 订阅状态变更，返回取消函数 */
  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn)
    return () => {
      this.subscribers.delete(fn)
    }
  }

  /** 销毁（注销所有 IPC 监听） */
  destroy(): void {
    this.persistence.flush()
    this.offProgress?.()
    this.offComplete?.()
    this.offError?.()
    this.subscribers.clear()
  }

  // ==================== 持久化 ====================

  /**
   * 从 StorageService 恢复任务
   * 规则：downloading → paused（应用意外退出，下载已中断）
   */
  async restore(): Promise<void> {
    try {
      const tasks = await this.persistence.load()
      if (!tasks.length) {
        this.restored = true
        return
      }

      // 恢复最高计数器和时间戳
      let maxCounter = 0
      for (const task of tasks) {
        // downloading → paused
        if (task.status === 'downloading') {
          task.status = 'paused'
          task.updatedAt = Date.now()
        }

        // 清理已经不存在的 legacy 引用
        task.legacyId = undefined

        // 向后兼容：旧数据可能没有 recovery 字段
        if (task.supportsResume === undefined) task.supportsResume = true
        if (task.resumeCount === undefined) task.resumeCount = 0

        this.tasks.set(task.id, task)

        // 提取计数器
        const match = task.id.match(/_(\d+)$/)
        if (match) {
          const counter = parseInt(match[1], 10)
          if (counter > maxCounter) maxCounter = counter
        }
      }
      this.taskCounter = maxCounter
      this.restored = true
      this._notify()
    } catch {
      this.restored = true
    }
  }

  /** 触发防抖持久化 */
  private _scheduleSave(): void {
    if (!this.restored) return
    this.persistence.scheduleSave(Array.from(this.tasks.values()))
  }

  // ==================== 内部方法 ====================

  /** 生成内部任务 ID */
  private _generateId(): string {
    this.taskCounter++
    return `dl_${Date.now()}_${this.taskCounter}`
  }

  /** 注册 IPC 事件监听（事件驱动，不轮询） */
  private _setupIpcListeners(): void {
    // 下载进度
    this.offProgress = window.app.onDownloadProgress((data: LegacyProgressData) => {
      const internalId = this.legacyMap.get(data.id)
      if (!internalId) return
      const task = this.tasks.get(internalId)
      if (!task) return
      task.progress = data.progress
      task.updatedAt = Date.now()
      this._notify()
      this._scheduleSave()
    })

    // 下载完成
    this.offComplete = window.app.onDownloadComplete((data: LegacyCompleteData) => {
      const internalId = this.legacyMap.get(data.id)
      if (!internalId) return
      const task = this.tasks.get(internalId)
      if (!task) return
      task.status = 'completed'
      task.progress = 100
      task.localFilePath = data.filePath
      task.updatedAt = Date.now()
      // 清理映射
      this.legacyMap.delete(data.id)
      this.scheduler.onTaskComplete(task.id)
      this._notify()
      this._scheduleSave()

      // 自动入库到离线媒体库
      offlineLibraryFacade.addMedia({
        id: task.id,
        mediaId: task.mediaId,
        episodeId: task.episodeId,
        providerId: task.providerId,
        title: task.title,
        cover: task.cover,
        episodeLabel: task.episodeLabel,
        localFilePath: data.filePath,
        fileSize: 0,
        downloadedAt: Date.now(),
        exists: true,
      }).catch(() => {
        // 入库失败不阻塞下载完成流程
      })
    })

    // 下载错误
    this.offError = window.app.onDownloadError((data: LegacyErrorData) => {
      const internalId = this.legacyMap.get(data.id)
      if (!internalId) return
      const task = this.tasks.get(internalId)
      if (!task) return
      task.status = 'failed'
      task.error = data.error
      task.updatedAt = Date.now()
      this.legacyMap.delete(data.id)
      this.scheduler.onTaskFailed(task.id)
      this._notify()
      this._scheduleSave()
    })
  }

  /** 实际启动下载（由 Scheduler 回调触发） */
  private async _doStartDownload(task: DownloadTask): Promise<void> {
    try {
      // 构建 legacy downloader 需要的参数
      const legacyTask = {
        showName: task.title,
        episodeLabel: task.episodeLabel,
        episodeNum: task.episodeNum,
        url: task.sourceUrl,
        type: task.sourceUrl.includes('.m3u8') ? ('m3u8' as const) : ('mp4' as const),
      }

      const result = await window.app.downloadEpisode(legacyTask)

      // 回填 legacyId，建立映射
      task.legacyId = result.id
      this.legacyMap.set(result.id, task.id)

      task.status = 'downloading'
      task.updatedAt = Date.now()
      this._notify()
      this._scheduleSave()
    } catch (err) {
      task.status = 'failed'
      task.error = (err as Error).message || '启动下载失败'
      task.updatedAt = Date.now()
      this.scheduler.onTaskFailed(task.id)
      this._notify()
      this._scheduleSave()
    }
  }

  /** 通知所有订阅者 */
  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try {
        fn()
      } catch {
        // 忽略单个订阅者的错误
      }
    })
  }
}
