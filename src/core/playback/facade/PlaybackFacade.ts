// src/core/playback/facade/PlaybackFacade.ts - 播放门面（View 层唯一切入点）
// P4.2 Intelligent Source Switching
//
// 禁止 View 直接访问 SourceSwitchManager

import { SourceSwitchManager } from '../manager/SourceSwitchManager'
import type { SwitchConfig } from '../manager/SourceSwitchManager'
import type { PlaybackSource, SourceSwitchEventData } from '../types/playback.types'

export class PlaybackFacade {
  private manager: SourceSwitchManager

  constructor(config?: Partial<SwitchConfig>) {
    this.manager = new SourceSwitchManager(config)
  }

  /** 开始播放：初始化源队列，返回最佳源 */
  start(mediaId: string, sources: PlaybackSource[], episodeNumber: number): PlaybackSource | null {
    return this.manager.start(mediaId, sources, episodeNumber)
  }

  /** 当前源失败 → 获取下一个源（null = 全部耗尽） */
  onFailed(reason?: string): PlaybackSource | null {
    return this.manager.onFailed(reason)
  }

  /** 当前源播放成功 */
  onSuccess(mediaId: string): void {
    this.manager.onSuccess(mediaId)
  }

  /** 手动切换到指定 Provider */
  switchToProvider(providerId: string): PlaybackSource | null {
    return this.manager.switchToProvider(providerId)
  }

  /** 保存播放进度 */
  saveProgress(time: number): void {
    this.manager.saveProgress(time)
  }

  /** 获取保存的进度 */
  getSavedProgress(): number {
    return this.manager.getSavedProgress()
  }

  /** 清除进度 */
  clearProgress(): void {
    this.manager.clearProgress()
  }

  /** 获取当前源 */
  getCurrentSource(): PlaybackSource | null {
    return this.manager.getCurrentSource()
  }

  /** 剩余重试次数 */
  get remainingRetries(): number {
    return this.manager.remainingRetries
  }

  /** 是否有更多源 */
  get hasMoreSources(): boolean {
    return this.manager.hasMoreSources
  }

  /** 设置源切换结果回调（健康追踪） */
  set onSwitchResult(callback: ((providerId: string, success: boolean) => void) | undefined) {
    this.manager.onSwitchResult = callback
  }

  /** 清除成功缓存 */
  clearSuccessCache(mediaId?: string): void {
    this.manager.clearSuccessCache(mediaId)
  }

  /** 订阅源切换事件 */
  subscribe(callback: (data: SourceSwitchEventData) => void): () => void {
    return this.manager.subscribe(callback)
  }
}
