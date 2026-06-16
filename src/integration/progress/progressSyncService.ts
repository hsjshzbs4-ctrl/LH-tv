// src/integration/progress/progressSyncService.ts — PB2-S2 Progress Sync

import { historyFacade } from '@/core/history'
import { integrationEvents, IntegrationEvent } from '../events/integrationEvents'

interface SyncState {
  mediaId: string
  episodeId: string
  currentTime: number
  duration: number
  lastSyncAt: number
}

export class ProgressSyncService {
  private state: SyncState | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private syncIntervalMs: number

  constructor(syncIntervalMs: number = 30_000) {
    this.syncIntervalMs = syncIntervalMs
  }

  /** 开始追踪（播放开始时调用） */
  startTracking(mediaId: string, episodeId: string, duration: number = 0): void {
    this.stopTracking()
    this.state = { mediaId, episodeId, currentTime: 0, duration, lastSyncAt: Date.now() }
    // 每 30s 自动同步
    this.timer = setInterval(() => this.sync(), this.syncIntervalMs)
  }

  /** 更新当前位置 */
  updatePosition(currentTime: number, duration: number): void {
    if (!this.state) return
    this.state.currentTime = currentTime
    this.state.duration = duration
  }

  /** 手动同步 */
  async sync(): Promise<void> {
    if (!this.state || this.state.currentTime <= 0) return
    try {
      await historyFacade.updateProgress(
        this.state.episodeId,
        this.state.currentTime,
        this.state.duration,
      )
      this.state.lastSyncAt = Date.now()
      integrationEvents.emit(IntegrationEvent.PROGRESS_SYNCED, {
        mediaId: this.state.mediaId,
        episodeId: this.state.episodeId,
        position: this.state.currentTime,
      })
    } catch { /* 静默 */ }
  }

  /** 暂停时同步 */
  syncOnPause(currentTime: number, duration: number): void {
    this.updatePosition(currentTime, duration)
    this.sync()
  }

  /** 退出时同步 */
  async syncOnExit(currentTime: number, duration: number): Promise<void> {
    this.updatePosition(currentTime, duration)
    await this.sync()
    this.stopTracking()
  }

  /** 剧集完成时同步 */
  async syncOnComplete(currentTime: number, duration: number): Promise<void> {
    this.updatePosition(currentTime, duration)
    await this.sync()
    integrationEvents.emit(IntegrationEvent.PLAYER_COMPLETED, {
      mediaId: this.state?.mediaId,
      episodeId: this.state?.episodeId,
    })
  }

  /** 停止追踪 */
  stopTracking(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.state = null
  }
}
